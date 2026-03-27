import type { Updatable } from '../../main/shared/types/UpdateCenter.types';
import { version } from '../../../package.json';

function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const [am, an, ap] = parse(a);
  const [bm, bn, bp] = parse(b);
  if (am !== bm) return am > bm;
  if (an !== bn) return an > bn;
  return ap > bp;
}

const appUpdatable: Updatable = {
  id: 'app',
  label: 'Application',
  description: 'Java Runner Client core application',
  check: async () => {
    const res = await window.api.fetchLatestRelease();
    if (!res.ok || !res.data)
      return {
        hasUpdate: false,
        currentVersion: version,
        remoteVersion: version,
        error: res.error,
      };
    const remote = (res.data.tag_name ?? '').replace(/^v/, '');
    return { hasUpdate: semverGt(remote, version), currentVersion: version, remoteVersion: remote };
  },
  apply: async () => ({ ok: false, error: 'Use the release modal to download the installer' }),
};

const themeUpdatable: Updatable = {
  id: 'theme',
  label: 'Theme',
  description: 'Currently active visual theme',
  check: async () => {
    const state = await window.api.getThemeState();
    const res = await window.api.checkThemeUpdate(state.activeThemeId);
    return {
      hasUpdate: res.hasUpdate,
      currentVersion: res.localVersion,
      remoteVersion: res.remoteVersion,
    };
  },
  apply: async () => {
    const state = await window.api.getThemeState();
    return window.api.applyThemeUpdate(state.activeThemeId);
  },
};

const languageUpdatable: Updatable = {
  id: 'language',
  label: 'Language',
  description: 'Currently active language pack',
  check: async () => {
    const state = await window.api.getLanguageState();
    const res = await window.api.checkLanguageUpdate(state.activeLanguageId);
    return {
      hasUpdate: res.hasUpdate,
      currentVersion: res.localVersion,
      remoteVersion: res.remoteVersion,
    };
  },
  apply: async () => {
    const state = await window.api.getLanguageState();
    return window.api.applyLanguageUpdate(state.activeLanguageId);
  },
};

export const UPDATE_REGISTRY: Updatable[] = [appUpdatable, themeUpdatable, languageUpdatable];
