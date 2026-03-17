import React, { useState, useEffect, useRef } from 'react'
import { ProfileSidebar } from './profiles/ProfileSidebar'
import { ConsoleTab }     from './console/ConsoleTab'
import { ConfigTab }      from './profiles/ConfigTab'
import { ProfileTab }     from './profiles/ProfileTab'
import { SettingsTab }    from './settings/SettingsTab'
import { UtilitiesTab }   from './utils/UtilitiesTab'
import { FaqPanel }       from './faq/FaqPanel'
import { useApp }         from '../store/AppStore'
import { VscTerminal, VscAccount } from 'react-icons/vsc'
import { LuList } from 'react-icons/lu'

type MainTab   = 'console' | 'config' | 'profile'
type SidePanel = null | 'settings' | 'faq' | 'utilities'

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<MainTab>('console')
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const { state, activeProfile, isRunning } = useApp()
  const running = activeProfile ? isRunning(activeProfile.id) : false
  const color   = activeProfile?.color ?? '#4ade80'

  const prevId = useRef(state.activeProfileId)
  useEffect(() => {
    if (state.activeProfileId !== prevId.current) { prevId.current = state.activeProfileId; setActiveTab('console') }
  }, [state.activeProfileId])

  const handleProfileClick = () => { setSidePanel(null); setActiveTab('console') }
  const openPanel = (p: SidePanel) => setSidePanel(prev => prev === p ? null : p)

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProfileSidebar
        onOpenSettings={() => openPanel('settings')}
        onOpenFaq={() => openPanel('faq')}
        onOpenUtilities={() => openPanel('utilities')}
        onProfileClick={handleProfileClick}
        activeSidePanel={sidePanel}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        {sidePanel !== null ? (
          <>
            <div className="shrink-0">
              <div className="flex items-center gap-3 px-4 h-10 bg-base-900">
                <button onClick={() => setSidePanel(null)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2L4 6l4 4"/></svg>
                  Back
                </button>
                <div className="w-px h-4 bg-surface-border"/>
                <span className="text-xs font-medium text-text-secondary">
                  {{ settings: 'Application Settings', faq: 'FAQ', utilities: 'Utilities' }[sidePanel]}
                </span>
              </div>
              <div className="border-b border-surface-border"/>
            </div>
            <div className="flex-1 overflow-hidden bg-base-800">
              {sidePanel === 'settings'  && <SettingsTab />}
              {sidePanel === 'faq'       && <FaqPanel />}
              {sidePanel === 'utilities' && <UtilitiesTab />}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center px-4 pt-2 border-b border-surface-border bg-base-900 shrink-0">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as MainTab)}
                    className={['flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-all duration-150',
                      isActive ? 'font-medium' : 'text-text-muted border-transparent hover:text-text-primary'].join(' ')}
                    style={isActive ? { borderBottomColor: color, color } : {}}>
                    <tab.Icon size={13}/>
                    {tab.label}
                    {tab.id === 'console' && running && (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: color }}/>
                    )}
                  </button>
                )
              })}
              <div className="flex-1"/>
              {activeProfile && (
                <span className="text-xs text-text-muted font-mono truncate max-w-[160px] mr-1">{activeProfile.name}</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden bg-base-800 animate-fade-in">
              {activeTab === 'console' && <ConsoleTab />}
              {activeTab === 'config'  && <ConfigTab />}
              {activeTab === 'profile' && <ProfileTab />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TABS: { id: MainTab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'console', label: 'Console',   Icon: VscTerminal },
  { id: 'config',  label: 'Configure', Icon: LuList      },
  { id: 'profile', label: 'Profile',   Icon: VscAccount  },
]
