import React from 'react';
import { Toggle } from '../../common/Toggle';
import { Section, Row, NumInput } from '../SettingsRow';
import { AppSettings } from '../../../../main/shared/types/App.types';

interface Props {
  draft: AppSettings;
  set: (patch: Partial<AppSettings>) => void;
}

export function ConsoleSection({ draft, set }: Props) {
  return (
    <Section title="Console">
      <Row label="Font size" hint="Console output font size in pixels">
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min={10}
            max={20}
            value={draft.consoleFontSize}
            onChange={(e) => set({ consoleFontSize: Number(e.target.value) })}
            className="w-24 accent-accent cursor-pointer"
          />
          <span className="text-sm font-mono text-text-secondary w-10 text-right tabular-nums">
            {draft.consoleFontSize}px
          </span>
        </div>
      </Row>
      <Row label="Show line numbers" hint="Display a line number gutter in console output">
        <Toggle
          checked={draft.consoleLineNumbers}
          onChange={(v) => set({ consoleLineNumbers: v })}
        />
      </Row>
      <Row label="Word wrap" hint="Wrap long lines instead of horizontal scrolling">
        <Toggle checked={draft.consoleWordWrap} onChange={(v) => set({ consoleWordWrap: v })} />
      </Row>
      <Row label="Max lines in buffer" hint="Older lines are discarded when the limit is reached">
        <NumInput
          value={draft.consoleMaxLines}
          min={500}
          max={50000}
          step={500}
          onChange={(v) => set({ consoleMaxLines: v })}
        />
      </Row>
      <Row label="Command history size" hint="Commands stored per session (Up/Down to navigate)">
        <NumInput
          value={draft.consoleHistorySize}
          min={10}
          max={2000}
          step={10}
          onChange={(v) => set({ consoleHistorySize: v })}
        />
      </Row>
    </Section>
  );
}
