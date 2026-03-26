import React from 'react';
import { Toggle } from '../../common/Toggle';
import { Section, Row, NumInput } from '../SettingsRow';
import { REST_API_CONFIG } from '../../../../main/shared/config/API.config';
import { AppSettings } from '../../../../main/shared/types/App.types';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function AdvancedSection({ draft, set }: Props) {
  return (
    <>
      <Section title="Developer Options">
        <Row
          label="Toggle Developer Mode (Right-Shift + 7)"
          hint="Enables the Developer tab and DevTools. Use with caution."
        >
          <Toggle checked={draft.devModeEnabled} onChange={(v) => set({ devModeEnabled: v })} />
        </Row>
      </Section>

      <Section title="REST API">
        <Row
          label="Enable REST API"
          hint={`Exposes a local HTTP API for automation (default port ${REST_API_CONFIG.defaultPort})`}
        >
          <Toggle checked={draft.restApiEnabled} onChange={(v) => set({ restApiEnabled: v })} />
        </Row>
        {draft.restApiEnabled && (
          <Row label="Port" hint="Restart required to change the port" sub>
            <NumInput
              value={draft.restApiPort}
              min={1024}
              max={65535}
              step={1}
              onChange={(v) => set({ restApiPort: v })}
            />
          </Row>
        )}
        {draft.restApiEnabled && (
          <div className="rounded-lg border border-surface-border bg-base-900/50 px-3 py-2.5 pl-5">
            <p className="text-xs text-text-muted font-mono">
              Listening on{' '}
              <span className="text-accent">
                http://{REST_API_CONFIG.host}:{draft.restApiPort}/api
              </span>
            </p>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              Endpoints: /status · /profiles · /processes · /logs · /settings
            </p>
          </div>
        )}
      </Section>
    </>
  );
}
