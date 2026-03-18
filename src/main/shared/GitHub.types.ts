export interface GitHubAsset {
  id:                   number
  name:                 string
  label:                string | null
  content_type:         string
  state:                string
  size:                 number
  download_count:       number
  browser_download_url: string
  created_at:           string
  updated_at:           string
}

export interface GitHubRelease {
  id:               number
  tag_name:         string
  name:             string | null
  body:             string | null
  draft:            boolean
  prerelease:       boolean
  created_at:       string
  published_at:     string
  html_url:         string
  tarball_url:      string
  zipball_url:      string
  assets:           GitHubAsset[]
  author: {
    login:      string
    avatar_url: string
    html_url:   string
  }
}

export interface ProfileTemplate {
  templateVersion:  number
  minAppVersion:    string
  name:             string
  description:      string
  category:         string
  tags:             string[]
  defaults: {
    jvmArgs:          { value: string; enabled: boolean }[]
    systemProperties: { key: string; value: string; enabled: boolean }[]
    programArgs:      { value: string; enabled: boolean }[]
    javaPath:         string
    autoStart:        boolean
    autoRestart:      boolean
    autoRestartInterval: number
    color:            string
  }
}
