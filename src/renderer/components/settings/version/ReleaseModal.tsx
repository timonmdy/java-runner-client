import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from '../../common/Modal'
import { Button } from '../../common/Button'
import type { GitHubRelease, GitHubAsset } from '../../../types'
import {
  VscPackage,
  VscGithub,
  VscCalendar,
  VscTag,
  VscVerified,
  VscBeaker,
  VscDebugPause,
  VscDebugContinue,
  VscClose,
} from 'react-icons/vsc'
import { LuDownload, LuExternalLink, LuCheck, LuRotateCcw } from 'react-icons/lu'

interface Props {
  release: GitHubRelease
  open: boolean
  onClose: () => void
}

interface DownloadProgress {
  filename: string
  bytesWritten: number
  totalBytes: number
  percent: number
  status: 'downloading' | 'paused' | 'done' | 'error' | 'cancelled'
  error?: string
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

function getPlatformAsset(assets?: GitHubAsset[]): GitHubAsset | undefined {
  if (!assets || !Array.isArray(assets)) return undefined
  return (
    assets.find((a) => a.name.endsWith('.exe') || a.name.endsWith('.msi')) ??
    assets.find((a) => a.name.endsWith('.dmg') || a.name.endsWith('.pkg')) ??
    assets.find((a) => a.name.endsWith('.AppImage') || a.name.endsWith('.deb'))
  )
}

function DownloadProgressBar({ progress }: { progress: DownloadProgress }) {
  const { status, percent, bytesWritten, totalBytes, error } = progress
  const isDone = status === 'done'
  const isError = status === 'error'
  const isPaused = status === 'paused'
  const isCancelled = status === 'cancelled'

  const barColor =
    isError || isCancelled
      ? 'bg-red-500'
      : isDone
        ? 'bg-green-500'
        : isPaused
          ? 'bg-yellow-400'
          : 'bg-accent'

  const label = isError
    ? (error ?? 'Error')
    : isCancelled
      ? 'Cancelled'
      : isDone
        ? 'Complete'
        : isPaused
          ? 'Paused'
          : `${formatBytes(bytesWritten)}${totalBytes > 0 ? ` / ${formatBytes(totalBytes)}` : ''}`

  const percentLabel = isDone ? '100%' : `${percent}%`

  const percentColor = isDone
    ? 'text-green-400'
    : isError || isCancelled
      ? 'text-red-400'
      : isPaused
        ? 'text-yellow-400'
        : 'text-accent'

  return (
    <div className="mt-2 space-y-1">
      <div className="relative h-1 w-full rounded-full bg-surface-border overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-200 ${barColor} ${
            !isDone && !isError && !isCancelled && !isPaused ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
        <span>{label}</span>
        <span className={percentColor}>{percentLabel}</span>
      </div>
    </div>
  )
}

export function ReleaseModal({ release, open, onClose }: Props) {
  const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map())

  const updateDownload = useCallback((payload: DownloadProgress) => {
    setDownloads((prev) => new Map(prev).set(payload.filename, payload))
  }, [])

  const resetDownload = useCallback((filename: string) => {
    setDownloads((prev) => {
      const next = new Map(prev)
      next.delete(filename)
      return next
    })
  }, [])

  useEffect(() => {
    const unsub = window.api.onDownloadProgress((progress: DownloadProgress) => {
      updateDownload(progress)
    })
    return () => unsub()
  }, [updateDownload])

  const platformAsset = getPlatformAsset(release.assets)

  const handleDownload = async (asset: GitHubAsset) => {
    // Don't touch download state here — main process drives everything via events
    await window.api.downloadAsset(asset.browser_download_url, asset.name)
  }

  const handlePause = async (filename: string) => {
    const dl = downloads.get(filename)
    if (!dl) return
    if (dl.status === 'paused') {
      await window.api.resumeDownload(filename)
    } else {
      await window.api.pauseDownload(filename)
    }
    // State update comes from the progress event sent by main
  }

  const handleCancel = async (filename: string) => {
    await window.api.cancelDownload(filename)
    // State update comes from the progress event sent by main
  }

  const getDl = (name: string) => downloads.get(name)
  const isActive = (name: string) => {
    const s = downloads.get(name)?.status
    return s === 'downloading' || s === 'paused'
  }

  const renderControls = (asset: GitHubAsset, variant: 'primary' | 'ghost') => {
    const dl = getDl(asset.name)
    const active = isActive(asset.name)

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Active: pause/resume + cancel */}
        {active && (
          <>
            <button
              onClick={() => handlePause(asset.name)}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors"
              title={dl?.status === 'paused' ? 'Resume' : 'Pause'}
            >
              {dl?.status === 'paused' ? (
                <VscDebugContinue size={14} />
              ) : (
                <VscDebugPause size={14} />
              )}
            </button>
            <button
              onClick={() => handleCancel(asset.name)}
              className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
              title="Cancel"
            >
              <VscClose size={14} />
            </button>
          </>
        )}

        {/* Done: saved label + reset */}
        {dl?.status === 'done' && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-400 font-mono">
              <LuCheck size={12} /> Saved
            </span>
            <button
              onClick={() => resetDownload(asset.name)}
              className="p-1 rounded text-text-muted hover:text-accent transition-colors"
              title="Download again"
            >
              <LuRotateCcw size={12} />
            </button>
          </div>
        )}

        {/* Cancelled or error: retry */}
        {(dl?.status === 'cancelled' || dl?.status === 'error') && (
          <Button
            variant={variant}
            size="sm"
            onClick={() => {
              resetDownload(asset.name)
              handleDownload(asset)
            }}
          >
            Retry
          </Button>
        )}

        {/* No download yet */}
        {!dl && !active && (
          <Button variant={variant} size="sm" onClick={() => handleDownload(asset)}>
            {variant === 'primary' ? 'Download' : 'Save'}
          </Button>
        )}
      </div>
    )
  }

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
              {release.prerelease ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                  <VscBeaker size={10} />
                  Pre-release
                </span>
              ) : (
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

        {/* Quick download — platform asset */}
        {platformAsset && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
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
              {renderControls(platformAsset, 'primary')}
            </div>
            {getDl(platformAsset.name) && (
              <DownloadProgressBar progress={getDl(platformAsset.name)!} />
            )}
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
                  className="px-3 py-2 rounded-lg border border-surface-border bg-base-900/50 hover:border-surface-border/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <VscPackage size={13} className="text-text-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-text-primary truncate">{asset.name}</p>
                      <p className="text-xs text-text-muted font-mono">
                        {formatBytes(asset.size)} · {asset.download_count.toLocaleString()}{' '}
                        downloads
                      </p>
                    </div>
                    {renderControls(asset, 'ghost')}
                  </div>
                  {getDl(asset.name) && <DownloadProgressBar progress={getDl(asset.name)!} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-border">
          {release.html_url ? (
            <button
              onClick={() => window.api.openExternal(release.html_url)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors font-mono"
            >
              <LuExternalLink size={11} />
              View on GitHub
            </button>
          ) : (
            <div />
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
