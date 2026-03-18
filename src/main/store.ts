import Store from 'electron-store'
import type { Profile, AppSettings } from './shared/types'

interface StoreSchema {
  profiles: Profile[]
  settings: AppSettings
}

const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup: false,
  startMinimized: false,
  minimizeToTray: true,
  consoleFontSize: 13,
  consoleMaxLines: 5000,
  consoleWordWrap: false,
  consoleLineNumbers: false,
  consoleHistorySize: 200,
  theme: 'dark',
}

const store = new Store<StoreSchema>({
  name: 'java-runner-config',
  defaults: { profiles: [], settings: DEFAULT_SETTINGS },
})

export function getAllProfiles(): Profile[] {
  return store.get('profiles', [])
}

export function saveProfile(profile: Profile): void {
  const profiles = getAllProfiles()
  const idx = profiles.findIndex(p => p.id === profile.id)
  profile.updatedAt = Date.now()
  if (idx >= 0) profiles[idx] = profile
  else profiles.push(profile)
  store.set('profiles', profiles)
}

export function deleteProfile(id: string): void {
  store.set('profiles', getAllProfiles().filter(p => p.id !== id))
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings', DEFAULT_SETTINGS) }
}

export function saveSettings(settings: AppSettings): void {
  store.set('settings', settings)
}
