import { version } from '../../../package.json';
import { ok } from '../core/RestAPI';
import { getAllProfiles, getSettings, saveSettings } from '../core/Store';
import { processManager } from '../core/process/ProcessManager';
import { AppSettings } from '../shared/config/Settings.config';
import { defineRoute, RouteMap } from '../shared/types/API.types';

export const BaseRoutes: RouteMap = {
  status: defineRoute('status', ({ res }) =>
    ok(res, {
      ok: true,
      version: version,
      profiles: getAllProfiles().length,
      running: processManager.getStates().filter((s) => s.running).length,
    })
  ),

  settings_get: defineRoute('settings_get', ({ res }) => ok(res, getSettings())),

  settings_update: defineRoute('settings_update', ({ res, body }) => {
    const updated: AppSettings = {
      ...getSettings(),
      ...(body as Partial<AppSettings>),
    };

    saveSettings(updated);
    ok(res, updated);
  }),
};
