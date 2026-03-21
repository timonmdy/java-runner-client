import type { AppSettings } from '../types/App.types';
import { REST_API_CONFIG } from './RestApi.config';

export const DEFAULT_SETTINGS: AppSettings = {
  launchOnStartup: false,
  startMinimized: false,
  minimizeToTray: true,
  consoleFontSize: 13,
  consoleMaxLines: 5000,
  consoleWordWrap: false,
  consoleLineNumbers: false,
  consoleHistorySize: 200,
  theme: 'dark',
  restApiEnabled: false,
  restApiPort: REST_API_CONFIG.defaultPort,
  devModeEnabled: false,
};
