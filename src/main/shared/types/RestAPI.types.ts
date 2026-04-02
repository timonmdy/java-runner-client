import http from 'http';
import { routeConfig, RouteKey } from '../config/API.config';

export type Params = Record<string, string>;

type RouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type BodyParamType = 'string' | 'number' | 'boolean';

export type BodyParamDef = {
  type: BodyParamType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export type BodyParams = Record<string, BodyParamDef>;

export type RouteDefinition = {
  method: RouteMethod;
  path: string;
  description: string;
  bodyTemplate?: string;
  bodyParams?: BodyParams;
};

export type CompiledRoute = {
  method: RouteMethod;
  path: string;
  pattern: RegExp;
  keys: string[];
  handler: (ctx: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    params: Params;
    body: unknown;
  }) => void | Promise<void>;
};

export interface Context {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  params: Params;
  body: unknown;
}

export type RouteHandler = (ctx: Context) => void | Promise<void>;

export type BuiltRoute<K extends RouteKey> = (typeof routeConfig)[K] & {
  handler: RouteHandler;
};

export function defineRoute<K extends RouteKey>(key: K, handler: RouteHandler): BuiltRoute<K> {
  return {
    ...routeConfig[key],
    handler,
  };
}

export type RouteMap = {
  [K in RouteKey]?: BuiltRoute<K>;
};
