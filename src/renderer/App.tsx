import React from 'react'
import { AppProvider } from './store/AppStore'
import { TitleBar }   from './components/common/TitleBar'
import { MainLayout } from './components/MainLayout'

/**
 * App — root component.
 * Checks that window.api (injected by the Electron preload script) exists
 * before rendering the full UI. If it's missing the preload failed.
 */
export default function App() {
  // window.api is set by src/main/preload.ts via contextBridge.
  // It will be undefined if the preload script failed to compile or load.
  if (!window.api) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', gap: '16px',
        background: '#08090d', color: '#e8eaf2', fontFamily: 'monospace',
        padding: '40px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 32 }}>Warning</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#f87171' }}>
          Preload script not loaded
        </p>
        <p style={{ fontSize: 12, color: '#8b91a8', maxWidth: 500, lineHeight: 1.7 }}>
          <code>window.api</code> is undefined — the Electron preload script did not run.<br/>
          <br/>
          Fix: compile the main process first, then restart Electron:<br/>
          <code style={{ color: '#4ade80' }}>npx tsc -p tsconfig.main.json &amp;&amp; npx electron .</code>
          <br/><br/>
          Make sure <code>dist/main/preload.js</code> exists on disk before launching.
        </p>
      </div>
    )
  }

  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base-900 text-text-primary overflow-hidden select-none">
        <TitleBar />
        <MainLayout />
      </div>
    </AppProvider>
  )
}
