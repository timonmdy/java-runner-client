import React, { useState, useCallback } from 'react'
import { Button } from '../../common/Button'
import { Tooltip } from '../../common/Tooltip'
import { ReleaseModal } from './ReleaseModal'
import type { GitHubRelease } from '../../../types'
import { VscCheck, VscWarning, VscSync, VscCircleSlash } from 'react-icons/vsc'

interface Props {
  currentVersion: string
}

type CheckState = 'idle' | 'checking' | 'up-to-date' | 'update-available' | 'error'

function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const [am, an, ap] = parse(a)
  const [bm, bn, bp] = parse(b)
  if (am !== bm) return am > bm
  if (an !== bn) return an > bn
  return ap > bp
}

export function VersionChecker({ currentVersion }: Props) {
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [release, setRelease] = useState<GitHubRelease | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const check = useCallback(async () => {
    setCheckState('checking')
    setErrorMsg(null)
    const res = await window.api.fetchLatestRelease()
    if (!res.ok || !res.data) {
      setCheckState('error')
      setErrorMsg(res.error ?? 'Could not reach GitHub')
      return
    }
    setRelease(res.data)
    const remoteVersion = (res.data.tag_name ?? '').replace(/^v/, '')
    setCheckState(semverGt(remoteVersion, currentVersion) ? 'update-available' : 'up-to-date')
  }, [currentVersion])

  const Icon = {
    idle: VscSync,
    checking: VscSync,
    'up-to-date': VscCheck,
    'update-available': VscWarning,
    error: VscCircleSlash,
  }[checkState]

  const iconColor = {
    idle: 'text-text-muted',
    checking: 'text-text-muted animate-spin',
    'up-to-date': 'text-accent',
    'update-available': 'text-yellow-400',
    error: 'text-red-400',
  }[checkState]

  const tooltipContent = {
    idle: 'Click to check for updates',
    checking: 'Checking...',
    'up-to-date': `You are on the latest version (${currentVersion})`,
    'update-available': release
      ? `${release.tag_name} is available — click for details`
      : 'Update available',
    error: errorMsg ?? 'Check failed',
  }[checkState]

  const handleClick = () => {
    if (checkState === 'idle' || checkState === 'error') {
      check()
      return
    }
    if ((checkState === 'up-to-date' || checkState === 'update-available') && release)
      setModalOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary">Version</p>
          <p className="text-xs text-text-muted mt-0.5 leading-4">
            Current: <span className="font-mono text-accent">{currentVersion}</span>
            {checkState === 'update-available' && release && (
              <span className="ml-2 font-mono text-yellow-400">→ {release.tag_name} available</span>
            )}
          </p>
        </div>
        <Tooltip content={tooltipContent} side="left">
          <button
            onClick={handleClick}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-surface-border text-xs font-mono text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
          >
            <Icon size={12} className={iconColor} />
            {checkState === 'idle' && 'Check for updates'}
            {checkState === 'checking' && 'Checking...'}
            {checkState === 'up-to-date' && 'Up to date'}
            {checkState === 'update-available' && 'View update'}
            {checkState === 'error' && 'Retry'}
          </button>
        </Tooltip>
      </div>

      {release && (
        <ReleaseModal release={release} open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
