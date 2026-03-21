import { routeConfig, type RouteKey } from './shared/config/API.config'
import { ok, err } from './RestAPI'
import { getAllProfiles, saveProfile, deleteProfile, getSettings, saveSettings } from './Store'
import { processManager } from './ProcessManager'
import { v4 as uuidv4 } from 'uuid'
import type http from 'http'
import { Profile } from './shared/types/Profile.types'
import { AppSettings } from './shared/types/App.types'

// ─── Context ──────────────────────────────────────────────────────────────────

type Params = Record<string, string>

export interface Context {
  req: http.IncomingMessage
  res: http.ServerResponse
  params: Params
  body: unknown
}

type RouteHandler = (ctx: Context) => void | Promise<void>

// ─── Typed route builder ──────────────────────────────────────────────────────

type BuiltRoute<K extends RouteKey> = (typeof routeConfig)[K] & {
  handler: RouteHandler
}

function defineRoute<K extends RouteKey>(key: K, handler: RouteHandler): BuiltRoute<K> {
  return {
    ...routeConfig[key],
    handler,
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const routes = [
  defineRoute('status', ({ res }) =>
    ok(res, {
      ok: true,
      version: process.env.npm_package_version ?? 'unknown',
      profiles: getAllProfiles().length,
      running: processManager.getStates().filter((s) => s.running).length,
    })
  ),

  defineRoute('profiles_list', ({ res }) => ok(res, getAllProfiles())),

  defineRoute('profiles_get', ({ res, params }) => {
    const p = getAllProfiles().find((p) => p.id === params.id)
    console.log(p, params, getAllProfiles())
    p ? ok(res, p) : err(res, 'Profile not found', 404)
  }),

  defineRoute('profiles_create', ({ res, body }) => {
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
  }),

  defineRoute('profiles_update', ({ res, params, body }) => {
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
  }),

  defineRoute('profiles_delete', ({ res, params }) => {
    if (!getAllProfiles().find((p) => p.id === params.id)) return err(res, 'Profile not found', 404)

    deleteProfile(params.id)
    ok(res)
  }),

  defineRoute('processes_list', ({ res }) => ok(res, processManager.getStates())),

  defineRoute('processes_log', ({ res }) => ok(res, processManager.getActivityLog())),

  defineRoute('processes_start', ({ res, params }) => {
    const p = getAllProfiles().find((p) => p.id === params.id)
    if (!p) return err(res, 'Profile not found', 404)
    ok(res, processManager.start(p))
  }),

  defineRoute('processes_stop', ({ res, params }) => ok(res, processManager.stop(params.id))),

  defineRoute('processes_clear', ({ res, params }) => {
    processManager.clearConsoleForProfile(params.id)
    ok(res)
  }),

  defineRoute('settings_get', ({ res }) => ok(res, getSettings())),

  defineRoute('settings_update', ({ res, body }) => {
    const updated: AppSettings = {
      ...getSettings(),
      ...(body as Partial<AppSettings>),
    }

    saveSettings(updated)
    ok(res, updated)
  }),
]
