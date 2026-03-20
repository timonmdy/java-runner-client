import type { Profile, AppSettings, ProcessState, ConsoleLine } from '../types'
import { saveLogs, clearLogs } from './sessionLogs'

export interface AppState {
  profiles: Profile[]
  activeProfileId: string
  processStates: ProcessState[]
  settings: AppSettings | null
  consoleLogs: Record<string, ConsoleLine[]>
  loading: boolean
}

export const INITIAL_STATE: AppState = {
  profiles: [],
  activeProfileId: '',
  processStates: [],
  settings: null,
  consoleLogs: {},
  loading: true,
}

export type Action =
  | { type: 'INIT'; profiles: Profile[]; settings: AppSettings; states: ProcessState[] }
  | { type: 'SET_PROFILES'; profiles: Profile[] }
  | { type: 'SET_ACTIVE'; id: string }
  | { type: 'SET_STATES'; states: ProcessState[] }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'LOAD_LOG'; profileId: string; lines: ConsoleLine[] }
  | { type: 'APPEND_LOG'; profileId: string; line: ConsoleLine; maxLines: number }
  | { type: 'CLEAR_LOG'; profileId: string }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        profiles: action.profiles,
        activeProfileId: action.profiles[0]?.id ?? '',
        processStates: action.states,
        settings: action.settings,
        loading: false,
      }

    case 'SET_PROFILES':
      return { ...state, profiles: action.profiles }

    case 'SET_ACTIVE':
      return { ...state, activeProfileId: action.id }

    case 'SET_STATES':
      return { ...state, processStates: action.states }

    case 'SET_SETTINGS':
      return { ...state, settings: action.settings }

    case 'LOAD_LOG':
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: action.lines } }

    case 'APPEND_LOG': {
      const prev = state.consoleLogs[action.profileId] ?? []
      const next = [...prev, action.line]
      const trimmed =
        next.length > action.maxLines ? next.slice(next.length - action.maxLines) : next
      saveLogs(action.profileId, trimmed)
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: trimmed } }
    }

    case 'CLEAR_LOG':
      clearLogs(action.profileId)
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: [] } }

    default:
      return state
  }
}
