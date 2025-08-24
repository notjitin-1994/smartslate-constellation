import { getSupabase } from '@/services/supabase'
import type { 
  Constellation, 
  MediaItem, 
  LearningArtifact, 
  Starmap,
  AIAnalysis 
} from '@/types/constellation'

export class ConstellationService {
  private supabase = getSupabase()

  // Fetch all constellations for the current user
  async getUserConstellations(): Promise<Constellation[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Try nested select with proper relationship aliasing
    let { data, error } = await this.supabase
      .from('constellations')
      .select(`
        *,
        media_items (*),
        artifacts:learning_artifacts (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Graceful fallback when relationships/tables are missing
    if (error) {
      try {
        const fallback = await this.supabase
          .from('constellations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        data = fallback.data as any
        error = fallback.error as any
      } catch (e) {
        throw error
      }
    }

    // Ensure arrays exist
    return (data || []).map((c: any) => ({
      ...c,
      media_items: c.media_items || [],
      artifacts: c.artifacts || [],
    }))
  }

  // Get a single constellation by ID
  async getConstellation(id: string): Promise<Constellation | null> {
    // Try nested select with alias
    let { data, error } = await this.supabase
      .from('constellations')
      .select(`
        *,
        media_items (*),
        artifacts:learning_artifacts (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      // Fallback to base select
      const fallback = await this.supabase
        .from('constellations')
        .select('*')
        .eq('id', id)
        .single()
      if (fallback.error) throw fallback.error
      const c: any = fallback.data
      return { ...c, media_items: [], artifacts: [] } as any
    }
    // Ensure arrays exist
    return { ...(data as any), media_items: (data as any)?.media_items || [], artifacts: (data as any)?.artifacts || [] } as any
  }

  // Create a new constellation
  async createConstellation(
    title: string,
    description: string,
    starmapId?: string,
    metadata?: any
  ): Promise<Constellation> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('constellations')
      .insert({
        user_id: user.id,
        title,
        description,
        starmap_id: starmapId,
        status: 'draft',
        metadata
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update constellation
  async updateConstellation(
    id: string,
    updates: Partial<Constellation>
  ): Promise<Constellation> {
    const { data, error } = await this.supabase
      .from('constellations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete constellation
  async deleteConstellation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('constellations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Add media item to constellation
  async addMediaItem(
    constellationId: string,
    mediaItem: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<MediaItem> {
    const { data, error } = await this.supabase
      .from('media_items')
      .insert({
        ...mediaItem,
        constellation_id: constellationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Upload file to storage
  async uploadFile(
    constellationId: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${constellationId}/${Date.now()}.${fileExt}`
    const filePath = `constellation-media/${fileName}`

    const { error: uploadError } = await this.supabase.storage
      .from('public-assets')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = this.supabase.storage
      .from('public-assets')
      .getPublicUrl(filePath)

    return {
      url: data.publicUrl,
      path: filePath
    }
  }

  // Update media item with AI analysis
  async updateMediaAnalysis(
    mediaId: string,
    analysis: AIAnalysis
  ): Promise<MediaItem> {
    const { data, error } = await this.supabase
      .from('media_items')
      .update({ ai_analysis: analysis })
      .eq('id', mediaId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Add learning artifact
  async addArtifact(
    constellationId: string,
    artifact: Omit<LearningArtifact, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LearningArtifact> {
    const { data, error } = await this.supabase
      .from('learning_artifacts')
      .insert({
        ...artifact,
        constellation_id: constellationId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Fetch starmaps from Polaris
  async fetchStarmaps(): Promise<Starmap[]> {
    try {
      // Call our server-side proxy which uses Polaris service key
      const response = await fetch('/api/starmaps/me', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        const data = await response.json()
        return data.starmaps || []
      }
    } catch (error) {
      console.error('Failed to fetch Polaris starmaps via proxy:', error)
    }

    // Fallback to fetch from shared database table
    const { data, error } = await this.supabase
      .from('starmaps')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch starmaps:', error)
      return []
    }

    return data || []
  }

  // Fetch only the current user's starmaps (created in Polaris)
  async fetchUserStarmaps(): Promise<Starmap[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('starmaps')
      .select('*')
      .eq('created_by', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch user starmaps:', error)
      return []
    }
    return data || []
  }

  // Subscribe to realtime changes for the current user's starmaps
  subscribeToUserStarmaps(
    handler: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void
  ): () => void {
    const channel = this.supabase.channel(`starmaps-user`)
    
    // We need the user id to scope filter; get it async then attach handlers
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      const userId = user?.id
      if (!userId) return
      channel.on('postgres_changes', {
        schema: 'public',
        table: 'starmaps',
        event: '*',
        filter: `created_by=eq.${userId}`,
      }, (payload: any) => {
        handler(payload.eventType as any, payload.new || payload.old)
      }).subscribe()
    })

    return () => {
      try { this.supabase.removeChannel(channel) } catch {}
    }
  }

  // Get a specific starmap
  async getStarmap(id: string): Promise<Starmap | null> {
    try {
      // Try Polaris API first
      const response = await fetch(`https://polaris.smartslate.io/api/starmaps/${id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.starmap
      }
    } catch (error) {
      console.error('Failed to fetch from Polaris API:', error)
    }

    // Fallback to database
    const { data, error } = await this.supabase
      .from('starmaps')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch starmap:', error)
      return null
    }

    return data
  }
}

export const constellationService = new ConstellationService()
