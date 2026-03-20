import fs from 'fs'
import https from 'https'
import { dialog, shell } from 'electron'
import type { RouteMap } from '../shared/IPCController'
import { latestReleaseUrl, templateListUrl, rawTemplateUrl } from '../shared/config/GitHub.config'
import type { ProfileTemplate } from '../shared/GitHub.types'

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'java-runner-client' } }
    const req = https.get(url, options, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location)); return
      }
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error('JSON parse error')) } })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

export const GitHubIPC = {
  fetchLatestRelease: {
    type: 'invoke',
    channel: 'github:latestRelease',
    handler: async () => {
      try { return { ok: true, data: await httpsGet(latestReleaseUrl()) } }
      catch (e) { return { ok: false, error: String(e) } }
    },
  },

  fetchTemplates: {
    type: 'invoke',
    channel: 'github:templates',
    handler: async () => {
      try {
        const raw = await httpsGet(templateListUrl())
        if (!Array.isArray(raw)) return { ok: false, error: 'Templates folder not found or repo not configured' }
        const templates: Array<{ filename: string; template: ProfileTemplate }> = []
        for (const f of (raw as Array<{ name: string }>).filter(f => f.name.endsWith('.json'))) {
          try { templates.push({ filename: f.name, template: await httpsGet(rawTemplateUrl(f.name)) as ProfileTemplate }) }
          catch { /* skip malformed */ }
        }
        return { ok: true, data: templates }
      } catch (e) { return { ok: false, error: String(e) } }
    },
  },

  downloadAsset: {
    type: 'invoke',
    channel: 'github:downloadAsset',
    handler: async (_e: any, url: string, filename: string) => {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'Installer', extensions: ['exe', 'dmg', 'AppImage', 'deb', '*'] }],
      })
      if (canceled || !filePath) return { ok: false }

      return new Promise<{ ok: boolean; error?: string }>(resolve => {
        const file = fs.createWriteStream(filePath)
        const options = { headers: { 'User-Agent': 'java-runner-client' } }
        https.get(url, options, res => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
            https.get(res.headers.location, options, r => r.pipe(file))
          else res.pipe(file)
          file.on('finish', () => { file.close(); shell.showItemInFolder(filePath); resolve({ ok: true }) })
        }).on('error', e => { fs.unlink(filePath, () => { }); resolve({ ok: false, error: e.message }) })
      })
    },
  },
} satisfies RouteMap
