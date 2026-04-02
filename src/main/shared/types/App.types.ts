export interface JRCEnvironment {
  isReady: boolean;
  devMode: boolean;
  type: 'dev' | 'prod';
  startUpSource: 'userRequest' | 'withSystem' | 'development';
}
