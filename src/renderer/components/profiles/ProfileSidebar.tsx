/**
 * ProfileSidebar — new-profile button at top, profile list, context menu,
 * and footer nav (Settings, FAQ, Utilities).
 */
import React, { useState, useCallback } from 'react'
import { useApp, PROFILE_COLORS } from '../../store/AppStore'
import { Dialog }      from '../common/Dialog'
import { ContextMenu } from '../common/ContextMenu'
import type { ContextMenuItem } from '../common/ContextMenu'
import type { Profile } from '../../types'

interface Props {
  onOpenSettings:  () => void
  onOpenFaq:       () => void
  onOpenUtilities: () => void
  onProfileClick?: () => void
  activeSidePanel: 'settings' | 'faq' | 'utilities' | null
}

interface CtxState { profileId: string; x: number; y: number }

export function ProfileSidebar({
  onOpenSettings, onOpenFaq, onOpenUtilities, onProfileClick, activeSidePanel,
}: Props) {
  const {
    state, activeProfile, setActiveProfile,
    createProfile, deleteProfile, startProcess, stopProcess, clearConsole, isRunning,
  } = useApp()

  const [ctxMenu,      setCtxMenu]      = useState<CtxState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [actionError,  setActionError]  = useState<string | null>(null)

  const canDelete = state.profiles.length > 1

  const handleContextMenu = useCallback((e: React.MouseEvent, profile: Profile) => {
    e.preventDefault()
    setCtxMenu({ profileId: profile.id, x: e.clientX, y: e.clientY })
  }, [])

  const ctxProfile = ctxMenu ? state.profiles.find(p => p.id === ctxMenu.profileId) : null
  const ctxRunning = ctxProfile ? isRunning(ctxProfile.id) : false

  const handleStart = useCallback(async (profile: Profile) => {
    if (!profile.jarPath) { setActionError(`"${profile.name}" has no JAR configured.`); return }
    const res = await startProcess(profile)
    if (!res.ok) setActionError(res.error ?? 'Failed to start')
  }, [startProcess])

  const handleStop = useCallback(async (profile: Profile) => {
    const res = await stopProcess(profile.id)
    if (!res.ok) setActionError(res.error ?? 'Failed to stop')
  }, [stopProcess])

  const ctxItems: ContextMenuItem[] = ctxProfile ? [
    ctxRunning
      ? { label: 'Stop',  icon: <StopIcon />,  danger: true, onClick: () => handleStop(ctxProfile) }
      : { label: 'Start', icon: <PlayIcon />,  disabled: !ctxProfile.jarPath, onClick: () => handleStart(ctxProfile) },
    { type: 'separator' },
    { label: 'Select', icon: <SelectIcon />, onClick: () => { setActiveProfile(ctxProfile.id); onProfileClick?.() } },
    { label: 'Clear Console', icon: <ClearIcon />, onClick: () => clearConsole(ctxProfile.id) },
    { type: 'separator' },
    {
      label: 'Delete', icon: <TrashIcon />, danger: true,
      disabled: !canDelete,
      onClick: () => canDelete ? setDeleteTarget(ctxProfile) : undefined,
    },
  ] : []

  return (
    <>
      <aside className="w-52 shrink-0 flex flex-col bg-base-950 border-r border-surface-border">

        {/* New profile button at top */}
        <div className="px-2 pt-2 pb-1 shrink-0">
          <button onClick={createProfile}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono
              text-text-muted hover:text-accent hover:bg-surface-raised transition-colors border border-dashed border-surface-border hover:border-accent/40">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/>
            </svg>
            New Profile
          </button>
        </div>

        {/* Profile list */}
        <div className="flex-1 overflow-y-auto py-1 space-y-0.5 px-2">
          {state.profiles.length === 0 && (
            <p className="px-2 py-4 text-xs text-text-muted font-mono text-center leading-relaxed">
              No profiles yet.
            </p>
          )}
          {state.profiles.map(profile => (
            <ProfileItem
              key={profile.id}
              profile={profile}
              active={profile.id === activeProfile?.id && activeSidePanel === null}
              running={isRunning(profile.id)}
              onClick={() => { setActiveProfile(profile.id); onProfileClick?.() }}
              onContextMenu={e => handleContextMenu(e, profile)}
            />
          ))}
        </div>

        {/* Footer nav */}
        <div className="px-2 pt-1 pb-2 border-t border-surface-border space-y-0.5">
          <FooterButton label="Utilities" active={activeSidePanel === 'utilities'} onClick={onOpenUtilities} icon={<ToolsIcon />} />
          <FooterButton label="FAQ"       active={activeSidePanel === 'faq'}       onClick={onOpenFaq}       icon={<QuestionIcon />} />
          <FooterButton label="Settings"  active={activeSidePanel === 'settings'}  onClick={onOpenSettings}  icon={<CogIcon />} />
        </div>
      </aside>

      {ctxMenu && ctxItems.length > 0 && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}

      <Dialog
        open={!!actionError}
        title="Error"
        message={actionError ?? ''}
        confirmLabel="OK"
        onConfirm={() => setActionError(null)}
        onCancel={() => setActionError(null)}
      />

      <Dialog
        open={!!deleteTarget}
        title="Delete profile?"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete" danger
        onConfirm={async () => { if (deleteTarget) await deleteProfile(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

function ProfileItem({ profile, active, running, onClick, onContextMenu }: {
  profile: Profile; active: boolean; running: boolean
  onClick: () => void; onContextMenu: (e: React.MouseEvent) => void
}) {
  const color = profile.color || PROFILE_COLORS[0]
  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={[
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
        active ? 'bg-surface-raised' : 'hover:bg-surface-raised/50',
      ].join(' ')}
    >
      <span className="relative shrink-0">
        <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: color }}/>
        {running && (
          <span className="absolute inset-0 rounded-full animate-pulse-dot" style={{ backgroundColor: color, opacity: 0.5 }}/>
        )}
      </span>
      <span className={['flex-1 text-xs truncate', active ? 'text-text-primary font-medium' : 'text-text-secondary'].join(' ')}>
        {profile.name}
      </span>
      {running && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}/>}
    </button>
  )
}

function FooterButton({ label, active, onClick, icon }: {
  label: string; active: boolean; onClick: () => void; icon: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors',
        active ? 'bg-surface-raised text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50',
      ].join(' ')}>
      {icon}
      {label}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const PlayIcon    = () => <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5l9 4.5-9 4.5V1.5z"/></svg>
const StopIcon    = () => <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1.5"/></svg>
const SelectIcon  = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>
const TrashIcon   = () => <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4M3 4l.8 7.5a1 1 0 001 .5h4.4a1 1 0 001-.5L11 4"/></svg>
const ClearIcon   = () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 10L10 2M2 2l8 8"/></svg>
const CogIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const QuestionIcon= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const ToolsIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
