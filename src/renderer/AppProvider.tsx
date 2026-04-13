import { AppSettings } from '@shared/config/Settings.config';
import { ConsoleLine, ProcessState } from '@shared/types/Process.types';
import { Profile } from '@shared/types/Profile.types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

// ─── Session log helpers ──────────────────────────────────────────────────────

const ssKey = (id: string) => `jrc:console:${id}`;

function loadLogs(id: string, max: number): ConsoleLine[] {
  try {
    const r = sessionStorage.getItem(ssKey(id));
    return r ? (JSON.parse(r) as ConsoleLine[]).slice(-max) : [];
  } catch {
    return [];
  }
}

function saveLogs(id: string, lines: ConsoleLine[]): void {
  try {
    sessionStorage.setItem(ssKey(id), JSON.stringify(lines));
  } catch {
    /* quota */
  }
}

function clearLogs(id: string): void {
  try {
    sessionStorage.removeItem(ssKey(id));
  } catch {
    /* ignore */
  }
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface AppState {
  profiles: Profile[];
  activeProfileId: string;
  processStates: ProcessState[];
  settings: AppSettings | null;
  consoleLogs: Record<string, ConsoleLine[]>;
  loading: boolean;
}

const INITIAL_STATE: AppState = {
  profiles: [],
  activeProfileId: '',
  processStates: [],
  settings: null,
  consoleLogs: {},
  loading: true,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; profiles: Profile[]; settings: AppSettings; states: ProcessState[] }
  | { type: 'SET_PROFILES'; profiles: Profile[] }
  | { type: 'SET_ACTIVE'; id: string }
  | { type: 'SET_STATES'; states: ProcessState[] }
  | { type: 'SET_SETTINGS'; settings: AppSettings }
  | { type: 'LOAD_LOG'; profileId: string; lines: ConsoleLine[] }
  | { type: 'APPEND_LOG'; profileId: string; line: ConsoleLine; maxLines: number }
  | { type: 'CLEAR_LOG'; profileId: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        profiles: action.profiles,
        activeProfileId: action.profiles[0]?.id ?? '',
        processStates: action.states,
        settings: action.settings,
        loading: false,
      };
    case 'SET_PROFILES':
      return { ...state, profiles: action.profiles };
    case 'SET_ACTIVE':
      return { ...state, activeProfileId: action.id };
    case 'SET_STATES':
      return { ...state, processStates: action.states };
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings };
    case 'LOAD_LOG':
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: action.lines } };
    case 'APPEND_LOG': {
      const prev = state.consoleLogs[action.profileId] ?? [];
      const next = [...prev, action.line];
      const trimmed =
        next.length > action.maxLines ? next.slice(next.length - action.maxLines) : next;
      saveLogs(action.profileId, trimmed);
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: trimmed } };
    }
    case 'CLEAR_LOG':
      clearLogs(action.profileId);
      return { ...state, consoleLogs: { ...state.consoleLogs, [action.profileId]: [] } };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  activeProfile: Profile | undefined;
  setActiveProfile: (id: string) => void;
  saveProfile: (p: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  createProfile: (overrides?: Partial<Profile>) => void;
  reorderProfiles: (profiles: Profile[]) => Promise<void>;
  startProcess: (p: Profile) => Promise<{ ok: boolean; error?: string }>;
  stopProcess: (id: string) => Promise<{ ok: boolean; error?: string }>;
  forceStopProcess: (id: string) => Promise<{ ok: boolean; error?: string }>;
  sendInput: (profileId: string, input: string) => Promise<void>;
  clearConsole: (profileId: string) => void;
  saveSettings: (s: AppSettings) => Promise<void>;
  isRunning: (profileId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const PROFILE_COLORS = [
  '#4ade80',
  '#60a5fa',
  '#f472b6',
  '#fb923c',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#f87171',
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    if (!jrc.api) return;
    async function init() {
      const [profiles, settings, states] = await Promise.all([
        jrc.api.getProfiles(),
        jrc.api.getSettings(),
        jrc.api.getStates(),
      ]);
      dispatch({ type: 'INIT', profiles, settings, states });
      const max = settings?.consoleMaxLines ?? 5000;
      for (const p of profiles) {
        const lines = loadLogs(p.id, max);
        if (lines.length > 0) dispatch({ type: 'LOAD_LOG', profileId: p.id, lines });
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!jrc.api) return;
    const max = state.settings?.consoleMaxLines ?? 5000;
    return jrc.api.onConsoleLine((profileId: string, line: unknown) => {
      dispatch({ type: 'APPEND_LOG', profileId, line: line as ConsoleLine, maxLines: max });
    });
  }, [state.settings?.consoleMaxLines]);

  useEffect(() => {
    if (!jrc.api) return;
    return jrc.api.onConsoleClear((profileId) => dispatch({ type: 'CLEAR_LOG', profileId }));
  }, []);

  useEffect(() => {
    if (!jrc.api) return;
    return jrc.api.onStatesUpdate((states) => dispatch({ type: 'SET_STATES', states }));
  }, []);

  const setActiveProfile = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE', id }), []);

  const saveProfile = useCallback(async (p: Profile) => {
    await jrc.api.saveProfile(p);
    dispatch({ type: 'SET_PROFILES', profiles: await jrc.api.getProfiles() });
  }, []);

  const deleteProfile = useCallback(
    async (id: string) => {
      clearLogs(id);
      await jrc.api.deleteProfile(id);
      const profiles = await jrc.api.getProfiles();
      dispatch({ type: 'SET_PROFILES', profiles });
      if (state.activeProfileId === id) dispatch({ type: 'SET_ACTIVE', id: profiles[0]?.id ?? '' });
    },
    [state.activeProfileId]
  );

  const createProfile = useCallback(
    async (overrides: Partial<Profile> = {}) => {
      const p: Profile = {
        id: uuidv4(),
        name: overrides.name ?? 'New Profile',
        jarPath: overrides.jarPath ?? '',
        workingDir: overrides.workingDir ?? '',
        jvmArgs: overrides.jvmArgs ?? [{ value: '-Xmx1g', enabled: true }],
        systemProperties: overrides.systemProperties ?? [],
        programArgs: overrides.programArgs ?? [],
        envVars: overrides.envVars ?? [],
        javaPath: overrides.javaPath ?? '',
        autoStart: overrides.autoStart ?? false,
        autoRestart: overrides.autoRestart ?? false,
        autoRestartInterval: overrides.autoRestartInterval ?? 10,
        color: overrides.color ?? PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
        order: state.profiles.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'SET_PROFILES', profiles: [...state.profiles, p] });
      dispatch({ type: 'SET_ACTIVE', id: p.id });
      jrc.api.saveProfile(p);
    },
    [state.profiles]
  );

  const reorderProfiles = useCallback(async (profiles: Profile[]) => {
    dispatch({ type: 'SET_PROFILES', profiles });
    await jrc.api.reorderProfiles(profiles.map((p) => p.id));
  }, []);

  const startProcess = useCallback((p: Profile) => jrc.api.startProcess(p), []);
  const stopProcess = useCallback((id: string) => jrc.api.stopProcess(id), []);
  const forceStopProcess = useCallback((id: string) => jrc.api.forceStopProcess(id), []);

  const sendInput = useCallback(async (profileId: string, input: string) => {
    await jrc.api.sendInput(profileId, input);
  }, []);

  const clearConsole = useCallback(
    (profileId: string) => dispatch({ type: 'CLEAR_LOG', profileId }),
    []
  );

  const saveSettings = useCallback(async (s: AppSettings) => {
    await jrc.api.saveSettings(s);
    dispatch({ type: 'SET_SETTINGS', settings: s });
  }, []);

  const isRunning = useCallback(
    (profileId: string) => state.processStates.some((s) => s.profileId === profileId && s.running),
    [state.processStates]
  );

  const activeProfile = state.profiles.find((p) => p.id === state.activeProfileId);

  return (
    <AppContext.Provider
      value={{
        state,
        activeProfile,
        setActiveProfile,
        saveProfile,
        deleteProfile,
        createProfile,
        reorderProfiles,
        startProcess,
        stopProcess,
        forceStopProcess,
        sendInput,
        clearConsole,
        saveSettings,
        isRunning,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
