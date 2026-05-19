import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { DraftResult } from '@/types/architect';

export interface ConstellationState {
  activeNodeIdx: number;
  isSidebarCollapsed: boolean;
  scriptOutputs: Record<number, DraftResult>;
  lastUpdated: string;
}

const DEFAULT_STATE: ConstellationState = {
  activeNodeIdx: 0,
  isSidebarCollapsed: false,
  scriptOutputs: {},
  lastUpdated: new Date().toISOString(),
};

export function useConstellationPersistence(blueprintId: string | null) {
  const [constellationId, setConstellationId] = useState<string | null>(null);
  const [state, setState] = useState<ConstellationState>(DEFAULT_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Hydration
  useEffect(() => {
    async function hydrate() {
      if (!blueprintId) return;

      // Try Local Storage First for instant feedback
      const localKey = `constellation_state_${blueprintId}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setState(parsed.state);
          setConstellationId(parsed.id);
        } catch (e) {
          console.error('Failed to parse local storage:', e);
        }
      }

      // Fetch from Supabase (Source of Truth)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('constellation_states')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Failed to fetch constellation state:', fetchError);
      }

      if (data) {
        // If server data is newer or local is missing, use server
        const serverState = data.state_json as ConstellationState;
        setState(serverState);
        setConstellationId(data.id);
        
        // Update Local Storage
        localStorage.setItem(localKey, JSON.stringify({ id: data.id, state: serverState }));
      } else {
        // Create a new entry if none exists
        const newId = crypto.randomUUID();
        setConstellationId(newId);
        
        const { error: insertError } = await supabase
          .from('constellation_states')
          .insert({
            id: newId,
            blueprint_id: blueprintId,
            user_id: user.id,
            state_json: DEFAULT_STATE
          });
          
        if (insertError) console.error('Failed to create initial state:', insertError);
      }
    }

    hydrate();
  }, [blueprintId]);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!constellationId) return;

    const channel = supabase
      .channel(`constellation_${constellationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'constellation_states',
          filter: `id=eq.${constellationId}`,
        },
        (payload) => {
          const newState = payload.new.state_json as ConstellationState;
          // Only update if the incoming change is newer than current
          if (new Date(newState.lastUpdated) > new Date(state.lastUpdated)) {
            setState(newState);
            localStorage.setItem(`constellation_state_${blueprintId}`, JSON.stringify({ id: constellationId, state: newState }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [constellationId, blueprintId, state.lastUpdated]);

  // 3. Persistence Logic (Debounced)
  const persistState = useCallback(async (newState: ConstellationState) => {
    if (!blueprintId) return;

    // Update Local immediately
    const localKey = `constellation_state_${blueprintId}`;
    localStorage.setItem(localKey, JSON.stringify({ id: constellationId, state: newState }));

    // Debounce DB Save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!constellationId) return;
      
      setIsSyncing(true);
      const { error } = await supabase
        .from('constellation_states')
        .update({ 
          state_json: newState,
          updated_at: new Date().toISOString()
        })
        .eq('id', constellationId);

      if (error) console.error('DB Sync Failed:', error);
      setIsSyncing(false);
    }, 2000); // 2 second debounce
  }, [constellationId, blueprintId]);

  const updateState = useCallback((updates: Partial<ConstellationState>) => {
    setState(prev => {
      const next = { 
        ...prev, 
        ...updates, 
        lastUpdated: new Date().toISOString() 
      };
      persistState(next);
      return next;
    });
  }, [persistState]);

  return { state, updateState, isSyncing, constellationId };
}
