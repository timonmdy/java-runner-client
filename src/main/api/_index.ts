import { RouteKey } from '../shared/config/API.config';
import { BuiltRoute, RouteMap } from '../shared/types/RestAPI.types';

import { BaseRoutes } from './Base.routes';
import { LogRoutes } from './Log.routes';
import { ProcessRoutes } from './Process.routes';
import { ProfileRoutes } from './Profile.routes';

const merged: RouteMap = {
  ...BaseRoutes,
  ...ProfileRoutes,
  ...ProcessRoutes,
  ...LogRoutes,
};

export const routes: { [K in RouteKey]: BuiltRoute<K> } = merged as any;

const missing = Object.keys(merged).length !== Object.keys(merged).length;
if (missing) {
  throw new Error('Some routes are missing handlers');
}
