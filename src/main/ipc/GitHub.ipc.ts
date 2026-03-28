import { dialog, shell } from 'electron';
import fs from 'fs';
import https from 'https';
import type { RouteMap } from '../core/IPCController';
import { latestReleaseUrl, rawTemplateUrl, templateListUrl } from '../shared/config/GitHub.config';
import type { GitHubRelease, ProfileTemplate } from '../shared/types/GitHub.types';

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = { headers: { 'User-Agent': 'java-runner-client' } };
    const req = https.get(url, options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location));
        return;
      }
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('JSON parse error'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

interface ActiveDownload {
  req: ReturnType<typeof https.get>;
  res: import('http').IncomingMessage;
  fileStream: fs.WriteStream;
  filePath: string;
  bytesWritten: number;
  totalBytes: number;
  paused: boolean;
}

const activeDownloads = new Map<string, ActiveDownload>();

export const GitHubIPC = {
  fetchLatestRelease: {
    type: 'invoke',
    channel: 'github:latestRelease',
    handler: async () => {
      try {
        return { ok: true, data: (await httpsGet(latestReleaseUrl())) as GitHubRelease };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
  },

  fetchTemplates: {
    type: 'invoke',
    channel: 'github:templates',
    handler: async () => {
      try {
        const raw = await httpsGet(templateListUrl());
        if (!Array.isArray(raw))
          return { ok: false, error: 'Templates folder not found or repo not configured' };
        const templates: Array<{ filename: string; template: ProfileTemplate }> = [];
        for (const f of (raw as Array<{ name: string }>).filter((f) => f.name.endsWith('.json'))) {
          try {
            templates.push({
              filename: f.name,
              template: (await httpsGet(rawTemplateUrl(f.name))) as ProfileTemplate,
            });
          } catch {
            /* skip malformed */
          }
        }
        return { ok: true, data: templates };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    },
  },

  downloadAsset: {
    type: 'invoke',
    channel: 'github:downloadAsset',
    handler: async (e: Electron.IpcMainInvokeEvent, url: string, filename: string) => {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'Installer', extensions: ['exe', 'dmg', 'AppImage', 'deb', '*'] }],
      });
      if (canceled || !filePath) return { ok: false };

      const { sender } = e;
      const sendProgress = (
        dl: Pick<ActiveDownload, 'bytesWritten' | 'totalBytes'>,
        status: 'downloading' | 'paused' | 'done' | 'error' | 'cancelled',
        error?: string
      ) => {
        if (sender.isDestroyed()) return;
        const { bytesWritten, totalBytes } = dl;
        sender.send('github:downloadProgress', {
          filename,
          bytesWritten,
          totalBytes,
          percent: totalBytes > 0 ? Math.round((bytesWritten / totalBytes) * 100) : 0,
          status,
          error,
        });
      };

      return new Promise<{ ok: boolean; error?: string }>((resolve) => {
        const doRequest = (requestUrl: string) => {
          const options = { headers: { 'User-Agent': 'java-runner-client' } };
          const req = https.get(requestUrl, options, (res) => {
            // Follow redirect
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              doRequest(res.headers.location);
              return;
            }

            const totalBytes = parseInt(res.headers['content-length'] ?? '0', 10);
            const file = fs.createWriteStream(filePath);

            const dl: ActiveDownload = {
              req,
              res,
              fileStream: file,
              filePath,
              bytesWritten: 0,
              totalBytes,
              paused: false,
            };
            activeDownloads.set(filename, dl);

            sendProgress(dl, 'downloading');

            res.on('data', (chunk: Buffer) => {
              dl.bytesWritten += chunk.length;
              file.write(chunk);
              sendProgress(dl, dl.paused ? 'paused' : 'downloading');
            });

            res.on('end', () => {
              file.end();
            });

            file.on('finish', () => {
              file.close();
              activeDownloads.delete(filename);
              sendProgress({ bytesWritten: dl.totalBytes, totalBytes: dl.totalBytes }, 'done');
              shell.showItemInFolder(filePath);
              resolve({ ok: true });
            });

            req.on('error', (err) => {
              activeDownloads.delete(filename);
              fs.unlink(filePath, () => {});
              sendProgress(dl, 'error', err.message);
              resolve({ ok: false, error: err.message });
            });

            file.on('error', (err) => {
              activeDownloads.delete(filename);
              fs.unlink(filePath, () => {});
              sendProgress(dl, 'error', err.message);
              resolve({ ok: false, error: err.message });
            });
          });
        };

        doRequest(url);
      });
    },
  },

  pauseDownload: {
    type: 'invoke',
    channel: 'github:pauseDownload',
    handler: async (e: Electron.IpcMainInvokeEvent, filename: string) => {
      const dl = activeDownloads.get(filename);
      if (!dl) return { ok: false, error: 'No active download' };
      dl.res.pause();
      dl.paused = true;
      if (!e.sender.isDestroyed()) {
        e.sender.send('github:downloadProgress', {
          filename,
          bytesWritten: dl.bytesWritten,
          totalBytes: dl.totalBytes,
          percent: dl.totalBytes > 0 ? Math.round((dl.bytesWritten / dl.totalBytes) * 100) : 0,
          status: 'paused',
        });
      }
      return { ok: true };
    },
  },

  resumeDownload: {
    type: 'invoke',
    channel: 'github:resumeDownload',
    handler: async (e: Electron.IpcMainInvokeEvent, filename: string) => {
      const dl = activeDownloads.get(filename);
      if (!dl) return { ok: false, error: 'No active download' };
      dl.res.resume();
      dl.paused = false;
      if (!e.sender.isDestroyed()) {
        e.sender.send('github:downloadProgress', {
          filename,
          bytesWritten: dl.bytesWritten,
          totalBytes: dl.totalBytes,
          percent: dl.totalBytes > 0 ? Math.round((dl.bytesWritten / dl.totalBytes) * 100) : 0,
          status: 'downloading',
        });
      }
      return { ok: true };
    },
  },

  cancelDownload: {
    type: 'invoke',
    channel: 'github:cancelDownload',
    handler: async (e: Electron.IpcMainInvokeEvent, filename: string) => {
      const dl = activeDownloads.get(filename);
      if (!dl) return { ok: false, error: 'No active download' };
      dl.res.destroy();
      dl.fileStream.close();
      fs.unlink(dl.filePath, () => {});
      activeDownloads.delete(filename);
      if (!e.sender.isDestroyed()) {
        e.sender.send('github:downloadProgress', {
          filename,
          bytesWritten: dl.bytesWritten,
          totalBytes: dl.totalBytes,
          percent: dl.totalBytes > 0 ? Math.round((dl.bytesWritten / dl.totalBytes) * 100) : 0,
          status: 'cancelled',
        });
      }
      return { ok: true };
    },
  },

  downloadProgress: {
    type: 'on',
    channel: 'github:downloadProgress',
    args: {} as (progress: {
      filename: string;
      bytesWritten: number;
      totalBytes: number;
      percent: number;
      status: 'downloading' | 'paused' | 'done' | 'error' | 'cancelled';
      error?: string;
    }) => void,
  },
} satisfies RouteMap;
