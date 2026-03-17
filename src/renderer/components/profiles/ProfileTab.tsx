/**
 * ProfileTab — profile identity settings: name, color, auto-start, delete.
 * Deliberately separate from ConfigTab (which handles JAR/args).
 */
import React, { useState, useEffect } from 'react'
import { useApp, PROFILE_COLORS }      from '../../store/AppStore'
import { Button }  from '../common/Button'
import { Input }   from '../common/Input'
import { Toggle }  from '../common/Toggle'
import { Dialog }  from '../common/Dialog'
import type { Profile } from '../../types'

export function ProfileTab() {
  const { activeProfile, saveProfile, deleteProfile, state } = useApp()

  const [draft, setDraft]           = useState<Profile | null>(null)
  const [saved, setSaved]           = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (activeProfile) setDraft({ ...activeProfile })
  }, [activeProfile?.id])

  if (!draft || !activeProfile) {
    return <Placeholder />
  }

  const update = (patch: Partial<Profile>) => setDraft(prev => prev ? { ...prev, ...patch } : prev)

  const handleSave = async () => {
    await saveProfile(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const handleDelete = async () => {
    await deleteProfile(draft.id)
    setShowDelete(false)
  }

  const color = draft.color || PROFILE_COLORS[0]

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
          <h2 className="text-sm font-medium text-text-primary flex-1">Profile Identity</h2>
          <Button variant="primary" size="sm" onClick={handleSave}
            style={{ backgroundColor: color, color: '#08090d', borderColor: color }}>
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* Name */}
          <Section title="Name">
            <Input
              value={draft.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="My Server"
            />
          </Section>

          {/* Color */}
          <Section title="Accent Colour" hint="Used in the sidebar and as the tab highlight colour.">
            <div className="flex flex-wrap gap-2.5">
              {PROFILE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  title={c}
                  className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    boxShadow: draft.color === c ? `0 0 0 2px #08090d, 0 0 0 4px ${c}` : 'none',
                    transform: draft.color === c ? 'scale(1.15)' : undefined,
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Behaviour */}
          <Section title="Behaviour">
            <Toggle
              checked={draft.autoStart}
              onChange={v => update({ autoStart: v })}
              label="Auto-start on app launch"
              hint="Automatically starts this profile's JAR when Java Runner Client opens"
            />
          </Section>

          {/* Danger zone */}
          <Section title="Danger Zone">
            <div className="border border-red-500/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-text-primary">Delete this profile</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Permanently removes the profile and all its settings.
                    {state.profiles.length <= 1 && ' You need at least one profile.'}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                  disabled={state.profiles.length <= 1}
                  title={state.profiles.length <= 1 ? 'Cannot delete the last profile' : undefined}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Section>

        </div>
      </div>

      <Dialog
        open={showDelete}
        title={`Delete "${draft.name}"?`}
        message="This profile will be permanently removed. Any running process for this profile will not be stopped automatically."
        confirmLabel="Delete Profile"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Placeholder() {
  return (
    <div className="flex items-center justify-center h-full text-sm text-text-muted">
      No profile selected
    </div>
  )
}
