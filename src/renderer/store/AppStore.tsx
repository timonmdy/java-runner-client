import React, {
  createContext, useContext, useReducer, useEffect, useCallback, type ReactNode,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, AppSettings, ProcessState, ConsoleLine } from '../types'
import { reducer, INITIAL_STATE, type AppState } from './appReducer'
import { loadLogs, clearLogs } from './sessionLogs'
import { PROFILE_COLORS } from '../../config/Profile.config'


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

  // Initial load
  useEffect(() => {
    if (!window.api) return
    async function init() {
      const [profiles, settings, states] = await Promise.all([
        window.api.getProfiles(),
        window.api.getSettings(),
        window.api.getStates(),
      ])
      dispatch({ type: 'INIT', profiles, settings, states })
      const max = settings?.consoleMaxLines ?? 5000
      for (const p of profiles) {
        const lines = loadLogs(p.id, max)
        if (lines.length > 0) dispatch({ type: 'LOAD_LOG', profileId: p.id, lines })
      }
    }
    init()
  }, [])

  // Console line streaming
  useEffect(() => {
    if (!window.api) return
    const max = state.settings?.consoleMaxLines ?? 5000
    return window.api.onConsoleLine((profileId: string, line: unknown) => {
      dispatch({ type: 'APPEND_LOG', profileId, line: line as ConsoleLine, maxLines: max })
    })
  }, [state.settings?.consoleMaxLines])

  // Process state updates
  useEffect(() => {
    if (!window.api) return
    return window.api.onStatesUpdate((states: ProcessState[]) =>
      dispatch({ type: 'SET_STATES', states })
    )
  }, [])

  const setActiveProfile = useCallback((id: string) =>
    dispatch({ type: 'SET_ACTIVE', id }), [])

  const saveProfile = useCallback(async (p: Profile) => {
    await window.api.saveProfile(p)
    dispatch({ type: 'SET_PROFILES', profiles: await window.api.getProfiles() })
  }, [])

  const deleteProfile = useCallback(async (id: string) => {
    clearLogs(id)
    await window.api.deleteProfile(id)
    const profiles = await window.api.getProfiles()
    dispatch({ type: 'SET_PROFILES', profiles })
    if (state.activeProfileId === id) {
      dispatch({ type: 'SET_ACTIVE', id: profiles[0]?.id ?? '' })
    }
  }, [state.activeProfileId])

  const createProfile = useCallback(() => {
    const p: Profile = {
      id: uuidv4(),
      name: 'New Profile',
      jarPath: '',
      workingDir: '',
      jvmArgs: [{ value: '-Xmx1g', enabled: true }],
      systemProperties: [],
      programArgs: [],
      javaPath: '',
      autoStart: false,
      autoRestart: false,
      autoRestartInterval: 10,
      color: PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    dispatch({ type: 'SET_PROFILES', profiles: [...state.profiles, p] })
    dispatch({ type: 'SET_ACTIVE', id: p.id })
    window.api.saveProfile(p)
  }, [state.profiles])

  const startProcess = useCallback((p: Profile) => window.api.startProcess(p), [])
  const stopProcess  = useCallback((id: string) => window.api.stopProcess(id), [])
  const sendInput    = useCallback((profileId: string, input: string) =>
    window.api.sendInput(profileId, input), [])
  const clearConsole = useCallback((profileId: string) =>
    dispatch({ type: 'CLEAR_LOG', profileId }), [])
  const saveSettings = useCallback(async (s: AppSettings) => {
    await window.api.saveSettings(s)
    dispatch({ type: 'SET_SETTINGS', settings: s })
  }, [])
  const isRunning = useCallback((profileId: string) =>
    state.processStates.some(s => s.profileId === profileId && s.running),
    [state.processStates])

  const activeProfile = state.profiles.find(p => p.id === state.activeProfileId)

  return (
    <AppContext.Provider value={{
      state, activeProfile, setActiveProfile, saveProfile, deleteProfile,
      createProfile, startProcess, stopProcess, sendInput, clearConsole,
      saveSettings, isRunning,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
