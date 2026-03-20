import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, AppSettings } from './shared/types'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './store'
import { processManager } from './processManager'
import { REST_API_CONFIG } from './shared/config/RestApi.config'

type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>,
  body: unknown
) => void

interface Route {
  method: string
  pattern: RegExp
  keys: string[]
  handler: Handler
}

function parsePattern(path: string): { pattern: RegExp; keys: string[] } {
  const keys: string[] = []
  const src = path.replace(/:([a-zA-Z]+)/g, (_m, k) => {
    keys.push(k)
    return '([^/]+)'
  })
  return { pattern: new RegExp(`^${src}$`), keys }
}

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
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

class RestApiServer {
  private server: http.Server | null = null
  private routes: Route[] = []

  private route(method: string, path: string, handler: Handler) {
    const { pattern, keys } = parsePattern(path)
    this.routes.push({ method, pattern, keys, handler })
  }

  private setup() {
    // GET /api/status
    this.route('GET', '/api/status', (_req, res) => {
      json(res, {
        ok: true,
        version: process.env.npm_package_version ?? 'unknown',
        profiles: getAllProfiles().length,
        running: processManager.getStates().filter((s) => s.running).length,
      })
    })

    // GET /api/profiles
    this.route('GET', '/api/profiles', (_req, res) => json(res, getAllProfiles()))

    // GET /api/profiles/:id
    this.route('GET', '/api/profiles/:id', (_req, res, { id }) => {
      const p = getAllProfiles().find((p) => p.id === id)
      p ? json(res, p) : err(res, 'Profile not found', 404)
    })

    // POST /api/profiles
    this.route('POST', '/api/profiles', async (_req, res) => {
      const body = (await readBody(_req)) as Partial<Profile>
      const p: Profile = {
        id: uuidv4(),
        name: body.name ?? 'New Profile',
        jarPath: body.jarPath ?? '',
        workingDir: body.workingDir ?? '',
        jvmArgs: body.jvmArgs ?? [],
        systemProperties: body.systemProperties ?? [],
        programArgs: body.programArgs ?? [],
        javaPath: body.javaPath ?? '',
        autoStart: body.autoStart ?? false,
        autoRestart: body.autoRestart ?? false,
        autoRestartInterval: body.autoRestartInterval ?? 10,
        color: body.color ?? '#4ade80',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      saveProfile(p)
      json(res, p, 201)
    })

    // PUT /api/profiles/:id
    this.route('PUT', '/api/profiles/:id', async (_req, res, { id }) => {
      const profiles = getAllProfiles()
      const existing = profiles.find((p) => p.id === id)
      if (!existing) return err(res, 'Profile not found', 404)
      const body = (await readBody(_req)) as Partial<Profile>
      const updated: Profile = { ...existing, ...body, id, updatedAt: Date.now() }
      saveProfile(updated)
      processManager.updateProfileSnapshot(updated)
      json(res, updated)
    })

    // DELETE /api/profiles/:id
    this.route('DELETE', '/api/profiles/:id', (_req, res, { id }) => {
      const existing = getAllProfiles().find((p) => p.id === id)
      if (!existing) return err(res, 'Profile not found', 404)
      deleteProfile(id)
      json(res, { ok: true })
    })

    // GET /api/processes
    this.route('GET', '/api/processes', (_req, res) => json(res, processManager.getStates()))

    // GET /api/processes/log
    this.route('GET', '/api/processes/log', (_req, res) =>
      json(res, processManager.getActivityLog())
    )

    // POST /api/processes/:id/start
    this.route('POST', '/api/processes/:id/start', (_req, res, { id }) => {
      const p = getAllProfiles().find((p) => p.id === id)
      if (!p) return err(res, 'Profile not found', 404)
      json(res, processManager.start(p))
    })

    // POST /api/processes/:id/stop
    this.route('POST', '/api/processes/:id/stop', (_req, res, { id }) => {
      json(res, processManager.stop(id))
    })

    // POST /api/processes/:id/console/clear
    this.route('POST', '/api/processes/:id/console/clear', (_req, res, { id }) => {
      processManager.clearConsoleForProfile(id)
      json(res, { ok: true })
    })

    // GET /api/settings
    this.route('GET', '/api/settings', (_req, res) => json(res, getSettings()))

    // PUT /api/settings
    this.route('PUT', '/api/settings', async (_req, res) => {
      const current = getSettings()
      const body = (await readBody(_req)) as Partial<AppSettings>
      const updated: AppSettings = { ...current, ...body }
      saveSettings(updated)
      json(res, updated)
    })
  }

  start(port: number): void {
    if (this.server) return
    this.routes = []
    this.setup()

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

      for (const route of this.routes) {
        if (route.method !== method) continue
        const match = url.match(route.pattern)
        if (!match) continue
        const params: Record<string, string> = {}
        route.keys.forEach((k, i) => {
          params[k] = match[i + 1]
        })
        const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : {}
        route.handler(req, res, params, body)
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
