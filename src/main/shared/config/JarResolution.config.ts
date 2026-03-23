import type { JarResolutionConfig } from '../types/JarResolution.types';

export const JAR_RESOLUTION_STRATEGIES = [
  {
    id: 'highest-version' as const,
    label: 'Highest Version',
    hint: 'Picks the JAR with the highest semantic or numeric version extracted from the filename.',
  },
  {
    id: 'latest-modified' as const,
    label: 'Latest Modified',
    hint: 'Picks the most recently modified JAR in the directory matching the pattern.',
  },
  {
    id: 'regex' as const,
    label: 'Regex Match',
    hint: 'Picks the first JAR whose filename matches the custom regular expression.',
  },
] as const;

export const DEFAULT_JAR_RESOLUTION: JarResolutionConfig = {
  enabled: false,
  baseDir: '',
  pattern: 'app-{version}.jar',
  strategy: 'highest-version',
  regexOverride: '',
};

/** Converts a user-facing pattern like "app-{version}.jar" into a RegExp. */
export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, (c) =>
    c === '{' || c === '}' ? c : `\\${c}`
  );
  const src = escaped.replace(/\{version\}/g, '(.+)');
  return new RegExp(`^${src}$`, 'i');
}
