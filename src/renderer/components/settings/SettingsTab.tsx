import React, { useState, useEffect, useMemo } from 'react'
import { useApp }          from '../../store/AppStore'
import { Button }          from '../common/Button'
import { Toggle }          from '../common/Toggle'
import { VersionChecker }  from './version/VersionChecker'
import type { AppSettings } from '../../types'
import { REST_API_CONFIG } from '../../../main/shared/config/RestApi.config'

export function SettingsTab() {
  const { state, saveSettings } = useApp()
  const [draft, setDraft] = useState<AppSettings | null>(null)
  const [saved, setSaved]  = useState(false)

  useEffect(() => { if (state.settings) setDraft({ ...state.settings }) }, [state.settings])

  const isDirty = useMemo(() => {
    if (!draft || !state.settings) return false
    return JSON.stringify(draft) !== JSON.stringify(state.settings)
  }, [draft, state.settings])

  if (!draft) return null

  const set = (patch: Partial<AppSettings>) => { setSaved(false); setDraft(prev => prev ? { ...prev, ...patch } : prev) }

  const handleSave = async () => { await saveSettings(draft); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

  return (
    <div className="flex flex-col h-full">
      {(isDirty || saved) && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0 animate-fade-in">
          <span className="text-xs text-text-secondary flex-1">{saved ? 'Settings saved' : 'Unsaved changes'}</span>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isDirty && !saved}>
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 max-w-2xl space-y-8">

          <Section title="Startup">
            <Row label="Launch on Windows startup" hint="Java Runner Client starts automatically when you log in">
              <Toggle checked={draft.launchOnStartup} onChange={v => set({ launchOnStartup: v })}/>
            </Row>
            <Row label="Start minimized to tray" hint="Window won't appear on startup — only the system tray icon" sub>
              <Toggle checked={draft.startMinimized} onChange={v => set({ startMinimized: v })} disabled={!draft.launchOnStartup}/>
            </Row>
            <Row label="Minimize to tray on close" hint="Closing the window keeps the app and running JARs alive in the background">
              <Toggle checked={draft.minimizeToTray} onChange={v => set({ minimizeToTray: v })}/>
            </Row>
          </Section>

          <Divider/>

          <Section title="Console">
            <Row label="Font size" hint="Console output font size in pixels">
              <div className="flex items-center gap-2.5">
                <input type="range" min={10} max={20} value={draft.consoleFontSize} onChange={e => set({ consoleFontSize: Number(e.target.value) })} className="w-24 accent-accent cursor-pointer"/>
                <span className="text-sm font-mono text-text-secondary w-10 text-right tabular-nums">{draft.consoleFontSize}px</span>
              </div>
            </Row>
            <Row label="Show line numbers" hint="Display a line number gutter in console output">
              <Toggle checked={draft.consoleLineNumbers} onChange={v => set({ consoleLineNumbers: v })}/>
            </Row>
            <Row label="Word wrap" hint="Wrap long lines instead of horizontal scrolling">
              <Toggle checked={draft.consoleWordWrap} onChange={v => set({ consoleWordWrap: v })}/>
            </Row>
            <Row label="Max lines in buffer" hint="Older lines are discarded when the limit is reached">
              <NumInput value={draft.consoleMaxLines} min={500} max={50000} step={500} onChange={v => set({ consoleMaxLines: v })}/>
            </Row>
            <Row label="Command history size" hint="Commands stored per session (Up/Down to navigate)">
              <NumInput value={draft.consoleHistorySize} min={10} max={2000} step={10} onChange={v => set({ consoleHistorySize: v })}/>
            </Row>
          </Section>

          <Divider/>

          <Section title="REST API">
            <Row label="Enable REST API" hint={`Exposes a local HTTP API for automation (default port ${REST_API_CONFIG.defaultPort})`}>
              <Toggle checked={draft.restApiEnabled} onChange={v => set({ restApiEnabled: v })}/>
            </Row>
            {draft.restApiEnabled && (
              <Row label="Port" hint="Restart required to change the port" sub>
                <NumInput value={draft.restApiPort} min={1024} max={65535} step={1} onChange={v => set({ restApiPort: v })}/>
              </Row>
            )}
            {draft.restApiEnabled && (
              <div className="rounded-lg border border-surface-border bg-base-900/50 px-3 py-2.5 pl-5">
                <p className="text-xs text-text-muted font-mono">
                  Listening on{' '}
                  <span className="text-accent">http://127.0.0.1:{draft.restApiPort}/api</span>
                </p>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  Endpoints: /status · /profiles · /processes · /settings
                </p>
              </div>
            )}
          </Section>

          <Divider/>

          <Section title="About">
            <VersionChecker currentVersion={version} />
            <Row label="Stack"><span className="font-mono text-xs text-text-secondary">Electron · React · TypeScript</span></Row>
            <Row label="Config"><span className="font-mono text-xs text-text-muted">%APPDATA%\java-runner-client</span></Row>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-0 divide-y divide-surface-border/50">{children}</div>
    </div>
  )
}

function Row({ label, hint, sub, children }: { label: string; hint?: string; sub?: boolean; children?: React.ReactNode }) {
  return (
    <div className={['flex items-center justify-between gap-6 py-3.5', sub ? 'pl-5' : ''].join(' ')}>
      <div className="flex-1 min-w-0">
        <p className={sub ? 'text-sm text-text-secondary' : 'text-sm text-text-primary'}>{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5 leading-4">{hint}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

function Divider() { return <div className="border-t border-surface-border"/> }

function NumInput({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(Number(e.target.value))}
      className="w-24 bg-transparent border border-surface-border rounded-md px-2.5 py-1.5 text-sm font-mono text-text-primary text-right focus:outline-none focus:border-accent/40 transition-colors"/>
  )
}
