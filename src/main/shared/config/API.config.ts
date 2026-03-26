import { RouteDefinition } from '../types/RestAPI.types';

export const REST_API_CONFIG = {
  defaultPort: 4444,
  host: '127.0.0.1',
} as const;

export const routeConfig = {
  status: {
    method: 'GET',
    path: '/api/status',
    description: 'App status + version',
  },

  profiles_list: {
    method: 'GET',
    path: '/api/profiles',
    description: 'List all profiles',
  },
  profiles_get: {
    method: 'GET',
    path: '/api/profiles/:id',
    description: 'Get profile by ID',
  },
  profiles_create: {
    method: 'POST',
    path: '/api/profiles',
    description: 'Create profile',
    bodyTemplate: '{ "name": "New Profile", "jarPath": "" }',
  },
  profiles_update: {
    method: 'PUT',
    path: '/api/profiles/:id',
    description: 'Update profile',
  },
  profiles_delete: {
    method: 'DELETE',
    path: '/api/profiles/:id',
    description: 'Delete profile',
  },

  processes_list: {
    method: 'GET',
    path: '/api/processes',
    description: 'Running process states',
  },
  processes_log: {
    method: 'GET',
    path: '/api/processes/log',
    description: 'Activity log',
  },
  processes_start: {
    method: 'POST',
    path: '/api/processes/:id/start',
    description: 'Start process',
  },
  processes_stop: {
    method: 'POST',
    path: '/api/processes/:id/stop',
    description: 'Graceful stop process',
  },
  processes_force_stop: {
    method: 'POST',
    path: '/api/processes/:id/force-stop',
    description: 'Force kill process',
  },
  processes_clear: {
    method: 'POST',
    path: '/api/processes/:id/console/clear',
    description: 'Clear console',
  },

  logs_list: {
    method: 'GET',
    path: '/api/logs/:id',
    description: 'List log files for profile',
  },
  logs_read: {
    method: 'GET',
    path: '/api/logs/:id/:filename',
    description: 'Read a log file',
  },
  logs_delete: {
    method: 'DELETE',
    path: '/api/logs/:id/:filename',
    description: 'Delete a log file',
  },

  settings_get: {
    method: 'GET',
    path: '/api/settings',
    description: 'Get settings',
  },
  settings_update: {
    method: 'PUT',
    path: '/api/settings',
    description: 'Update settings',
    bodyTemplate: '{ "consoleFontSize": 13 }',
  },
} as const satisfies Record<string, RouteDefinition>;

export type RouteKey = keyof typeof routeConfig;
