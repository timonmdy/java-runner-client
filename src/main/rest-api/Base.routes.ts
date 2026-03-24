import { ok } from '../RestAPI';
import { processManager } from '../ProcessManager';
import { defineRoute, RouteMap } from '../shared/types/RestAPI.types';
import { getAllProfiles, getSettings, saveSettings } from '../Store';
import { AppSettings } from '../shared/types/App.types';
import { version } from '../../../package.json';

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
