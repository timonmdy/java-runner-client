import React, { useState, useCallback } from 'react';
import { VscCheck, VscCopy, VscPlay, VscEdit, VscCode } from 'react-icons/vsc';
import { routeConfig, REST_API_CONFIG } from '../../../main/shared/config/API.config';
import { useApp } from '../../AppProvider';
import { Button } from '../common/Button';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { RouteDefinition } from '../../..//main/shared/types/RestAPI.types';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-accent border-accent/30 bg-accent/10',
  POST: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  PUT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  DELETE: 'text-red-400 border-red-400/30 bg-red-400/10',
};

// ─── JSON syntax highlighter ─────────────────────────────────────────────────

type Token = {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punct' | 'plain';
  value: string;
};

function tokenizeJson(text: string): Token[] {
  const tokens: Token[] = [];
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

const TOKEN_CLASS: Record<Token['type'], string> = {
  key: 'text-blue-300',
  string: 'text-emerald-400',
  number: 'text-amber-400',
  boolean: 'text-purple-400',
  null: 'text-red-400/80',
  punct: 'text-text-muted',
  plain: 'text-text-secondary',
};

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
        <span key={i} className={TOKEN_CLASS[tok.type]}>
          {tok.value}
        </span>
      ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DevApiExplorer() {
  const { state } = useApp();
  const [selected, setSelected] = useState<RouteDefinition | null>(null);
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [responseCopied, setResponseCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(
    null
  );

  const port = state.settings?.restApiPort ?? 4444;
  const restEnabled = state.settings?.restApiEnabled ?? false;

  const handleSelect = (route: RouteDefinition) => {
    setSelected(route);
    setResponse(null);
    setIsEditing(false);
    setBody(route.bodyTemplate ?? '');
    const params: Record<string, string> = {};
    for (const m of route.path.matchAll(/:([a-zA-Z]+)/g)) params[m[1]] = '';
    setPathParams(params);
  };

  const buildUrl = () => {
    if (!selected) return '';
    let path = selected.path;
    for (const [k, v] of Object.entries(pathParams)) path = path.replace(`:${k}`, v || `:${k}`);
    return `http://${REST_API_CONFIG.host}:${port}${path}`;
  };

  const handleCall = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse(null);
    setIsEditing(false);
    try {
      const opts: RequestInit = { method: selected.method };
      if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(selected.method)) {
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

  const handleContextMenu = useCallback((e: React.MouseEvent, extra: ContextMenuItem[] = []) => {
    const sel = window.getSelection()?.toString() ?? '';
    e.preventDefault();
    setCtxMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: 'Copy',
          icon: <VscCopy size={12} />,
          disabled: !sel,
          onClick: () => navigator.clipboard.writeText(sel),
        },
        ...extra,
      ],
    });
  }, []);

  const responseCtxItems = useCallback(
    (): ContextMenuItem[] =>
      response
        ? [
            { type: 'separator' },
            {
              label: 'Copy all',
              icon: <VscCopy size={12} />,
              onClick: () => navigator.clipboard.writeText(response),
            },
          ]
        : [],
    [response]
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Route list */}
      <div className="w-56 shrink-0 border-r border-surface-border overflow-y-auto py-2 bg-base-900/50">
        {!restEnabled && (
          <div className="mx-2 mb-2 px-2 py-1.5 rounded-md bg-yellow-400/10 border border-yellow-400/20 text-xs font-mono text-yellow-400">
            REST API disabled in Settings
          </div>
        )}
        {Object.entries(routeConfig).map(([key, route]) => (
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
            <p className="text-xs font-mono text-text-secondary mt-0.5 truncate">{route.path}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{route.description}</p>
          </button>
        ))}
      </div>

      {/* Request + response */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-xs font-mono text-text-muted">
            Select a route to inspect and call it
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-surface-border bg-base-900 shrink-0 space-y-2">
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
                  className="text-text-muted hover:text-accent transition-colors p-1"
                  title="Copy URL"
                >
                  {urlCopied ? (
                    <VscCheck size={13} className="text-accent" />
                  ) : (
                    <VscCopy size={13} />
                  )}
                </button>
                <Button variant="primary" size="sm" onClick={handleCall} loading={loading}>
                  <VscPlay size={11} />
                  Send
                </Button>
              </div>
              {Object.keys(pathParams).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(pathParams).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1">
                      <span className="text-xs font-mono text-text-muted">:{k}</span>
                      <input
                        value={v}
                        onChange={(e) => setPathParams((p) => ({ ...p, [k]: e.target.value }))}
                        placeholder="value"
                        className="w-32 bg-base-950 border border-surface-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-accent/40"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              {['POST', 'PUT', 'PATCH'].includes(selected.method) && (
                <div className="w-1/2 border-r border-surface-border flex flex-col min-h-0">
                  <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0">
                    <span className="text-xs font-mono text-text-muted">Request Body (JSON)</span>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-base-950 text-xs font-mono text-text-primary px-3 py-2 resize-none focus:outline-none select-text min-h-0"
                  />
                </div>
              )}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0 flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">Response</span>
                  {response && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => setIsEditing((v) => !v)}
                        className={[
                          'p-1 rounded transition-colors',
                          isEditing ? 'text-accent' : 'text-text-muted hover:text-accent',
                        ].join(' ')}
                      >
                        {isEditing ? <VscCode size={13} /> : <VscEdit size={13} />}
                      </button>
                      <button
                        onClick={copyResponse}
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
                {isEditing ? (
                  <textarea
                    value={response ?? ''}
                    onChange={(e) => setResponse(e.target.value)}
                    onContextMenu={(e) => handleContextMenu(e, responseCtxItems())}
                    spellCheck={false}
                    className="flex-1 overflow-auto px-3 py-2 text-xs font-mono text-text-secondary bg-base-950 resize-none focus:outline-none select-text min-h-0"
                  />
                ) : (
                  <pre
                    onContextMenu={(e) => handleContextMenu(e, responseCtxItems())}
                    className="flex-1 overflow-auto px-3 py-2 text-xs font-mono bg-base-950 whitespace-pre-wrap select-text min-h-0"
                  >
                    {response != null ? (
                      <JsonHighlight text={response} />
                    ) : (
                      <span className="text-text-muted">
                        {loading ? 'Waiting...' : 'Press Send to call the API'}
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
    </div>
  );
}
