import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, AppSettings, ProcessState, ConsoleLine } from '../types'

const SS_KEY = (id: string) => `jrc:console:${id}`
function loadLogs(id: string, max: number): ConsoleLine[] {
  try { const r = sessionStorage.getItem(SS_KEY(id)); return r ? (JSON.parse(r) as ConsoleLine[]).slice(-max) : [] } catch { return [] }
}
function saveLogs(id: string, lines: ConsoleLine[]): void {
  try { sessionStorage.setItem(SS_KEY(id), JSON.stringify(lines)) } catch { /* quota */ }
}
function clearLogs(id: string): void { try { sessionStorage.removeItem(SS_KEY(id)) } catch { /* ignore */ } }

interface AppState {
  profiles:        Profile[]
  activeProfileId: string
  processStates:   ProcessState[]
  settings:        AppSettings | null
  consoleLogs:     Record<string, ConsoleLine[]>
  loading:         boolean
}

const INITIAL_STATE: AppState = { profiles: [], activeProfileId: '', processStates: [], settings: null, consoleLogs: {}, loading: true }

type Action =
  | { type: 'INIT';       profiles: Profile[]; settings: AppSettings; states: ProcessState[] }
  | { type: 'SET_PROFILES'; profiles: Profile[] }
  | { type: 'SET_ACTIVE';   id: string }
  | { type: 'SET_STATES';   states: ProcessState[] }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'LOAD_LOG';     profileId: string; lines: ConsoleLine[] }
  | { type: 'APPEND_LOG';   profileId: string; line: ConsoleLine; maxLines: number }
  | { type: 'CLEAR_LOG';    profileId: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':       return { ...state, profiles: action.profiles, activeProfileId: action.profiles[0]?.id ?? '', processStates: action.states, settings: action.settings, loading: false }
    case 'SET_PROFILES': return { ...state, profiles: action.profiles }
    case 'SET_ACTIVE':   return { ...state, activeProfileId: action.id }
    case 'SET_STATES':   return { ...state, processStates: action.states }
    case 'SET_SETTINGS': return { ...state, settings: action.settings }
    case 'LOAD_LOG':     return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: action.lines } }
    case 'APPEND_LOG': {
      const prev    = state.consoleLogs[action.profileId] ?? []
      const next    = [...prev, action.line]
      const trimmed = next.length > action.maxLines ? next.slice(next.length - action.maxLines) : next
      saveLogs(action.profileId, trimmed)
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: trimmed } }
    }
    case 'CLEAR_LOG':
      clearLogs(action.profileId)
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: [] } }
    default: return state
  }
}

interface AppContextValue {
  state:            AppState
  activeProfile:    Profile | undefined
  setActiveProfile: (id: string) => void
  saveProfile:      (p: Profile) => Promise<void>
  deleteProfile:    (id: string) => Promise<void>
  createProfile:    () => void
  startProcess:     (p: Profile) => Promise<{ ok: boolean; error?: string }>
  stopProcess:      (id: string) => Promise<{ ok: boolean; error?: string }>
  sendInput:        (profileId: string, input: string) => Promise<void>
  clearConsole:     (profileId: string) => void
  saveSettings:     (s: AppSettings) => Promise<void>
  isRunning:        (profileId: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  useEffect(() => {
    if (!window.api) return
    async function init() {
      const [profiles, settings, states] = await Promise.all([window.api.getProfiles(), window.api.getSettings(), window.api.getStates()])
      dispatch({ type: 'INIT', profiles, settings, states })
      const max = settings?.consoleMaxLines ?? 5000
      for (const p of profiles) {
        const lines = loadLogs(p.id, max)
        if (lines.length > 0) dispatch({ type: 'LOAD_LOG', profileId: p.id, lines })
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!window.api) return
    const max = state.settings?.consoleMaxLines ?? 5000
    return window.api.onConsoleLine((profileId: string, line: unknown) => {
      dispatch({ type: 'APPEND_LOG', profileId, line: line as ConsoleLine, maxLines: max })
    })
  }, [state.settings?.consoleMaxLines])

  useEffect(() => {
    if (!window.api) return
    return window.api.onStatesUpdate((states) => dispatch({ type: 'SET_STATES', states }))
  }, [])

  const setActiveProfile = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE', id }), [])

  const saveProfile = useCallback(async (p: Profile) => {
    await window.api.saveProfile(p)
    dispatch({ type: 'SET_PROFILES', profiles: await window.api.getProfiles() })
  }, [])

  const deleteProfile = useCallback(async (id: string) => {
    clearLogs(id)
    await window.api.deleteProfile(id)
    const profiles = await window.api.getProfiles()
    dispatch({ type: 'SET_PROFILES', profiles })
    if (state.activeProfileId === id) dispatch({ type: 'SET_ACTIVE', id: profiles[0]?.id ?? '' })
  }, [state.activeProfileId])

  const createProfile = useCallback(() => {
    const p: Profile = {
      id: uuidv4(), name: 'New Profile', jarPath: '', workingDir: '',
      jvmArgs: [{ value: '-Xmx1g', enabled: true }], systemProperties: [], programArgs: [],
      javaPath: '', autoStart: false,
      color: PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    dispatch({ type: 'SET_PROFILES', profiles: [...state.profiles, p] })
    dispatch({ type: 'SET_ACTIVE', id: p.id })
    window.api.saveProfile(p)
  }, [state.profiles])

  const startProcess  = useCallback((p: Profile) => window.api.startProcess(p), [])
  const stopProcess   = useCallback((id: string) => window.api.stopProcess(id), [])
  const sendInput     = useCallback((profileId: string, input: string) => window.api.sendInput(profileId, input), [])
  const clearConsole  = useCallback((profileId: string) => dispatch({ type: 'CLEAR_LOG', profileId }), [])
  const saveSettings  = useCallback(async (s: AppSettings) => { await window.api.saveSettings(s); dispatch({ type: 'SET_SETTINGS', settings: s }) }, [])
  const isRunning     = useCallback((profileId: string) => state.processStates.some(s => s.profileId === profileId && s.running), [state.processStates])
  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId)

  return (
    <AppContext.Provider value={{ state, activeProfile, setActiveProfile, saveProfile, deleteProfile, createProfile, startProcess, stopProcess, sendInput, clearConsole, saveSettings, isRunning }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export const PROFILE_COLORS = ['#4ade80','#60a5fa','#f472b6','#fb923c','#a78bfa','#34d399','#fbbf24','#f87171']
