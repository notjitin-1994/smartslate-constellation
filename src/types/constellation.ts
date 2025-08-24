// Constellation Types

export interface Starmap {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  modules?: StarmapModule[]
  metadata?: Record<string, any>
}

export interface StarmapModule {
  id: string
  title: string
  description: string
  order: number
  content?: any
}

export interface Constellation {
  id: string
  user_id: string
  title: string
  description: string
  starmap_id?: string
  status: 'draft' | 'processing' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  media_items?: MediaItem[]
  artifacts?: LearningArtifact[]
  metadata?: ConstellationMetadata
}

export interface MediaItem {
  id: string
  constellation_id: string
  type: 'text' | 'document' | 'video' | 'audio' | 'image' | 'link' | 'other'
  file_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  content?: string
  user_context?: string
  ai_analysis?: AIAnalysis
  created_at: string
  updated_at: string
  order: number
}

export interface AIAnalysis {
  summary: string
  key_concepts: string[]
  learning_objectives?: string[]
  content_type?: string
  duration_estimate?: string
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  metadata?: Record<string, any>
}

export interface LearningArtifact {
  id: string
  constellation_id: string
  type: ArtifactType
  title: string
  content: any
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export type ArtifactType = 
  | 'storyboard'
  | 'voiceover_script'
  | 'sound_inspiration'
  | 'color_palette'
  | 'tone_guide'
  | 'learning_objectives'
  | 'assessment_questions'
  | 'interaction_design'
  | 'visual_design'
  | 'course_outline'
  | 'lesson_plan'
  | 'engagement_strategy'
  | 'accessibility_guide'
  | 'implementation_notes'

export interface ConstellationMetadata {
  target_audience?: string
  duration?: string
  modality?: string[]
  learning_style?: string[]
  prerequisites?: string[]
  tags?: string[]
  constraints?: string[]
  preferences?: Record<string, any>
}

export interface StoryboardSlide {
  slide_number: number
  title: string
  visual_description: string
  narration_text: string
  on_screen_text?: string
  interactions?: string[]
  notes?: string
  duration_seconds?: number
  transition?: string
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  additional_colors?: Record<string, string>
  rationale?: string
}

export interface VoiceoverScript {
  sections: ScriptSection[]
  tone: string
  pace: string
  total_duration?: string
}

export interface ScriptSection {
  id: string
  title: string
  text: string
  notes?: string
  duration_seconds?: number
}

export interface SoundInspiration {
  mood: string
  genre: string
  tempo: string
  instruments?: string[]
  reference_tracks?: string[]
  description: string
}
