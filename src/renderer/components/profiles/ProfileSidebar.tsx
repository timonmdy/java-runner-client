import React, { useState, useCallback } from 'react'
import { useApp, PROFILE_COLORS } from '../../store/AppStore'
import { Dialog }        from '../common/Dialog'
import { ContextMenu }   from '../common/ContextMenu'
import { TemplateModal } from './TemplateModal'
import type { ContextMenuItem } from '../common/ContextMenu'
import type { Profile } from '../../types'
import {
  VscPlay, VscDebugStop, VscCheck, VscClearAll, VscTrash,
  VscSettings, VscQuestion, VscTools, VscAdd, VscLayout,
} from 'react-icons/vsc'

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

  const [ctxMenu,        setCtxMenu]        = useState<CtxState | null>(null)
  const [deleteTarget,   setDeleteTarget]   = useState<Profile | null>(null)
  const [actionError,    setActionError]    = useState<string | null>(null)
  const [templateOpen,   setTemplateOpen]   = useState(false)

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
      ? { label: 'Stop',  icon: <VscDebugStop size={11} />, danger: true, onClick: () => handleStop(ctxProfile) }
      : { label: 'Start', icon: <VscPlay size={11} />, disabled: !ctxProfile.jarPath, onClick: () => handleStart(ctxProfile) },
    { type: 'separator' },
    { label: 'Select',        icon: <VscCheck size={12} />,   onClick: () => { setActiveProfile(ctxProfile.id); onProfileClick?.() } },
    { label: 'Clear Console', icon: <VscClearAll size={12} />, onClick: () => clearConsole(ctxProfile.id) },
    { type: 'separator' },
    {
      label: 'Delete', icon: <VscTrash size={12} />, danger: true,
      disabled: !canDelete,
      onClick: () => canDelete ? setDeleteTarget(ctxProfile) : undefined,
    },
  ] : []

  return (
    <>
      <aside className="w-52 shrink-0 flex flex-col bg-base-950 border-r border-surface-border">

        {/* New profile buttons */}
        <div className="px-2 pt-2 pb-1 shrink-0 space-y-1">
          <button
            onClick={() => createProfile()}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono
              text-text-muted hover:text-accent hover:bg-surface-raised transition-colors border border-dashed border-surface-border hover:border-accent/40"
          >
            <VscAdd size={11} />
            New Profile
          </button>
          <button
            onClick={() => setTemplateOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono
              text-text-muted hover:text-text-primary hover:bg-surface-raised/50 transition-colors"
          >
            <VscLayout size={11} />
            From Template
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
          <FooterButton label="Utilities" active={activeSidePanel === 'utilities'} onClick={onOpenUtilities} icon={<VscTools size={13} />} />
          <FooterButton label="FAQ"       active={activeSidePanel === 'faq'}       onClick={onOpenFaq}       icon={<VscQuestion size={13} />} />
          <FooterButton label="Settings"  active={activeSidePanel === 'settings'}  onClick={onOpenSettings}  icon={<VscSettings size={13} />} />
        </div>
      </aside>

      {ctxMenu && ctxItems.length > 0 && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}

      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />

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
  const color   = profile.color || PROFILE_COLORS[0]
  const jarName = profile.jarPath ? profile.jarPath.split(/[/\\]/).pop() ?? '' : ''

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
      <span className="flex-1 min-w-0 flex flex-col">
        <span className={['text-xs truncate', active ? 'text-text-primary font-medium' : 'text-text-secondary'].join(' ')}>
          {profile.name}
        </span>
        {jarName && (
          <span className="text-[10px] text-text-muted font-mono truncate leading-tight" title={profile.jarPath}>
            {jarName}
          </span>
        )}
      </span>
      {running && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}/>}
    </button>
  )
}

function FooterButton({ label, active, onClick, icon }: {
  label: string; active: boolean; onClick: () => void; icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors',
        active ? 'bg-surface-raised text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
