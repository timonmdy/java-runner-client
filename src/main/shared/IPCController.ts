/**
 * IPC Registry — single source of truth for all IPC routes.
 *
 * Defining a route here automatically:
 *   1. Registers it on ipcMain (in main.ts via `registerIPC`)
 *   2. Exposes it on window.api (in preload.ts via `buildPreloadAPI`)
 *   3. Types window.api (via the InferAPI utility below)
 *
 * Route shapes:
 *   invoke  → renderer calls window.api.foo(...args) → Promise<T>
 *   send    → renderer calls window.api.foo(...args) → void  (fire & forget)
 *   on      → renderer calls window.api.onFoo(cb) → unsubscribe fn
 *             main pushes via webContents.send(channel, ...args)
 */

import { ipcMain, ipcRenderer, IpcMainInvokeEvent, IpcMainEvent, IpcRendererEvent } from 'electron'

// ─── Route descriptors ────────────────────────────────────────────────────────

type InvokeRoute = {
  type: 'invoke'
  channel: string
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => any
}

type SendRoute = {
  type: 'send'
  channel: string
  handler: (event: IpcMainEvent, ...args: any[]) => void
}

/** No handler — main pushes via webContents.send(channel, ...) */
type OnRoute = {
  type: 'on'
  channel: string
  /** Cast a function signature here to type the callback args on window.api.onFoo.
   *  e.g. `args: {} as (profileId: string, line: ConsoleLine) => void`
   *  Never called at runtime — purely a compile-time phantom. */
  args?: (...args: any[]) => void
}

type Route = InvokeRoute | SendRoute | OnRoute

export type RouteMap = Record<string, Route>

// ─── Type inference: RouteMap → window.api shape ──────────────────────────────

type InvokeAPI<R extends InvokeRoute> = R['handler'] extends (
  _e: any,
  ...args: infer A
) => infer Ret
  ? (...args: A) => Promise<Awaited<Ret>>
  : never

type SendAPI<R extends SendRoute> = R['handler'] extends (_e: any, ...args: infer A) => any
  ? (...args: A) => void
  : never

type OnAPI<K extends string, R extends OnRoute> = R extends { args: (...args: infer A) => void }
  ? { [key in `on${Capitalize<K>}`]: (cb: (...args: A) => void) => () => void }
  : { [key in `on${Capitalize<K>}`]: (cb: (...args: any[]) => void) => () => void }

/** Derives the full window.api type from a RouteMap. */
export type InferAPI<M extends RouteMap> = {
  [K in keyof M as M[K]['type'] extends 'on' ? never : K]: M[K] extends InvokeRoute
    ? InvokeAPI<M[K]>
    : M[K] extends SendRoute
      ? SendAPI<M[K]>
      : never
} & {
  [K in keyof M as M[K]['type'] extends 'on'
    ? `on${Capitalize<string & K>}`
    : never]: M[K] extends OnRoute
    ? M[K] extends { args: (...args: infer A) => void }
      ? (cb: (...args: A) => void) => () => void
      : (cb: (...args: any[]) => void) => () => void
    : never
}

// ─── Main-process: register all routes onto ipcMain ──────────────────────────

export function registerIPC(routes: RouteMap[]): void {
  for (const map of routes) {
    for (const route of Object.values(map)) {
      if (route.type === 'invoke') ipcMain.handle(route.channel, route.handler)
      if (route.type === 'send') ipcMain.on(route.channel, route.handler)
      // 'on' routes are push-only from main — no listener to register
    }
  }
}

// ─── Preload: build the window.api object ────────────────────────────────────

export function buildPreloadAPI(routes: RouteMap[]): Record<string, unknown> {
  const api: Record<string, unknown> = {}

  for (const map of routes) {
    for (const [key, route] of Object.entries(map)) {
      if (route.type === 'invoke') {
        api[key] = (...args: unknown[]) => ipcRenderer.invoke(route.channel, ...args)
      }
      if (route.type === 'send') {
        api[key] = (...args: unknown[]) => ipcRenderer.send(route.channel, ...args)
      }
      if (route.type === 'on') {
        const cbKey = `on${key[0].toUpperCase()}${key.slice(1)}`
        api[cbKey] = (cb: (...args: unknown[]) => void) => {
          const handler = (_e: IpcRendererEvent, ...args: unknown[]) => cb(...args)
          ipcRenderer.on(route.channel, handler)
          return () => ipcRenderer.off(route.channel, handler)
        }
      }
    }
  }

  return api
}
