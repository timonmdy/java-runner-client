import type { AppSettings } from '@shared/config/Settings.config';
import { SETTINGS_SCHEMA } from '@shared/config/Settings.config';
import type { AnyFieldDef, NoteDef, NumberDef, RangeDef } from '@shared/types/Settings.types';
import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/TranslationKeys';
import { Toggle } from '../common/inputs';
import { Section } from '../common/layout/containers';
import { NumInput, Row } from './SettingsRow';

type SetFn = (patch: Partial<AppSettings>) => void;

// ─── Note renderer ─────────────────────────────────────────────────────────

function renderLine(line: string, pattern?: RegExp): React.ReactNode {
  if (!pattern) return line;
  const match = pattern.exec(line);
  if (!match) return line;
  return (
    <>
      {line.slice(0, match.index)}
      <span className="text-accent">{match[0]}</span>
      {line.slice(match.index + match[0].length)}
    </>
  );
}

// ─── Single field ──────────────────────────────────────────────────────────

function SettingsField({
  fieldKey,
  field,
  draft,
  set,
}: {
  fieldKey: string;
  field: AnyFieldDef;
  draft: AppSettings;
  set: SetFn;
}) {
  const { t } = useTranslation();
  const s = draft as Record<string, unknown>;

  if (field.showWhen && !field.showWhen(s)) return null;

  if (field.type === 'note') {
    const note = field as NoteDef;
    return (
      <div className="rounded-lg border border-surface-border bg-base-900/50 px-3 py-2.5 pl-5">
        {note.content(s).map((line, i) => (
          <p key={i} className="text-xs text-text-muted font-mono">
            {renderLine(line, note.accentPattern)}
          </p>
        ))}
      </div>
    );
  }

  const disabled = field.disabledWhen?.(s) ?? false;
  const label = t(field.label as TranslationKey);
  const hint = field.hint ? t(field.hint as TranslationKey, field.hintParams) : undefined;

  return (
    <Row label={label} hint={hint} sub={field.sub}>
      {field.type === 'toggle' && (
        <Toggle
          checked={s[fieldKey] as boolean}
          onChange={(v) => set({ [fieldKey]: v } as Partial<AppSettings>)}
          disabled={disabled}
        />
      )}

      {field.type === 'number' &&
        (() => {
          const f = field as NumberDef;
          return (
            <NumInput
              value={s[fieldKey] as number}
              min={f.min}
              max={f.max}
              step={f.step}
              onChange={(v) => set({ [fieldKey]: v } as Partial<AppSettings>)}
            />
          );
        })()}

      {field.type === 'range' &&
        (() => {
          const f = field as RangeDef;
          const val = s[fieldKey] as number;
          return (
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={val}
                onChange={(e) =>
                  set({ [fieldKey]: Number(e.target.value) } as Partial<AppSettings>)
                }
                className="w-24 accent-accent cursor-pointer"
              />
              <span className="text-sm font-mono text-text-secondary w-10 text-right tabular-nums">
                {val}
                {f.unit ?? ''}
              </span>
            </div>
          );
        })()}
    </Row>
  );
}

// ─── Section renderer ──────────────────────────────────────────────────────

export function SettingsSectionRenderer({
  section,
  draft,
  set,
}: {
  section: string;
  draft: AppSettings;
  set: SetFn;
}) {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const map = new Map<string, [string, AnyFieldDef][]>();
    for (const [key, field] of Object.entries(SETTINGS_SCHEMA)) {
      if (field.section !== section) continue;
      if (!map.has(field.group!)) map.set(field.group!, []);
      map.get(field.group!)!.push([key, field]);
    }
    return map;
  }, [section]);

  return (
    <>
      {[...groups.entries()].map(([groupKey, fields]) => (
        <Section key={groupKey} title={t(groupKey as TranslationKey)} divided>
          {fields.map(([key, field]) => (
            <SettingsField key={key} fieldKey={key} field={field} draft={draft} set={set} />
          ))}
        </Section>
      ))}
    </>
  );
}
