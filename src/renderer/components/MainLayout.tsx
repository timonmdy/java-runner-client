/**
 * MainLayout — root layout.
 * Main tabs:    Console | Configure | Profile
 * Side panels:  Settings | FAQ | Utilities (via sidebar footer)
 *
 * Clicking any profile while a side-panel is open:
 *   → closes the panel, switches to that profile, goes to Console tab
 */
import React, { useState, useEffect, useRef } from 'react'
import { ProfileSidebar } from './profiles/ProfileSidebar'
import { ConsoleTab }     from './console/ConsoleTab'
import { ConfigTab, configTabHasUnsavedInputs }      from './profiles/ConfigTab'
import { ProfileTab }     from './profiles/ProfileTab'
import { SettingsTab }    from './settings/SettingsTab'
import { UtilitiesTab }   from './utils/UtilitiesTab'
import { Dialog }         from './common/Dialog'
import { useApp }         from '../store/AppStore'
import { VscTerminal, VscAccount } from 'react-icons/vsc'
import { LuList } from 'react-icons/lu'

type MainTab   = 'console' | 'config' | 'profile'
type SidePanel = null | 'settings' | 'faq' | 'utilities'

export function MainLayout() {
  const [activeTab,  setActiveTab]  = useState<MainTab>('console')
  const [sidePanel,  setSidePanel]  = useState<SidePanel>(null)
  const [pendingTab, setPendingTab] = useState<MainTab | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { state, activeProfile, isRunning } = useApp()

  const running = activeProfile ? isRunning(activeProfile.id) : false
  const color   = activeProfile?.color ?? '#4ade80'

  // When profile changes (and no side-panel triggered it), go to Console
  const prevId = useRef(state.activeProfileId)
  useEffect(() => {
    if (state.activeProfileId !== prevId.current) {
      prevId.current = state.activeProfileId
      setActiveTab('console')
    }
  }, [state.activeProfileId])

  // Called when user clicks a profile item — always closes panel + goes to Console
  const handleProfileClick = () => {
    setSidePanel(null)
    setActiveTab('console')
  }

  const openPanel = (p: SidePanel) =>
    setSidePanel(prev => prev === p ? null : p)

  // Handle tab switching with unsaved inputs check
  const handleTabClick = (tab: MainTab) => {
    if (activeTab === 'config' && configTabHasUnsavedInputs() && tab !== 'config') {
      setPendingTab(tab)
      setShowConfirm(true)
      return
    }
    setActiveTab(tab)
  }

  const handleDiscardChanges = () => {
    setShowConfirm(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }

  const handleCancelSwitch = () => {
    setShowConfirm(false)
    setPendingTab(null)
  }

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
          // ── Side panel ─────────────────────────────────────────────────────
          <>
            {/* Panel header with separator */}
            <div className="shrink-0">
              <div className="flex items-center gap-3 px-4 h-10 bg-base-900">
                <button onClick={() => setSidePanel(null)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2L4 6l4 4"/>
                  </svg>
                  Back
                </button>
                <div className="w-px h-4 bg-surface-border"/>
                <span className="text-xs font-medium text-text-secondary">
                  {PANEL_TITLES[sidePanel]}
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
          // ── Main tabs ───────────────────────────────────────────────────────
          <>
            <div className="flex items-center px-4 pt-2 border-b border-surface-border bg-base-900 shrink-0">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => handleTabClick(tab.id as MainTab)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 -mb-px transition-all duration-150',
                      isActive ? 'font-medium' : 'text-text-muted border-transparent hover:text-text-primary',
                    ].join(' ')}
                    style={isActive ? { borderBottomColor: color, color } : {}}>
                    <tab.Icon size={13} />
                    {tab.label}
                    {tab.id === 'console' && running && (
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: color }}/>
                    )}
                  </button>
                )
              })}
              <div className="flex-1"/>
              {activeProfile && (
                <span className="text-xs text-text-muted font-mono truncate max-w-[160px] mr-1" title={activeProfile.name}>
                  {activeProfile.name}
                </span>
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

      {/* Unsaved changes warning dialog */}
      <Dialog
        open={showConfirm}
        title="Unsaved changes"
        message="You have unsaved changes to this profile. Discard them and switch tabs?"
        confirmLabel="Discard"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelSwitch}
      />
    </div>
  )
}

const PANEL_TITLES: Record<NonNullable<SidePanel>, string> = {
  settings:  'Application Settings',
  faq:       'FAQ',
  utilities: 'Utilities',
}

const TABS: { id: MainTab; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'console', label: 'Console',   Icon: VscTerminal },
  { id: 'config',  label: 'Configure', Icon: LuList      },
  { id: 'profile', label: 'Profile',   Icon: VscAccount  },
]

// ── FAQ Panel ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'What is Java Runner Client?',
    a: 'Java Runner Client (JRC) lets you run and manage JAR files as persistent background processes. You create a profile for each JAR, configure its arguments, and start/stop it from the Console tab. JRC is ideal for long-running servers (Minecraft, Spring Boot, background tools) that you want to keep running even after closing the window.',
  },
  {
    q: 'How do I get started quickly?',
    a: '1. Click "+" in the sidebar to create a profile.\n2. Go to the Configure tab and click the folder icon next to "JAR File" to select your .jar.\n3. Go back to Console and click Run.\nThat\'s it. The process starts and all output appears in the console.',
  },
  {
    q: 'How do I run a Minecraft server?',
    a: 'Create a profile and set the JAR path to your server .jar. In Configure → Program Args add --nogui. Set Working Directory to your server folder so world files are created there. Use -Xmx4g as a JVM Arg to give it 4 GB RAM. Then click Run on the Console tab.',
  },
  {
    q: 'How do I run a Spring Boot app?',
    a: 'Create a profile and set your JAR. In Configure → Properties (-D) add spring.profiles.active = prod to activate a profile, and server.port = 8080 to set the port. No program arguments are usually needed.',
  },
  {
    q: 'How do I send commands to a running process?',
    a: 'On the Console tab, type in the input bar at the bottom and press Enter. This sends text to the process stdin — works for Minecraft commands, Spring Shell, or any interactive CLI. Press Up/Down to navigate your command history. Ctrl+L clears the output.',
  },
  {
    q: 'How do I keep JARs running after closing the window?',
    a: 'Enable "Minimize to tray on close" in Settings. Closing the window will hide it to the system tray rather than stopping processes. Double-click the tray icon to restore. Your JARs keep running in the background.',
  },
  {
    q: 'How do I auto-start a JAR on Windows boot?',
    a: 'Enable "Launch on Windows startup" and "Start minimized" in Settings. Then open the Profile tab for that profile and enable "Auto-start on app launch". JRC will start silently on login and immediately launch the JAR.',
  },
  {
    q: 'Why is java not found when starting?',
    a: 'Java is not installed or not on your system PATH. In Configure → Files, set an explicit path to the java executable, e.g. C:\\Program Files\\Java\\jdk-21\\bin\\java.exe. You can click the folder icon to browse for it.',
  },
  {
    q: 'How do I pass JVM memory settings?',
    a: 'In Configure → JVM Args, add -Xmx2g (maximum heap 2 GB) and -Xms512m (initial heap 512 MB). Each argument is on its own row and can be toggled on/off without deleting it.',
  },
  {
    q: 'How do I kill a stuck process from a previous session?',
    a: 'Open Utilities from the sidebar. Go to Process Scanner → click Scan. All running processes are listed; java ones are highlighted in green at the top. Click Kill next to the stuck process. "Kill All Java" terminates every java process on the machine at once.',
  },
  {
    q: 'Where is the config file stored?',
    a: 'Windows: %APPDATA%\\java-runner-client\\java-runner-config.json\nLinux: ~/.config/java-runner-client/\nmacOS: ~/Library/Application Support/java-runner-client/\n\nYou can edit this JSON file directly — changes apply on next launch.',
  },
]

function FaqPanel() {
  const [open, setOpen] = useState<number | null>(0)  // first item open by default
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-5 max-w-2xl space-y-2">
        <p className="text-sm text-text-muted mb-5 leading-relaxed">
          Everything you need to know about using Java Runner Client.
        </p>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border border-surface-border rounded-lg overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-raised transition-colors gap-4">
              <span className="text-sm font-medium text-text-primary">{item.q}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className={['shrink-0 text-text-muted transition-transform duration-150', open === i ? 'rotate-180' : ''].join(' ')}>
                <path d="M2 4l4 4 4-4"/>
              </svg>
            </button>
            {open === i && (
              <div className="px-4 pb-4 pt-3 text-sm text-text-secondary leading-relaxed border-t border-surface-border animate-fade-in whitespace-pre-line">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
