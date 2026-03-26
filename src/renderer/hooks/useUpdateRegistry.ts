import { useCallback } from 'react';
import { UPDATE_ITEMS } from '../../main/shared/config/UpdateCenter.config';
import type { UpdateCheckResult } from '../../main/shared/types/UpdateCenter.types';
import { version } from '../../../package.json';

function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const [am, an, ap] = parse(a);
  const [bm, bn, bp] = parse(b);
  if (am !== bm) return am > bm;
  if (an !== bn) return an > bn;
  return ap > bp;
}

type CheckFn = () => Promise<UpdateCheckResult>;
type ApplyFn = () => Promise<{ ok: boolean; error?: string }>;

interface ResolvedUpdatable {
  id: string;
  label: string;
  description: string;
  check: CheckFn;
  apply: ApplyFn;
}

const LOGIC: Record<string, { check: CheckFn; apply: ApplyFn }> = {
  app: {
    check: async () => {
      const res = await window.api.fetchLatestRelease();
      if (!res.ok || !res.data)
        return { hasUpdate: false, currentVersion: version, remoteVersion: version, error: res.error };
      const remote = (res.data.tag_name ?? '').replace(/^v/, '');
      return { hasUpdate: semverGt(remote, version), currentVersion: version, remoteVersion: remote };
    },
    apply: async () => ({ ok: false, error: 'Use the release modal to download the installer' }),
  },
  theme: {
    check: async () => {
      const state = await window.api.getThemeState();
      const res = await window.api.checkThemeUpdate(state.activeThemeId);
      return { hasUpdate: res.hasUpdate, currentVersion: res.localVersion, remoteVersion: res.remoteVersion };
    },
    apply: async () => {
      const state = await window.api.getThemeState();
      return window.api.applyThemeUpdate(state.activeThemeId);
    },
  },
  language: {
    check: async () => {
      const state = await window.api.getLanguageState();
      const res = await window.api.checkLanguageUpdate(state.activeLanguageId);
      return { hasUpdate: res.hasUpdate, currentVersion: res.localVersion, remoteVersion: res.remoteVersion };
    },
    apply: async () => {
      const state = await window.api.getLanguageState();
      return window.api.applyLanguageUpdate(state.activeLanguageId);
    },
  },
};

export function useUpdateRegistry(): ResolvedUpdatable[] {
  return UPDATE_ITEMS.map((item) => ({
    ...item,
    check: LOGIC[item.id]?.check ?? (async () => ({ hasUpdate: false, currentVersion: '?', remoteVersion: '?' })),
    apply: LOGIC[item.id]?.apply ?? (async () => ({ ok: false, error: 'Not implemented' })),
  }));
}
