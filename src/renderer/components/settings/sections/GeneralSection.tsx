import React from 'react';
import { Toggle } from '../../common/Toggle';
import { Section, Row } from '../SettingsRow';
import { AppSettings } from '../../../../main/shared/types/App.types';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function GeneralSection({ draft, set }: Props) {
  return (
    <>
      <Section title="Startup">
        <Row
          label="Launch on Windows startup"
          hint="Java Runner Client starts automatically when you log in"
        >
          <Toggle checked={draft.launchOnStartup} onChange={(v) => set({ launchOnStartup: v })} />
        </Row>
        <Row
          label="Start minimized to tray"
          hint="Window won't appear on startup -- only the system tray icon"
          sub
        >
          <Toggle
            checked={draft.startMinimized}
            onChange={(v) => set({ startMinimized: v })}
            disabled={!draft.launchOnStartup}
          />
        </Row>
        <Row
          label="Minimize to tray on close"
          hint="Closing the window keeps the app and running JARs alive in the background"
        >
          <Toggle checked={draft.minimizeToTray} onChange={(v) => set({ minimizeToTray: v })} />
        </Row>
      </Section>
    </>
  );
}
