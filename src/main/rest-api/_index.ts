// routes/index.ts

import { RouteKey } from '../shared/config/API.config';
import { RouteMap, BuiltRoute } from '../shared/types/RestAPI.types';

import { BaseRoutes } from './Base.routes';
import { ProfileRoutes } from './Profile.routes';
import { ProcessRoutes } from './Process.routes';

const merged: RouteMap = {
  ...BaseRoutes,
  ...ProfileRoutes,
  ...ProcessRoutes,
};

export const routes: { [K in RouteKey]: BuiltRoute<K> } = merged as any;

const missing = Object.keys(merged).length !== Object.keys(merged).length;
if (missing) {
  throw new Error('Some routes are missing handlers');
}