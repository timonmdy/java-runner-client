export type TrustLevel = 'trusted' | 'automation' | 'unknown';

export interface TrustedPublisher {
  login: string;
  label: string;
}

export const TRUSTED_PUBLISHERS: TrustedPublisher[] = [
  { login: 'timonmdy', label: 'Lead Developer' },
];

export const AUTOMATION_ACCOUNTS = ['github-actions[bot]', 'github-actions'];

export function getPublisherTrust(login: string): { level: TrustLevel; label: string } {
  const trusted = TRUSTED_PUBLISHERS.find(
    (p) => p.login.toLowerCase() === login.toLowerCase()
  );
  if (trusted) return { level: 'trusted', label: trusted.label };

  if (AUTOMATION_ACCOUNTS.some((a) => a.toLowerCase() === login.toLowerCase())) {
    return { level: 'automation', label: 'GitHub Actions' };
  }

  return { level: 'unknown', label: 'Unknown publisher' };
}
