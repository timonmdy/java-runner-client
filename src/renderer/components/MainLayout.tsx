import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
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

const MAIN_TABS = [
  { path: 'console',  label: 'Console',   Icon: VscTerminal },
  { path: 'config',   label: 'Configure', Icon: LuList      },
  { path: 'profile',  label: 'Profile',   Icon: VscAccount  },
] as const

const SIDE_PANELS = ['settings', 'faq', 'utilities'] as const
type SidePanel = typeof SIDE_PANELS[number]

function isSidePanel(seg: string): seg is SidePanel {
  return (SIDE_PANELS as readonly string[]).includes(seg)
}

export function MainLayout() {
  const { state, activeProfile, isRunning, setActiveProfile } = useApp()
  const navigate  = useNavigate()
  const location  = useLocation()

  const segments     = location.pathname.replace(/^\//, '').split('/')
  const firstSeg     = segments[0] ?? 'console'
  const activePanel  = isSidePanel(firstSeg) ? firstSeg : null
  const activeTab    = activePanel ? 'console' : firstSeg

  const color   = activeProfile?.color ?? '#4ade80'
  const running = activeProfile ? isRunning(activeProfile.id) : false

  // When profile changes, go to console
  const prevIdRef = React.useRef(state.activeProfileId)
  useEffect(() => {
    if (state.activeProfileId !== prevIdRef.current) {
      prevIdRef.current = state.activeProfileId
      if (!activePanel) navigate('console', { replace: true })
    }
  }, [state.activeProfileId, activePanel, navigate])

  const openPanel = (panel: SidePanel) => {
    navigate(activePanel === panel ? 'console' : panel)
  }

  const handleProfileClick = () => {
    if (activePanel) navigate('console')
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ProfileSidebar
        onOpenSettings={() => openPanel('settings')}
        onOpenFaq={() => openPanel('faq')}
        onOpenUtilities={() => openPanel('utilities')}
        onProfileClick={handleProfileClick}
        activeSidePanel={activePanel}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {activePanel ? (
          <>
            {/* Panel header with back navigation */}
            <div className="shrink-0">
              <div className="flex items-center gap-3 px-4 h-10 bg-base-900">
                <button
                  onClick={() => navigate('console')}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2L4 6l4 4"/>
                  </svg>
                  Back
                </button>
                <div className="w-px h-4 bg-surface-border"/>
                <span className="text-xs font-medium text-text-secondary capitalize">
                  {{ settings: 'Application Settings', faq: 'FAQ', utilities: 'Utilities' }[activePanel]}
                </span>
              </div>
              <div className="border-b border-surface-border"/>
            </div>

            <div className="flex-1 overflow-hidden bg-base-800">
              <Routes>
                <Route path="settings"   element={<SettingsTab />} />
                <Route path="faq"        element={<FaqPanel />} />
                <Route path="utilities"  element={<UtilitiesTab />} />
              </Routes>
            </div>
          </>
        ) : (
          <>
            {/* Main tab bar */}
            <div className="flex items-center px-4 pt-2 border-b border-surface-border bg-base-900 shrink-0">
              {MAIN_TABS.map(tab => {
                const isActive = activeTab === tab.path
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-all duration-150',
                      isActive ? 'font-medium' : 'text-text-muted border-transparent hover:text-text-primary',
                    ].join(' ')}
                    style={isActive ? { borderBottomColor: color, color } : {}}
                  >
                    <tab.Icon size={13} />
                    {tab.label}
                    {tab.path === 'console' && running && (
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </button>
                )
              })}
              <div className="flex-1"/>
              {activeProfile && (
                <span className="text-xs text-text-muted font-mono truncate max-w-[160px] mr-1">
                  {activeProfile.name}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden bg-base-800 animate-fade-in">
              <Routes>
                <Route path="console" element={<ConsoleTab />} />
                <Route path="config"  element={<ConfigTab />} />
                <Route path="profile" element={<ProfileTab />} />
                <Route path="*"       element={<Navigate to="console" replace />} />
              </Routes>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
