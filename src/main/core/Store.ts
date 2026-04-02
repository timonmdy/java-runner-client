import { app } from 'electron';
import Store from 'electron-store';
import { DEFAULT_SETTINGS } from '../shared/config/Settings.config';
import { AppSettings } from '../shared/config/Settings.config';
import { Profile } from '../shared/types/Profile.types';

interface StoreSchema {
  profiles: Profile[];
  settings: AppSettings;
}

const store = new Store<StoreSchema>({
  name: 'java-runner-config',
  defaults: { profiles: [], settings: DEFAULT_SETTINGS },
});

export function getAllProfiles(): Profile[] {
  const profiles = store.get('profiles', []);
  return [...profiles].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function saveProfile(profile: Profile): void {
  const profiles = getAllProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  profile.updatedAt = Date.now();
  if (idx >= 0) profiles[idx] = profile;
  else {
    profile.order = profiles.length;
    profiles.push(profile);
  }
  store.set('profiles', profiles);
}

export function deleteProfile(id: string): void {
  store.set(
    'profiles',
    getAllProfiles().filter((p) => p.id !== id)
  );
}

export function reorderProfiles(orderedIds: string[]): void {
  const profiles = getAllProfiles();
  const updated = profiles.map((p) => ({
    ...p,
    order: orderedIds.indexOf(p.id),
  }));
  store.set('profiles', updated);
}

export function toggleDevMode(enabled: boolean): void {
  const settings = getSettings();
  settings.devModeEnabled = enabled;
  saveSettings(settings);
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings', DEFAULT_SETTINGS) };
}

export function saveSettings(settings: AppSettings): void {
  const prev = getSettings();
  store.set('settings', settings);
  if (
    settings.launchOnStartup !== prev.launchOnStartup ||
    settings.startMinimized !== prev.startMinimized
  ) {
    syncLoginItem(settings.launchOnStartup, settings.startMinimized);
  }
}

export function syncLoginItem(openAtLogin: boolean, startMinimized: boolean): void {
  if (!app.isPackaged) return;
  const args = ['--autostart', startMinimized && '--minimized'].filter(Boolean) as string[];
  app.setLoginItemSettings({
    openAtLogin,
    args,
  });
}
