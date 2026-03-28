export type TrustLevel = 'trusted' | 'automation' | 'unknown';

export const GITHUB_CONFIG = {
  owner: 'timonmdy',
  repo: 'java-runner-client',
  templatesPath: 'profile-templates',
  templateMinVersion: 1,
  apiBase: 'https://api.github.com',

  trustedPublishers: [{ login: 'timonmdy', label: 'Lead Developer' }] as {
    login: string;
    label: string;
  }[],

  automationAccounts: ['github-actions[bot]', 'github-actions'],
} as const;

export function latestReleaseUrl(): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases/latest`;
}

export function templateListUrl(): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.templatesPath}`;
}

export function rawTemplateUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${GITHUB_CONFIG.templatesPath}/${filename}`;
}

export function getPublisherTrust(login: string): { level: TrustLevel; label: string } {
  const trusted = GITHUB_CONFIG.trustedPublishers.find(
    (p) => p.login.toLowerCase() === login.toLowerCase()
  );
  if (trusted) return { level: 'trusted', label: trusted.label };

  if (GITHUB_CONFIG.automationAccounts.some((a) => a.toLowerCase() === login.toLowerCase())) {
    return { level: 'automation', label: 'GitHub Actions' };
  }

  return { level: 'unknown', label: 'Unknown publisher' };
}
