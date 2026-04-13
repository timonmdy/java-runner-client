import { REST_API_CONFIG, routeConfig } from '@shared/config/API.config';
import { JSON_TOKEN_COLORS } from '@shared/config/Dev.config';
import { BodyParamDef, BodyParams, RouteDefinition } from '@shared/types/API.types';
import { JsonToken } from '@shared/types/Dev.types';
import React, { useCallback, useMemo, useState } from 'react';
import { VscCheck, VscCode, VscCopy, VscEdit, VscPlay } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { useInputContextMenu } from '../../hooks/useInputContextMenu';
import { useTranslation } from '../../i18n/I18nProvider';
import { Badge } from '../common/display';
import { Button, Toggle } from '../common/inputs';
import { ContextMenu, ContextMenuItem } from '../common/overlays';

// ─── Constants ───────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-accent border-accent/30 bg-accent/10',
  POST: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  PUT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  DELETE: 'text-red-400 border-red-400/30 bg-red-400/10',
};

const GROUP_LABELS: Record<string, string> = {
  status: 'Base',
  profiles: 'Profiles',
  processes: 'Processes',
  logs: 'Logs',
  settings: 'Settings',
};

const HAS_BODY = ['POST', 'PUT', 'PATCH'];

// ─── Types ───────────────────────────────────────────────────────────────────

type RouteEntry = { key: string; route: RouteDefinition };
type RouteGroup = { prefix: string; label: string; routes: RouteEntry[] };
type FormValues = Record<string, string | boolean>;
type BodyMode = 'form' | 'raw';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGroups(): RouteGroup[] {
  const groups = new Map<string, RouteGroup>();
  for (const [key, route] of Object.entries(routeConfig)) {
    const prefix = key === 'status' ? 'status' : key.split('_')[0];
    if (!groups.has(prefix)) {
      groups.set(prefix, {
        prefix,
        label: GROUP_LABELS[prefix] ?? prefix,
        routes: [],
      });
    }
    groups.get(prefix)!.routes.push({ key, route: route as RouteDefinition });
  }
  return Array.from(groups.values());
}

function initFormValues(bodyParams: BodyParams): FormValues {
  const vals: FormValues = {};
  for (const [k, def] of Object.entries(bodyParams)) {
    vals[k] = def.type === 'boolean' ? false : '';
  }
  return vals;
}

function buildBodyFromForm(bodyParams: BodyParams, values: FormValues): string {
  const obj: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(bodyParams)) {
    const val = values[k];
    if (def.type === 'boolean') {
      obj[k] = val === true;
    } else if (def.type === 'number') {
      if (val !== '') {
        const n = Number(val);
        if (!isNaN(n)) obj[k] = n;
      }
    } else if (def.type === 'json') {
      if (val !== '') {
        try {
          obj[k] = JSON.parse(val as string);
        } catch {
          /* skip invalid json */
        }
      }
    } else {
      if (val !== '') obj[k] = String(val);
    }
  }
  return JSON.stringify(obj, null, 2);
}

function parseFormFromJson(bodyParams: BodyParams, json: string): FormValues {
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const vals: FormValues = {};
    for (const [k, def] of Object.entries(bodyParams)) {
      const v = obj[k];
      if (v === undefined || v === null) {
        vals[k] = def.type === 'boolean' ? false : '';
      } else if (def.type === 'boolean') {
        vals[k] = Boolean(v);
      } else if (def.type === 'json') {
        vals[k] = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
      } else {
        vals[k] = String(v);
      }
    }
    return vals;
  } catch {
    return initFormValues(bodyParams);
  }
}

// ─── JSON syntax highlighter ─────────────────────────────────────────────────

function tokenizeJson(text: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let i = 0;
  while (i < text.length) {
    const ws = text.slice(i).match(/^[\s,:\[\]{}]+/);
    if (ws) {
      for (const ch of ws[0])
        tokens.push({ type: '{}[],:'.includes(ch) ? 'punct' : 'plain', value: ch });
      i += ws[0].length;
      continue;
    }
    if (text[i] === '"') {
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      tokens.push({
        type: text.slice(j).match(/^\s*:/) ? 'key' : 'string',
        value: text.slice(i, j),
      });
      i = j;
      continue;
    }
    const num = text.slice(i).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
    if (num) {
      tokens.push({ type: 'number', value: num[0] });
      i += num[0].length;
      continue;
    }
    const kw = text.slice(i).match(/^(true|false|null)/);
    if (kw) {
      tokens.push({ type: kw[0] === 'null' ? 'null' : 'boolean', value: kw[0] });
      i += kw[0].length;
      continue;
    }
    tokens.push({ type: 'plain', value: text[i] });
    i++;
  }
  return tokens;
}

function JsonHighlight({ text }: { text: string }) {
  let isJson = false;
  try {
    JSON.parse(text);
    isJson = true;
  } catch {
    /* not json */
  }
  if (!isJson) return <span className="text-text-secondary">{text}</span>;
  return (
    <>
      {tokenizeJson(text).map((tok, i) => (
        <span key={i} className={JSON_TOKEN_COLORS[tok.type]}>
          {tok.value}
        </span>
      ))}
    </>
  );
}

// ─── Body form field ─────────────────────────────────────────────────────────

function BodyFormField({
  name,
  def,
  value,
  onChange,
  onContextMenu,
  labelRequired,
  labelOptional,
}: {
  name: string;
  def: BodyParamDef;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  onContextMenu: (e: React.MouseEvent<HTMLInputElement>) => void;
  labelRequired: string;
  labelOptional: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-surface-border/30 last:border-b-0">
      <div className="w-40 shrink-0 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-text-primary">{name}</span>
          <span
            className={[
              'text-[9px] font-mono px-1 py-px rounded border',
              def.required
                ? 'text-red-400 border-red-400/30 bg-red-400/10'
                : 'text-text-muted/60 border-surface-border/60',
            ].join(' ')}
          >
            {def.required ? labelRequired : labelOptional}
          </span>
        </div>
        {def.hint && (
          <p className="text-[10px] text-text-muted/60 mt-0.5 leading-tight">{def.hint}</p>
        )}
      </div>
      <div className="flex-1 flex items-center min-w-0">
        {def.type === 'boolean' ? (
          <Toggle checked={value as boolean} onChange={onChange} />
        ) : def.type === 'json' ? (
          <textarea
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onContextMenu={onContextMenu as any}
            placeholder={def.placeholder ?? '[]'}
            spellCheck={false}
            rows={3}
            className="w-full bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-colors resize-y min-h-[2rem]"
          />
        ) : (
          <input
            type={def.type === 'number' ? 'number' : 'text'}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            onContextMenu={onContextMenu}
            placeholder={def.placeholder ?? ''}
            className="w-full bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
          />
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DevApiExplorer() {
  const { state } = useApp();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<RouteDefinition | null>(null);
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [bodyMode, setBodyMode] = useState<BodyMode>('form');
  const [formValues, setFormValues] = useState<FormValues>({});
  const [rawBody, setRawBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [responseCopied, setResponseCopied] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const { onContextMenu: onInputContextMenu, contextMenu: inputContextMenu } =
    useInputContextMenu();

  const port = state.settings?.restApiPort ?? REST_API_CONFIG.defaultPort;
  const restEnabled = state.settings?.restApiEnabled ?? false;

  const groups = useMemo(() => getGroups(), []);

  // ── Selection ──────────────────────────────────────────────────────────────

  const handleSelect = (route: RouteDefinition) => {
    setSelected(route);
    setResponse(null);
    setIsEditing(false);

    const params: Record<string, string> = {};
    for (const m of route.path.matchAll(/:([a-zA-Z]+)/g)) params[m[1]] = '';
    setPathParams(params);

    if (HAS_BODY.includes(route.method)) {
      if (route.bodyParams) {
        setBodyMode('form');
        setFormValues(initFormValues(route.bodyParams));
        setRawBody('');
      } else {
        setBodyMode('raw');
        setRawBody(route.bodyTemplate ?? '');
        setFormValues({});
      }
    }
  };

  // ── URL building ───────────────────────────────────────────────────────────

  const buildUrl = useCallback(() => {
    if (!selected) return '';
    let path = selected.path;
    for (const [k, v] of Object.entries(pathParams)) path = path.replace(`:${k}`, v || `:${k}`);
    return `http://${REST_API_CONFIG.host}:${port}${path}`;
  }, [selected, pathParams, port]);

  // ── Body resolution ────────────────────────────────────────────────────────

  const getBody = useCallback((): string => {
    if (!selected || !HAS_BODY.includes(selected.method)) return '';
    if (bodyMode === 'form' && selected.bodyParams) {
      return buildBodyFromForm(selected.bodyParams, formValues);
    }
    return rawBody;
  }, [selected, bodyMode, formValues, rawBody]);

  // ── Body mode toggle ───────────────────────────────────────────────────────

  const switchBodyMode = (mode: BodyMode) => {
    if (!selected?.bodyParams || mode === bodyMode) return;
    if (mode === 'raw') {
      setRawBody(buildBodyFromForm(selected.bodyParams, formValues));
    } else {
      setFormValues(parseFormFromJson(selected.bodyParams, rawBody));
    }
    setBodyMode(mode);
  };

  // ── Send request ───────────────────────────────────────────────────────────

  const handleCall = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse(null);
    setIsEditing(false);
    try {
      const opts: RequestInit = { method: selected.method };
      const body = getBody();
      if (body.trim() && HAS_BODY.includes(selected.method)) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = body;
      }
      const res = await fetch(buildUrl(), opts);
      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  };

  // ── Copy helpers ───────────────────────────────────────────────────────────

  const copyUrl = () => {
    navigator.clipboard.writeText(buildUrl());
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 1500);
  };

  const copyResponse = useCallback(() => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setResponseCopied(true);
    setTimeout(() => setResponseCopied(false), 1500);
  }, [response]);

  // ── Context menus ──────────────────────────────────────────────────────────

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, extra: ContextMenuItem[] = []) => {
      const sel = window.getSelection()?.toString() ?? '';
      e.preventDefault();
      setCtxMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          {
            label: t('general.copy'),
            icon: <VscCopy size={12} />,
            disabled: !sel,
            onClick: () => navigator.clipboard.writeText(sel),
          },
          ...extra,
        ],
      });
    },
    [t]
  );

  const responseCtxItems = useCallback(
    (): ContextMenuItem[] =>
      response
        ? [
            { type: 'separator' },
            {
              label: t('general.copyAll'),
              icon: <VscCopy size={12} />,
              onClick: () => navigator.clipboard.writeText(response),
            },
          ]
        : [],
    [response, t]
  );

  const hasBody = selected ? HAS_BODY.includes(selected.method) : false;
  const hasFormMode = hasBody && !!selected?.bodyParams;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-56 shrink-0 border-r border-surface-border overflow-y-auto bg-base-900/50 flex flex-col">
        {!restEnabled && (
          <div className="mx-2 mt-2 px-2 py-1.5 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-[10px] font-mono text-yellow-400 leading-snug">
            {t('dev.api.restDisabled')}
          </div>
        )}
        <div className="flex-1 py-2">
          {groups.map((group) => (
            <div key={group.prefix}>
              <div className="px-3 pt-3 pb-0.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">
                  {group.label}
                </span>
              </div>
              {group.routes.map(({ key, route }) => (
                <button
                  key={key}
                  onClick={() => handleSelect(route)}
                  className={[
                    'w-full text-left px-3 py-2 transition-colors',
                    selected === route
                      ? 'bg-surface-raised border-r-2 border-accent'
                      : 'hover:bg-surface-raised/50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        'text-[10px] font-mono border rounded px-1 py-px shrink-0',
                        METHOD_COLORS[route.method],
                      ].join(' ')}
                    >
                      {route.method}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">
                    {route.path}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">{route.description}</p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-xs font-mono text-text-muted">
            {t('dev.api.selectRoute')}
          </div>
        ) : (
          <>
            {/* URL bar */}
            <div className="px-4 py-3 border-b border-surface-border bg-base-900 shrink-0 space-y-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'text-xs font-mono border rounded px-1.5 py-0.5 shrink-0',
                    METHOD_COLORS[selected.method],
                  ].join(' ')}
                >
                  {selected.method}
                </span>
                <code
                  onContextMenu={(e) => handleContextMenu(e)}
                  className="flex-1 text-xs font-mono text-text-primary bg-base-950 border border-surface-border rounded px-2.5 py-1.5 truncate select-text"
                >
                  {buildUrl()}
                </code>
                <button
                  onClick={copyUrl}
                  title={t('dev.api.copyUrl')}
                  className="text-text-muted hover:text-accent transition-colors p-1 shrink-0"
                >
                  {urlCopied ? (
                    <VscCheck size={13} className="text-accent" />
                  ) : (
                    <VscCopy size={13} />
                  )}
                </button>
                <Button variant="primary" size="sm" onClick={handleCall} loading={loading}>
                  <VscPlay size={11} />
                  {t('dev.api.send')}
                </Button>
              </div>

              {/* Path params */}
              {Object.keys(pathParams).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/60">
                    {t('dev.api.pathParams')}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(pathParams).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <Badge label={`:${k}`} variant="default" />
                        <input
                          value={v}
                          onChange={(e) => setPathParams((p) => ({ ...p, [k]: e.target.value }))}
                          onContextMenu={onInputContextMenu}
                          placeholder="value"
                          className="w-28 bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Body + Response panels */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Body panel */}
              {hasBody && (
                <div
                  className={[
                    'border-r border-surface-border flex flex-col min-h-0',
                    response !== null ? 'w-[45%]' : 'w-full',
                  ].join(' ')}
                >
                  {/* Body panel header */}
                  <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/60">
                      {t('dev.api.requestBody')}
                    </span>
                    {hasFormMode && (
                      <div className="flex items-center gap-0.5 bg-base-950 border border-surface-border rounded p-0.5">
                        <button
                          onClick={() => switchBodyMode('form')}
                          className={[
                            'px-2 py-0.5 rounded text-[10px] font-mono transition-colors',
                            bodyMode === 'form'
                              ? 'bg-surface-raised text-text-primary'
                              : 'text-text-muted hover:text-text-secondary',
                          ].join(' ')}
                        >
                          {t('dev.api.formMode')}
                        </button>
                        <button
                          onClick={() => switchBodyMode('raw')}
                          className={[
                            'px-2 py-0.5 rounded text-[10px] font-mono transition-colors',
                            bodyMode === 'raw'
                              ? 'bg-surface-raised text-text-primary'
                              : 'text-text-muted hover:text-text-secondary',
                          ].join(' ')}
                        >
                          {t('dev.api.rawJson')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body panel content */}
                  {bodyMode === 'form' && selected.bodyParams ? (
                    <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
                      {Object.entries(selected.bodyParams).map(([name, def]) => (
                        <BodyFormField
                          key={name}
                          name={name}
                          def={def}
                          value={formValues[name] ?? (def.type === 'boolean' ? false : '')}
                          onChange={(v) => setFormValues((prev) => ({ ...prev, [name]: v }))}
                          onContextMenu={onInputContextMenu}
                          labelRequired={t('dev.api.required')}
                          labelOptional={t('dev.api.optional')}
                        />
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={rawBody}
                      onChange={(e) => setRawBody(e.target.value)}
                      onContextMenu={onInputContextMenu}
                      spellCheck={false}
                      placeholder={'{\n  \n}'}
                      className="flex-1 bg-base-950 text-xs font-mono text-text-primary px-3 py-2 resize-none focus:outline-none select-text min-h-0 placeholder:text-text-muted/40"
                    />
                  )}
                </div>
              )}

              {/* Response panel */}
              <div
                className={[
                  'flex flex-col overflow-hidden min-h-0',
                  hasBody && response !== null ? 'flex-1' : hasBody ? 'hidden' : 'flex-1',
                ].join(' ')}
              >
                {/* Response header */}
                <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0 flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/60">
                    {t('dev.api.response')}
                  </span>
                  {response !== null && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setIsEditing((v) => !v)}
                        title={isEditing ? t('dev.api.viewFormatted') : t('dev.api.editRaw')}
                        className={[
                          'p-1 rounded transition-colors',
                          isEditing ? 'text-accent' : 'text-text-muted hover:text-accent',
                        ].join(' ')}
                      >
                        {isEditing ? <VscCode size={13} /> : <VscEdit size={13} />}
                      </button>
                      <button
                        onClick={copyResponse}
                        title={t('dev.api.copyResponse')}
                        className="p-1 rounded text-text-muted hover:text-accent transition-colors"
                      >
                        {responseCopied ? (
                          <VscCheck size={13} className="text-accent" />
                        ) : (
                          <VscCopy size={13} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Response content */}
                {isEditing ? (
                  <textarea
                    value={response ?? ''}
                    onChange={(e) => setResponse(e.target.value)}
                    onContextMenu={onInputContextMenu}
                    spellCheck={false}
                    className="flex-1 overflow-auto px-3 py-2 text-xs font-mono text-text-secondary bg-base-950 resize-none focus:outline-none select-text min-h-0"
                  />
                ) : (
                  <pre
                    onContextMenu={(e) => handleContextMenu(e, responseCtxItems())}
                    className="flex-1 overflow-auto px-3 py-2 text-xs font-mono bg-base-950 whitespace-pre-wrap select-text min-h-0"
                  >
                    {response !== null ? (
                      <JsonHighlight text={response} />
                    ) : (
                      <span className="text-text-muted">
                        {loading ? t('dev.api.waiting') : t('dev.api.pressSend')}
                      </span>
                    )}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
      {inputContextMenu}
    </div>
  );
}
