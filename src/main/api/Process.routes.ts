import { processManager } from '../core/process/ProcessManager';
import { err, ok } from '../core/RestAPI';
import { getAllProfiles } from '../core/Store';
import { defineRoute, RouteMap } from '../shared/types/API.types';

export const ProcessRoutes: RouteMap = {
  processes_list: defineRoute('processes_list', ({ res }) => ok(res, processManager.getStates())),

  processes_log: defineRoute('processes_log', ({ res }) =>
    ok(res, processManager.getActivityLog())
  ),

  processes_start: defineRoute('processes_start', ({ res, params }) => {
    const p = getAllProfiles().find((p) => p.id === params.id);
    if (!p) return err(res, 'Profile not found', 404);
    ok(res, processManager.start(p));
  }),

  processes_stop: defineRoute('processes_stop', ({ res, params }) =>
    ok(res, processManager.stop(params.id))
  ),

  processes_force_stop: defineRoute('processes_force_stop', ({ res, params }) =>
    ok(res, processManager.forceStop(params.id))
  ),

  processes_clear: defineRoute('processes_clear', ({ res, params }) => {
    processManager.clearConsoleForProfile(params.id);
    ok(res);
  }),
};
