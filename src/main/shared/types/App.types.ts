export interface JRCEnvironment {
  isReady: boolean;
  devMode: boolean;
  type: 'dev' | 'prod';
  launchContext: 'userRequest' | 'withSystem' | 'development';
}
