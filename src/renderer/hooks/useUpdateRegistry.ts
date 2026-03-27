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
        return {
          hasUpdate: false,
          currentVersion: version,
          remoteVersion: version,
          error: res.error,
        };
      const remote = (res.data.tag_name ?? '').replace(/^v/, '');
      return {
        hasUpdate: semverGt(remote, version),
        currentVersion: version,
        remoteVersion: remote,
      };
    },
    apply: async () => ({ ok: false, error: 'Use the release modal to download the installer' }),
  },
  theme: {
    check: async () => {
      const active = await window.api.getActiveTheme();
      const res = await window.api.fetchRemoteThemes();
      if (!res.ok || !res.themes)
        return { hasUpdate: false, currentVersion: active.version, remoteVersion: active.version };
      const remote = res.themes.find((t) => t.id === active.id);
      return {
        hasUpdate: remote ? remote.version > active.version : false,
        currentVersion: active.version,
        remoteVersion: remote?.version ?? active.version,
      };
    },
    apply: async () => {
      const active = await window.api.getActiveTheme();
      const res = await window.api.fetchRemoteThemes();
      if (!res.ok || !res.themes) return { ok: false, error: res.error ?? 'Fetch failed' };
      const remote = res.themes.find((t) => t.id === active.id);
      if (!remote) return { ok: false, error: 'Theme not found on remote' };
      await window.api.setActiveTheme(remote);
      return { ok: true };
    },
  },
  language: {
    check: async () => {
      const active = await window.api.getActiveLanguage();
      const res = await window.api.fetchRemoteLanguages();
      if (!res.ok || !res.languages)
        return { hasUpdate: false, currentVersion: active.version, remoteVersion: active.version };
      const remote = res.languages.find((l) => l.id === active.id);
      return {
        hasUpdate: remote ? remote.version > active.version : false,
        currentVersion: active.version,
        remoteVersion: remote?.version ?? active.version,
      };
    },
    apply: async () => {
      const active = await window.api.getActiveLanguage();
      const res = await window.api.fetchRemoteLanguages();
      if (!res.ok || !res.languages) return { ok: false, error: res.error ?? 'Fetch failed' };
      const remote = res.languages.find((l) => l.id === active.id);
      if (!remote) return { ok: false, error: 'Language not found on remote' };
      await window.api.setActiveLanguage(remote);
      return { ok: true };
    },
  },
};

export function useUpdateRegistry(): ResolvedUpdatable[] {
  return UPDATE_ITEMS.map((item) => ({
    ...item,
    check:
      LOGIC[item.id]?.check ??
      (async () => ({ hasUpdate: false, currentVersion: '?', remoteVersion: '?' })),
    apply: LOGIC[item.id]?.apply ?? (async () => ({ ok: false, error: 'Not implemented' })),
  }));
}
