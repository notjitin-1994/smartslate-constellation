import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { SupabaseUser, ToastMessage } from '@/types'

interface AppState {
  user: SupabaseUser | null
  toasts: ToastMessage[]
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
}

type AppAction =
  | { type: 'SET_USER'; payload: SupabaseUser | null }
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }

const initialState: AppState = {
  user: null,
  toasts: [],
  sidebarCollapsed: true,
  theme: 'dark'
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { ...action.payload, id: Date.now() }
        ]
      }
    
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload }
    
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  setUser: (user: SupabaseUser | null) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setUser = useCallback((user: SupabaseUser | null) => {
    dispatch({ type: 'SET_USER', payload: user })
  }, [])

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    dispatch({ type: 'ADD_TOAST', payload: { message, type } })
  }, [])

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id })
  }, [])

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }, [])

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed })
  }, [])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }, [])

  const value = useMemo(
    () => ({
      state,
      setUser,
      addToast,
      removeToast,
      toggleSidebar,
      setSidebarCollapsed,
      setTheme
    }),
    [state, setUser, addToast, removeToast, toggleSidebar, setSidebarCollapsed, setTheme]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
