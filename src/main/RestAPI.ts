import http from 'http';
import { routes } from './RestAPI.routes';
import { routeConfig } from './shared/config/API.config';
import { getSettings } from './Store';
import { REST_API_CONFIG } from './shared/config/RestApi.config';

type Params = Record<string, string>;

// ─── Types ────────────────────────────────────────────────────────────────────

type CompiledRoute = {
  method: string;
  path: string;
  pattern: RegExp;
  keys: string[];
  handler: (ctx: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    params: Params;
    body: unknown;
  }) => void | Promise<void>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

export function ok(res: http.ServerResponse, data: unknown = { ok: true }, status = 200) {
  json(res, data, status);
}

export function err(res: http.ServerResponse, msg: string, status = 400) {
  json(res, { error: msg }, status);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function parsePattern(path: string) {
  const keys: string[] = [];
  const src = path.replace(/:([a-zA-Z]+)/g, (_m, k) => {
    keys.push(k);
    return '([^/]+)';
  });
  return { pattern: new RegExp(`^${src}$`), keys };
}

function compileRoutes(): CompiledRoute[] {
  return routes.map((r) => ({
    ...r,
    ...parsePattern(r.path),
  }));
}

// ─── Server ───────────────────────────────────────────────────────────────────

class RestApiServer {
  private server: http.Server | null = null;
  private compiled = compileRoutes();

  start(port: number): void {
    if (this.server) return;

    this.server = http.createServer(async (req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        return res.end();
      }

      const url = req.url?.split('?')[0] ?? '/';
      const method = req.method ?? 'GET';
      const body =
        method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readBody(req) : {};

      for (const route of this.compiled) {
        if (route.method !== method) continue;

        const match = url.match(route.pattern);
        if (!match) continue;

        const params: Params = {};
        route.keys.forEach((k, i) => {
          params[k] = match[i + 1];
        });

        await route.handler({ req, res, params, body });
        return;
      }

      err(res, 'Not found', 404);
    });

    this.server.listen(port, REST_API_CONFIG.host, () => {
      console.log(`[JRC REST] Listening on ${REST_API_CONFIG.host}:${port}`);
    });
  }

  stop(): void {
    this.server?.close();
    this.server = null;
  }
}

export const restApiServer = new RestApiServer();
