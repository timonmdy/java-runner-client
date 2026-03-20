export const GITHUB_CONFIG = {
  owner: 'timonmdy',
  repo: 'java-runner-client',
  templatesPath: 'profile-templates',
  templateMinVersion: 1,
  apiBase: 'https://api.github.com',
} as const

export function releasesUrl(): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases`
}

export function latestReleaseUrl(): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/releases/latest`
}

export function templateListUrl(): string {
  return `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.templatesPath}`
}

export function rawTemplateUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${GITHUB_CONFIG.templatesPath}/${filename}`
}
