import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, AppSettings } from './shared/types'

const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup:    false,
  startMinimized:     false,
  minimizeToTray:     true,
  consoleFontSize:    13,
  consoleMaxLines:    5000,
  consoleWordWrap:    false,
  consoleLineNumbers: false,
  consoleHistorySize: 200,
  theme:              'dark',
}

const DEFAULT_PROFILE: Profile = {
  id: uuidv4(), name: 'Default', jarPath: '', workingDir: '',
  jvmArgs: [{ value: '-Xmx1g', enabled: true }],
  systemProperties: [], programArgs: [], javaPath: '',
  autoStart: false, color: '#4ade80',
  createdAt: Date.now(), updatedAt: Date.now(),
}

interface StoreSchema { profiles: Profile[]; settings: AppSettings; activeProfileId: string }

const store = new Store<StoreSchema>({
  name: 'java-runner-config',
  defaults: { profiles: [DEFAULT_PROFILE], settings: DEFAULT_SETTINGS, activeProfileId: DEFAULT_PROFILE.id },
})

export const getAllProfiles  = (): Profile[]    => store.get('profiles')
export const getSettings     = (): AppSettings  => ({ ...DEFAULT_SETTINGS, ...store.get('settings') })

export function saveProfile(profile: Profile): void {
  const profiles = getAllProfiles()
  const idx = profiles.findIndex(p => p.id === profile.id)
  if (idx >= 0) profiles[idx] = { ...profile, updatedAt: Date.now() }
  else profiles.push({ ...profile, createdAt: Date.now(), updatedAt: Date.now() })
  store.set('profiles', profiles)
}

export function deleteProfile(id: string): void {
  const profiles = getAllProfiles().filter(p => p.id !== id)
  store.set('profiles', profiles)
  if (store.get('activeProfileId') === id)
    store.set('activeProfileId', profiles[0]?.id ?? '')
}

export function saveSettings(settings: AppSettings): void { store.set('settings', settings) }
