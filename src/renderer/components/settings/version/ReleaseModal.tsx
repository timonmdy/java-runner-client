import React, { useState } from 'react'
import { Modal } from '../../common/Modal'
import { Button } from '../../common/Button'
import type { GitHubRelease, GitHubAsset } from '../../../types'
import {
  VscPackage,
  VscGithub,
  VscCalendar,
  VscCloudDownload,
  VscTag,
  VscVerified,
  VscBeaker,
} from 'react-icons/vsc'
import { LuDownload, LuExternalLink } from 'react-icons/lu'

interface Props {
  release: GitHubRelease
  open: boolean
  onClose: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Detect best installer asset by trying common extensions in priority order
function getPlatformAsset(assets?: GitHubAsset[]): GitHubAsset | undefined {
  // Guard against undefined assets
  if (!assets || !Array.isArray(assets)) return undefined
  // Windows first (most likely for this app), then macOS, then Linux
  return (
    assets.find((a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')) ??
    assets.find((a) => a.name.endsWith('.dmg') || a.name.endsWith('.pkg')) ??
    assets.find((a) => a.name.endsWith('.AppImage') || a.name.endsWith('.deb'))
  )
}

export function ReleaseModal({ release, open, onClose }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [dlError, setDlError] = useState<string | null>(null)
  const [dlDone, setDlDone] = useState<string | null>(null)

  const platformAsset = getPlatformAsset(release.assets)

  const handleDownload = async (asset: GitHubAsset) => {
    setDlError(null)
    setDlDone(null)
    setDownloading(asset.name)
    const res = await window.api.downloadAsset(asset.browser_download_url, asset.name)
    setDownloading(null)
    if (res.ok) setDlDone(asset.name)
    else setDlError(res.error ?? 'Download failed')
  }

  // Parse markdown-ish body into sections
  const bodyLines = (release.body ?? '').split('\n')

  return (
    <Modal open={open} onClose={onClose} title="Release Details" width="xl">
      <div className="px-5 py-4 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {release.author && (
            <img
              src={release.author.avatar_url}
              alt={release.author.login}
              className="w-10 h-10 rounded-full border border-surface-border shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-text-primary">
                {release.name ?? release.tag_name}
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono bg-accent/10 border-accent/30 text-accent">
                <VscTag size={10} />
                {release.tag_name}
              </span>
              {release.prerelease && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                  <VscBeaker size={10} />
                  Pre-release
                </span>
              )}
              {!release.prerelease && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono bg-green-500/10 border-green-500/30 text-green-400">
                  <VscVerified size={10} />
                  Stable
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted font-mono">
              {release.author && (
                <span className="flex items-center gap-1">
                  <VscGithub size={11} />
                  {release.author.login}
                </span>
              )}
              {release.published_at && (
                <span className="flex items-center gap-1">
                  <VscCalendar size={11} />
                  {formatDate(release.published_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick download - platform asset */}
        {platformAsset && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LuDownload size={18} className="text-accent shrink-0" />
              <div>
                <p className="text-xs font-medium text-text-primary">{platformAsset.name}</p>
                <p className="text-xs text-text-muted font-mono">
                  {formatBytes(platformAsset.size)} ·{' '}
                  {platformAsset.download_count.toLocaleString()} downloads
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={downloading === platformAsset.name}
              onClick={() => handleDownload(platformAsset)}
            >
              {dlDone === platformAsset.name ? 'Downloaded' : 'Download'}
            </Button>
          </div>
        )}

        {/* Error / success feedback */}
        {dlError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 font-mono">
            {dlError}
          </div>
        )}
        {dlDone && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent font-mono">
            {dlDone} saved — check your Downloads folder.
          </div>
        )}

        {/* Release notes */}
        {release.body && (
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
              Release Notes
            </p>
            <div className="rounded-lg border border-surface-border bg-base-950 px-4 py-3 space-y-1 max-h-48 overflow-y-auto">
              {bodyLines.map((line, i) => {
                const h2 = line.startsWith('## ')
                const h3 = line.startsWith('### ')
                const li = line.startsWith('- ') || line.startsWith('* ')
                if (!line.trim()) return <div key={i} className="h-1" />
                if (h2)
                  return (
                    <p key={i} className="text-xs font-semibold text-text-primary pt-1">
                      {line.slice(3)}
                    </p>
                  )
                if (h3)
                  return (
                    <p key={i} className="text-xs font-medium text-text-secondary">
                      {line.slice(4)}
                    </p>
                  )
                if (li)
                  return (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary font-mono">
                      <span className="text-accent shrink-0">·</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  )
                return (
                  <p key={i} className="text-xs text-text-muted font-mono">
                    {line}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {/* All assets */}
        {(release.assets ?? []).length > 0 && (
          <div>
            <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2">
              All Assets
            </p>
            <div className="space-y-1.5">
              {(release.assets ?? []).map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-surface-border bg-base-900/50 hover:border-surface-border/80 transition-colors"
                >
                  <VscPackage size={13} className="text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-primary truncate">{asset.name}</p>
                    <p className="text-xs text-text-muted font-mono">
                      {formatBytes(asset.size)} · {asset.download_count.toLocaleString()} downloads
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={downloading === asset.name}
                    onClick={() => handleDownload(asset)}
                  >
                    {dlDone === asset.name ? 'Saved' : 'Save'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-border">
          {release.html_url && (
            <button
              onClick={() => window.api.openExternal(release.html_url)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors font-mono"
            >
              <LuExternalLink size={11} />
              View on GitHub
            </button>
          )}
          {!release.html_url && <div />}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
