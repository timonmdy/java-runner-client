// ─── Field definition types ────────────────────────────────────────────────

type BaseField = {
  section: string; // valid values: see SettingSection in Settings.config.ts
  group: string;
  label: string;
  hint?: string;
  hintParams?: Record<string, string>;
  sub?: boolean;
  showWhen?: (s: any) => boolean;
  disabledWhen?: (s: any) => boolean;
};

export type ToggleDef = BaseField & { type: 'toggle'; default: boolean };
export type NumberDef = BaseField & {
  type: 'number';
  default: number;
  min: number;
  max: number;
  step: number;
};
export type RangeDef = BaseField & {
  type: 'range';
  default: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
};
export type TextDef = BaseField & { type: 'text'; default: string };
export type NoteDef = {
  type: 'note';
  section: string;
  group: string;
  showWhen?: (s: any) => boolean;
  content: (s: any) => string[];
  accentPattern?: RegExp;
};

export type SettingFieldDef = ToggleDef | NumberDef | RangeDef | TextDef;
export type AnyFieldDef = SettingFieldDef | NoteDef;

// ─── Sidebar topic ─────────────────────────────────────────────────────────
// Generic so Settings.config can bind S = SettingSection without a circular dep.

export type SettingSidebarTopic<S extends string = string> = {
  id: S;
  label: string;
};

// ─── Inference helpers ─────────────────────────────────────────────────────

export type InferSettings<Schema extends Record<string, AnyFieldDef>> = {
  [K in keyof Schema as Schema[K] extends NoteDef ? never : K]: Schema[K] extends ToggleDef
    ? boolean
    : Schema[K] extends NumberDef | RangeDef
      ? number
      : Schema[K] extends TextDef
        ? string
        : never;
};

export function extractDefaults<Schema extends Record<string, AnyFieldDef>>(
  schema: Schema
): InferSettings<Schema> {
  const result: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema)) {
    if (field.type !== 'note') {
      result[key] = (field as SettingFieldDef).default;
    }
  }
  return result as InferSettings<Schema>;
}
