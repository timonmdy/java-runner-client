import React, { useState, useEffect } from 'react'
import { PROFILE_COLORS } from '../../../config/Profile.config'
import { useApp } from '../../store/AppStore'
import { Button } from '../common/Button'
import { Input }  from '../common/Input'
import { Dialog } from '../common/Dialog'
import type { Profile } from '../../types'

export function ProfileTab() {
  const { activeProfile, saveProfile, deleteProfile } = useApp()
  const [draft,      setDraft]      = useState<Profile | null>(null)
  const [saved,      setSaved]      = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (activeProfile) setDraft({ ...activeProfile })
  }, [activeProfile?.id])

  if (!draft || !activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        No profile selected
      </div>
    )
  }

  const update = (patch: Partial<Profile>) => setDraft(prev => prev ? { ...prev, ...patch } : prev)
  const color  = draft.color || PROFILE_COLORS[0]

  const handleSave = async () => {
    await saveProfile(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const handleDelete = async () => {
    await deleteProfile(draft.id)
    setShowDelete(false)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
          <h2 className="text-sm font-medium text-text-primary flex-1">Profile Identity</h2>
          <Button
            variant="primary" size="sm" onClick={handleSave}
            style={{ backgroundColor: color, color: '#08090d', borderColor: color }}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <Section title="Name">
            <Input
              value={draft.name}
              onChange={e => update({ name: e.target.value })}
              placeholder="My Server"
            />
          </Section>

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

          <Section title="Danger Zone">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-text-primary">Delete profile</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Permanently removes this profile and all its configuration.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)} className="shrink-0">
                Delete
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <Dialog
        open={showDelete}
        title="Delete profile?"
        message={`"${draft.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
