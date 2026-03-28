export interface AppSettings {
  launchOnStartup: boolean;
  startMinimized: boolean;
  minimizeToTray: boolean;
  consoleFontSize: number;
  consoleMaxLines: number;
  consoleWordWrap: boolean;
  consoleLineNumbers: boolean;
  consoleTimestamps: boolean;
  consoleHistorySize: number;
  themeId: string;
  languageId: string;
  restApiEnabled: boolean;
  restApiPort: number;
  devModeEnabled: boolean;
}

export interface JRCEnvironment {
  isReady: boolean;
  devMode: boolean;
  type: 'dev' | 'prod';
  startUpSource: 'userRequest' | 'withSystem' | 'development';
}
