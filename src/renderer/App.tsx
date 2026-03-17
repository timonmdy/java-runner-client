import React from 'react'
import { AppProvider } from './store/AppStore'
import { TitleBar }   from './components/common/TitleBar'
import { MainLayout } from './components/MainLayout'
export default function App() {
  if (!window.api) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#08090d', color:'#e8eaf2', fontFamily:'monospace', textAlign:'center', padding:40 }}>
      <p style={{ color:'#f87171' }}>Preload script not loaded — window.api is undefined.</p>
    </div>
  )
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base-900 text-text-primary overflow-hidden select-none">
        <TitleBar />
        <MainLayout />
      </div>
    </AppProvider>
  )
}
