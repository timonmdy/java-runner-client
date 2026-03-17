/**
 * ConfigTab — JAR file, working dir, Java executable, JVM args, system properties, program args.
 * Profile identity (name, color, auto-start, delete) lives in ProfileTab.
 */
import React, { useState, useEffect } from 'react'
import { useApp }     from '../../store/AppStore'
import { Button }     from '../common/Button'
import { Input }      from '../common/Input'
import { ArgList }    from '../common/ArgList'
import { PropList }   from '../common/PropList'
import type { Profile } from '../../types'

type Section = 'files' | 'jvm' | 'props' | 'args'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'files', label: 'Files & Paths' },
  { id: 'jvm',   label: 'JVM Args'      },
  { id: 'props', label: 'Properties (-D)' },
  { id: 'args',  label: 'Program Args'  },
]

export function ConfigTab() {
  const { activeProfile, saveProfile, isRunning } = useApp()

  const [draft, setDraft]     = useState<Profile | null>(null)
  const [saved, setSaved]     = useState(false)
  const [section, setSection] = useState<Section>('files')

  useEffect(() => {
    if (activeProfile) setDraft({ ...activeProfile })
  }, [activeProfile?.id])

  if (!draft || !activeProfile) {
    return <div className="flex items-center justify-center h-full text-sm text-text-muted">No profile selected</div>
  }

  const running = isRunning(draft.id)
  const color   = draft.color || '#4ade80'

  const update = (patch: Partial<Profile>) => setDraft(prev => prev ? { ...prev, ...patch } : prev)

  const handleSave = async () => {
    await saveProfile(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
        <h2 className="text-sm font-medium text-text-primary flex-1 truncate">{draft.name}</h2>
        {running && (
          <span className="text-xs text-console-warn font-mono">restart needed</span>
        )}
        <Button variant="primary" size="sm" onClick={handleSave}
          style={{ backgroundColor: color, color: '#08090d', borderColor: color }}>
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-0 px-4 border-b border-surface-border shrink-0">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={[
              'px-3 py-2 text-xs font-mono border-b-2 -mb-px transition-colors',
              section === s.id
                ? 'font-medium'
                : 'text-text-muted border-transparent hover:text-text-primary',
            ].join(' ')}
            style={section === s.id ? { borderBottomColor: color, color } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {section === 'files' && (
          <FilesSection draft={draft} update={update} />
        )}

        {section === 'jvm' && (
          <ArgSection title="JVM Arguments" hint="Flags passed to the JVM before -jar, e.g. -Xmx2g  -XX:+UseG1GC">
            <ArgList
              items={draft.jvmArgs}
              onChange={jvmArgs => update({ jvmArgs })}
              placeholder="-Xmx2g"
            />
          </ArgSection>
        )}

        {section === 'props' && (
          <ArgSection title="System Properties" hint="Passed as -Dkey=value. Spring profiles, ports, logging levels, etc.">
            <PropList
              items={draft.systemProperties}
              onChange={systemProperties => update({ systemProperties })}
            />
          </ArgSection>
        )}

        {section === 'args' && (
          <ArgSection title="Program Arguments" hint="Appended after the JAR path, e.g. --nogui  --world myWorld">
            <ArgList
              items={draft.programArgs}
              onChange={programArgs => update({ programArgs })}
              placeholder="--nogui"
            />
          </ArgSection>
        )}

        {/* Command preview */}
        <div className="rounded-lg bg-base-950 border border-surface-border p-3">
          <p className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2">Command preview</p>
          <p className="text-xs font-mono text-text-secondary break-all leading-5 select-text">
            {buildCmdPreview(draft)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Files section ─────────────────────────────────────────────────────────────

function FilesSection({ draft, update }: { draft: Profile; update: (p: Partial<Profile>) => void }) {
  const handlePickJar  = async () => { const p = await window.api.pickJar();  if (p) update({ jarPath: p }) }
  const handlePickDir  = async () => { const p = await window.api.pickDir();  if (p) update({ workingDir: p }) }
  const handlePickJava = async () => { const p = await window.api.pickJava(); if (p) update({ javaPath: p }) }

  return (
    <div className="space-y-4">
      <Input
        label="JAR File"
        value={draft.jarPath}
        onChange={e => update({ jarPath: e.target.value })}
        placeholder="/path/to/server.jar"
        rightElement={<FolderBtn onClick={handlePickJar} />}
      />
      <Input
        label="Working Directory"
        value={draft.workingDir}
        onChange={e => update({ workingDir: e.target.value })}
        placeholder="Defaults to JAR directory"
        hint="Leave empty to use the directory containing the JAR"
        rightElement={<FolderBtn onClick={handlePickDir} />}
      />
      <Input
        label="Java Executable"
        value={draft.javaPath}
        onChange={e => update({ javaPath: e.target.value })}
        placeholder="java  (uses system PATH)"
        hint="Leave empty to use the java found on PATH"
        rightElement={<FolderBtn onClick={handlePickJava} />}
      />
    </div>
  )
}

function ArgSection({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-text-muted mt-0.5">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function FolderBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-text-muted hover:text-accent transition-colors">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 3.5h4l1.5 2H13v7H1V3.5z"/>
      </svg>
    </button>
  )
}

function buildCmdPreview(p: Profile): string {
  const parts: string[] = [p.javaPath || 'java']
  p.jvmArgs.filter(a => a.enabled && a.value).forEach(a => parts.push(a.value))
  p.systemProperties.filter(a => a.enabled && a.key).forEach(a =>
    parts.push(a.value ? `-D${a.key}=${a.value}` : `-D${a.key}`)
  )
  parts.push('-jar', p.jarPath || '<no jar>')
  p.programArgs.filter(a => a.enabled && a.value).forEach(a => parts.push(a.value))
  return parts.join(' ')
}
