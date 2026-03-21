import { useState } from 'react';
import { VscCheck, VscCopy, VscPlay } from 'react-icons/vsc';
import { routeConfig, RouteDefinition } from '../../../main/shared/config/API.config';
import { useApp } from '../../store/AppStore';
import { Button } from '../common/Button';
import { REST_API_CONFIG } from '../../../main/shared/config/RestApi.config';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-accent border-accent/30 bg-accent/10',
  POST: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  PUT: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  DELETE: 'text-red-400 border-red-400/30 bg-red-400/10',
};

const routes = Object.values(routeConfig);

export function DevApiExplorer() {
  const { state } = useApp();

  const [selected, setSelected] = useState<RouteDefinition | null>(null);
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const port = state.settings?.restApiPort ?? 4444;
  const restEnabled = state.settings?.restApiEnabled ?? false;

  const handleSelect = (route: RouteDefinition) => {
    setSelected(route);
    setResponse(null);
    setBody(route.bodyTemplate ?? '');

    const params: Record<string, string> = {};
    const matches = route.path.matchAll(/:([a-zA-Z]+)/g);
    for (const m of matches) params[m[1]] = '';
    setPathParams(params);
  };

  const buildUrl = () => {
    if (!selected) return '';
    let path = selected.path;
    for (const [k, v] of Object.entries(pathParams)) {
      path = path.replace(`:${k}`, v || `:${k}`);
    }
    return `http://${REST_API_CONFIG.host}:${port}${path}`;
  };

  const handleCall = async () => {
    if (!selected) return;
    setLoading(true);
    setResponse(null);

    try {
      const url = buildUrl();
      const opts: RequestInit = { method: selected.method };

      if (body.trim() && ['POST', 'PUT', 'PATCH'].includes(selected.method)) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = body;
      }

      const res = await fetch(url, opts);
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full overflow-hidden">
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-xs font-mono text-text-muted">
            Select a route to inspect and call it
          </div>
        ) : (
          <>
            {/* URL bar */}
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

                <code className="flex-1 text-xs font-mono text-text-primary bg-base-950 border border-surface-border rounded px-2.5 py-1.5 truncate">
                  {buildUrl()}
                </code>

                <button
                  onClick={copyUrl}
                  className="text-text-muted hover:text-accent transition-colors p-1"
                  title="Copy URL"
                >
                  {copied ? <VscCheck size={13} className="text-accent" /> : <VscCopy size={13} />}
                </button>

                <Button variant="primary" size="sm" onClick={handleCall} loading={loading}>
                  <VscPlay size={11} />
                  Send
                </Button>
              </div>

              {/* Path params */}
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

            <div className="flex flex-1 overflow-hidden">
              {/* Body */}
              {['POST', 'PUT', 'PATCH'].includes(selected.method) && (
                <div className="w-1/2 border-r border-surface-border flex flex-col">
                  <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0">
                    <span className="text-xs font-mono text-text-muted">Request Body (JSON)</span>
                  </div>

                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-base-950 text-xs font-mono text-text-primary px-3 py-2 resize-none focus:outline-none select-text"
                  />
                </div>
              )}

              {/* Response */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-1.5 border-b border-surface-border bg-base-900/50 shrink-0">
                  <span className="text-xs font-mono text-text-muted">Response</span>
                </div>

                <pre className="flex-1 overflow-auto px-3 py-2 text-xs font-mono text-text-secondary bg-base-950 whitespace-pre-wrap">
                  {response ?? (
                    <span className="text-text-muted">
                      {loading ? 'Waiting...' : 'Press Send to call the API'}
                    </span>
                  )}
                </pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
