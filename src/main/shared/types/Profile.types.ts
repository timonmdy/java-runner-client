import type { JarResolutionConfig } from './JarResolution.types';

export interface SystemProperty {
  key: string;
  value: string;
  enabled: boolean;
}
export interface JvmArgument {
  value: string;
  enabled: boolean;
}
export interface ProgramArgument {
  value: string;
  enabled: boolean;
}

export interface EnvVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Profile {
  id: string;
  name: string;
  jarPath: string;
  workingDir: string;
  jvmArgs: JvmArgument[];
  systemProperties: SystemProperty[];
  programArgs: ProgramArgument[];
  envVars: EnvVariable[];
  javaPath: string;
  autoStart: boolean;
  color: string;
  createdAt: number;
  updatedAt: number;
  autoRestart: boolean;
  autoRestartInterval: number;
  order?: number;
  jarResolution?: JarResolutionConfig;
  fileLogging?: boolean;
}

export const hasJarConfigured = (p: Profile) =>
  p.jarResolution?.enabled ? !!p.jarResolution.baseDir : !!p.jarPath;
