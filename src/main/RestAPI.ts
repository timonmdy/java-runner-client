import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, AppSettings } from './shared/types'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './Store'
import { processManager } from './ProcessManager'
import { REST_API_CONFIG } from './shared/config/RestApi.config'

// ─── Primitives ───────────────────────────────────────────────────────────────

type Params = Record<string, string>

interface Context {
  req: http.IncomingMessage
  res: http.ServerResponse
  params: Params
  body: unknown
}

type RouteHandler = (ctx: Context) => void | Promise<void>

interface RestRoute {
  method: string
  path: string
  handler: RouteHandler
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function ok(res: http.ServerResponse, data: unknown = { ok: true }, status = 200) {
  json(res, data, status)
}

function err(res: http.ServerResponse, msg: string, status = 400) {
  json(res, { error: msg }, status)
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => {
      raw += c
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
  })
}

function parsePattern(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = []
  const src = path.replace(/:([a-zA-Z]+)/g, (_m, k) => {
    keys.push(k)
    return '([^/]+)'
  })
  return { pattern: new RegExp(`^${src}$`), keys }
}

// ─── Route definitions ────────────────────────────────────────────────────────
//
// Add a new endpoint here — nothing else to touch.
//
// ctx.params → path params  (e.g. :id)
// ctx.body   → parsed JSON body (POST/PUT/PATCH only, otherwise {})
// Use ok() / err() / json() to respond.

const routes: RestRoute[] = [
  // ── Status ─────────────────────────────────────────────────────────────────

  {
    method: 'GET',
    path: '/api/status',
    handler: ({ res }) =>
      ok(res, {
        ok: true,
        version: process.env.npm_package_version ?? 'unknown',
        profiles: getAllProfiles().length,
        running: processManager.getStates().filter((s) => s.running).length,
      }),
  },

  // ── Profiles ───────────────────────────────────────────────────────────────

  {
    method: 'GET',
    path: '/api/profiles',
    handler: ({ res }) => ok(res, getAllProfiles()),
  },
  {
    method: 'GET',
    path: '/api/profiles/:id',
    handler: ({ res, params }) => {
      const p = getAllProfiles().find((p) => p.id === params.id)
      p ? ok(res, p) : err(res, 'Profile not found', 404)
    },
  },
  {
    method: 'POST',
    path: '/api/profiles',
    handler: ({ res, body }) => {
      const b = body as Partial<Profile>
      const p: Profile = {
        id: uuidv4(),
        name: b.name ?? 'New Profile',
        jarPath: b.jarPath ?? '',
        workingDir: b.workingDir ?? '',
        jvmArgs: b.jvmArgs ?? [],
        systemProperties: b.systemProperties ?? [],
        programArgs: b.programArgs ?? [],
        javaPath: b.javaPath ?? '',
        autoStart: b.autoStart ?? false,
        autoRestart: b.autoRestart ?? false,
        autoRestartInterval: b.autoRestartInterval ?? 10,
        color: b.color ?? '#4ade80',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      saveProfile(p)
      ok(res, p, 201)
    },
  },
  {
    method: 'PUT',
    path: '/api/profiles/:id',
    handler: ({ res, params, body }) => {
      const existing = getAllProfiles().find((p) => p.id === params.id)
      if (!existing) return err(res, 'Profile not found', 404)
      const updated: Profile = {
        ...existing,
        ...(body as Partial<Profile>),
        id: params.id,
        updatedAt: Date.now(),
      }
      saveProfile(updated)
      processManager.updateProfileSnapshot(updated)
      ok(res, updated)
    },
  },
  {
    method: 'DELETE',
    path: '/api/profiles/:id',
    handler: ({ res, params }) => {
      if (!getAllProfiles().find((p) => p.id === params.id))
        return err(res, 'Profile not found', 404)
      deleteProfile(params.id)
      ok(res)
    },
  },

  // ── Processes ──────────────────────────────────────────────────────────────

  {
    method: 'GET',
    path: '/api/processes',
    handler: ({ res }) => ok(res, processManager.getStates()),
  },
  {
    method: 'GET',
    path: '/api/processes/log',
    handler: ({ res }) => ok(res, processManager.getActivityLog()),
  },
  {
    method: 'POST',
    path: '/api/processes/:id/start',
    handler: ({ res, params }) => {
      const p = getAllProfiles().find((p) => p.id === params.id)
      if (!p) return err(res, 'Profile not found', 404)
      ok(res, processManager.start(p))
    },
  },
  {
    method: 'POST',
    path: '/api/processes/:id/stop',
    handler: ({ res, params }) => ok(res, processManager.stop(params.id)),
  },
  {
    method: 'POST',
    path: '/api/processes/:id/console/clear',
    handler: ({ res, params }) => {
      processManager.clearConsoleForProfile(params.id)
      ok(res)
    },
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  {
    method: 'GET',
    path: '/api/settings',
    handler: ({ res }) => ok(res, getSettings()),
  },
  {
    method: 'PUT',
    path: '/api/settings',
    handler: ({ res, body }) => {
      const updated: AppSettings = { ...getSettings(), ...(body as Partial<AppSettings>) }
      saveSettings(updated)
      ok(res, updated)
    },
  },
]

const compiled = routes.map((r) => ({ ...r, ...parsePattern(r.path) }))

class RestApiServer {
  private server: http.Server | null = null

  start(port: number): void {
    if (this.server) return

    this.server = http.createServer(async (req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        })
        return res.end()
      }

      const url = req.url?.split('?')[0] ?? '/'
      const method = req.method ?? 'GET'
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : {}

      for (const route of compiled) {
        if (route.method !== method) continue
        const match = url.match(route.pattern)
        if (!match) continue
        const params: Params = {}
        route.keys.forEach((k, i) => {
          params[k] = match[i + 1]
        })
        await route.handler({ req, res, params, body })
        return
      }

      err(res, 'Not found', 404)
    })

    this.server.listen(port, REST_API_CONFIG.host, () => {
      console.log(`[JRC REST] Listening on ${REST_API_CONFIG.host}:${port}`)
    })
  }

  stop(): void {
    this.server?.close()
    this.server = null
  }
}

export const restApiServer = new RestApiServer()
