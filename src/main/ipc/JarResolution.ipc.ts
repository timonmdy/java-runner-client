import fs from 'fs';
import path from 'path';
import type { RouteMap } from '../IPCController';
import type { JarResolutionConfig, JarResolutionResult } from '../shared/types/JarResolution.types';
import { patternToRegex } from '../shared/config/JarResolution.config';

function parseVersion(str: string): number[] {
  return str
    .split(/[.\-_]/)
    .map((p) => parseInt(p, 10))
    .filter((n) => !isNaN(n));
}

function compareVersionArrays(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = (b[i] ?? 0) - (a[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function resolveJar(config: JarResolutionConfig): JarResolutionResult {
  const { baseDir, pattern, strategy, regexOverride } = config;

  if (!baseDir) return { ok: false, error: 'No base directory specified.' };

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return { ok: false, error: `Cannot read directory: ${baseDir}` };
  }

  const fileEntries = entries.filter((e) => e.isFile() && e.name.endsWith('.jar'));

  let matchRegex: RegExp;
  if (strategy === 'regex' && regexOverride?.trim()) {
    try {
      matchRegex = new RegExp(regexOverride.trim(), 'i');
    } catch {
      return { ok: false, error: 'Invalid regular expression.' };
    }
  } else {
    matchRegex = patternToRegex(pattern);
  }

  const matched = fileEntries.filter((e) => matchRegex.test(e.name));
  if (matched.length === 0) {
    return { ok: false, error: 'No JAR files matched the pattern.', candidates: [] };
  }

  const candidates = matched.map((e) => e.name);
  let chosen: string;

  if (strategy === 'latest-modified') {
    const withMtime = matched.map((e) => {
      const full = path.join(baseDir, e.name);
      try {
        return { name: e.name, mtime: fs.statSync(full).mtimeMs };
      } catch {
        return { name: e.name, mtime: 0 };
      }
    });
    chosen = withMtime.sort((a, b) => b.mtime - a.mtime)[0].name;
  } else if (strategy === 'regex') {
    chosen = candidates[0];
  } else {
    // highest-version: extract version capture group from pattern regex
    const versionRegex = patternToRegex(pattern);
    const withVersions = matched.map((e) => {
      const m = versionRegex.exec(e.name);
      const vStr = m?.[1] ?? '';
      return { name: e.name, version: parseVersion(vStr) };
    });
    withVersions.sort((a, b) => compareVersionArrays(a.version, b.version));
    chosen = withVersions[0].name;
  }

  return {
    ok: true,
    resolvedPath: path.join(baseDir, chosen),
    candidates,
  };
}

export const JarResolutionIPC = {
  resolveJar: {
    type: 'invoke',
    channel: 'jarResolution:resolve',
    handler: (_e: Electron.IpcMainInvokeEvent, config: JarResolutionConfig) => resolveJar(config),
  },

  previewCandidates: {
    type: 'invoke',
    channel: 'jarResolution:preview',
    handler: (_e: Electron.IpcMainInvokeEvent, config: JarResolutionConfig) => resolveJar(config),
  },
} satisfies RouteMap;
