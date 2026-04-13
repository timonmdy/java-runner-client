import React, { useEffect, useMemo } from 'react';
import { LuList, LuScrollText } from 'react-icons/lu';
import { VscAccount, VscTerminal } from 'react-icons/vsc';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../AppProvider';
import { useDevMode } from '../hooks/useDevMode';
import { useTranslation } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/TranslationKeys';
import { StatusDot } from './common/display';
import { PanelHeader, TabBar } from './common/layout/navigation';
import { ConsoleTab } from './console/ConsoleTab';
import { DeveloperTab } from './developer/DeveloperTab';
import { FaqPanel } from './faq/FaqPanel';
import { ConfigTab } from './profiles/ConfigTab';
import { LogsTab } from './profiles/LogsTab';
import { ProfileSidebar } from './profiles/ProfileSidebar';
import { ProfileTab } from './profiles/ProfileTab';
import { SettingsTab } from './settings/SettingsTab';
import { UtilitiesTab } from './utils/UtilitiesTab';

const SIDE_PANELS = ['settings', 'faq', 'utilities', 'developer'] as const;
type SidePanel = (typeof SIDE_PANELS)[number];

const PANEL_LABEL_KEYS: Record<SidePanel, TranslationKey> = {
  settings: 'panels.settings',
  faq: 'panels.faq',
  utilities: 'panels.utilities',
  developer: 'panels.developer',
};

function isSidePanel(seg: string): seg is SidePanel {
  return (SIDE_PANELS as readonly string[]).includes(seg);
}

const PROFILE_TABS = [
  { path: 'console', labelKey: 'tabs.console', Icon: VscTerminal },
  { path: 'config', labelKey: 'tabs.configure', Icon: LuList },
  { path: 'logs', labelKey: 'tabs.logs', Icon: LuScrollText },
  { path: 'profile', labelKey: 'tabs.profile', Icon: VscAccount },
] as const;

export function MainLayout() {
  const { state, activeProfile, isRunning } = useApp();
  const devMode = useDevMode();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const segments = location.pathname.replace(/^\//, '').split('/');
  const firstSeg = segments[0] ?? 'console';
  const activePanel = isSidePanel(firstSeg) ? firstSeg : null;
  const activeTab = activePanel ? 'console' : firstSeg;

  const color = activeProfile?.color ?? '#4ade80';
  const running = activeProfile ? isRunning(activeProfile.id) : false;

  const profileTabs = useMemo(
    () =>
      PROFILE_TABS.map((tab) => ({
        id: tab.path,
        label: t(tab.labelKey),
        Icon: tab.Icon,
        badge: tab.path === 'console' && running ? <StatusDot color={color} pulse /> : undefined,
      })),
    [t, running, color]
  );

  useEffect(() => {
    if (!devMode && activePanel === 'developer') {
      navigate('/console', { replace: true });
    }
  }, [devMode, activePanel, navigate]);

  const prevIdRef = React.useRef(state.activeProfileId);
  useEffect(() => {
    if (state.activeProfileId !== prevIdRef.current) {
      prevIdRef.current = state.activeProfileId;
      if (!activePanel) navigate('/console', { replace: true });
    }
  }, [state.activeProfileId, activePanel, navigate]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <ProfileSidebar activeSidePanel={activePanel} />

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {activePanel ? (
          <>
            <PanelHeader title={t(PANEL_LABEL_KEYS[activePanel])} />
            <div className="flex-1 min-h-0 overflow-hidden animate-fade-in">
              <Routes>
                <Route path="settings" element={<SettingsTab />} />
                <Route path="faq" element={<FaqPanel />} />
                <Route path="utilities" element={<UtilitiesTab />} />
                <Route path="developer" element={<DeveloperTab />} />
                <Route path="*" element={<Navigate to="/console" replace />} />
              </Routes>
            </div>
          </>
        ) : (
          <>
            <TabBar
              tabs={profileTabs}
              active={activeTab}
              onChange={(id) => navigate(`/${id}`)}
              accentColor={color}
              trailing={
                activeProfile && (
                  <span className="text-xs text-text-muted font-mono truncate max-w-[160px]">
                    {activeProfile.name}
                  </span>
                )
              }
            />

            <div className="flex-1 min-h-0 overflow-hidden animate-fade-in">
              <Routes>
                <Route path="console" element={<ConsoleTab />} />
                <Route path="config" element={<ConfigTab />} />
                <Route path="logs" element={<LogsTab />} />
                <Route path="profile" element={<ProfileTab />} />
                <Route path="*" element={<Navigate to="/console" replace />} />
              </Routes>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
