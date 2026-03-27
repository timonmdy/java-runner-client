export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'updating'
  | 'done'
  | 'error';

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string | number;
  remoteVersion: string | number;
  error?: string;
}

export interface Updatable {
  id: string;
  label: string;
  description: string;
  check: () => Promise<UpdateCheckResult>;
  apply: () => Promise<{ ok: boolean; error?: string }>;
}
