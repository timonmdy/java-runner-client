export type JarResolutionStrategy = 'highest-version' | 'latest-modified' | 'regex';

export interface JarResolutionConfig {
  enabled: boolean;
  baseDir: string;
  pattern: string; // filename pattern, e.g. "myapp-{version}.jar" or a raw regex
  strategy: JarResolutionStrategy;
  regexOverride?: string; // only used when strategy === 'regex'
}

export interface JarResolutionResult {
  ok: boolean;
  resolvedPath?: string;
  candidates?: string[];
  error?: string;
}
