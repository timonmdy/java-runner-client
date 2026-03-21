export const REST_API_CONFIG = {
  defaultPort: 4444,
  host: '127.0.0.1',
} as const;

export const REST_ROUTES = {
  // Info
  status: '/api/status',
  profiles: '/api/profiles',
  profile: '/api/profiles/:id',
  settings: '/api/settings',
  processStates: '/api/processes',
  processLog: '/api/processes/log',

  // Actions
  profileCreate: '/api/profiles',
  profileUpdate: '/api/profiles/:id',
  profileDelete: '/api/profiles/:id',
  processStart: '/api/processes/:id/start',
  processStop: '/api/processes/:id/stop',
  consoleClear: '/api/processes/:id/console/clear',
  settingsUpdate: '/api/settings',
} as const;
