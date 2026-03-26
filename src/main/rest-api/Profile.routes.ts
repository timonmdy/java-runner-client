import { processManager } from '../ProcessManager';
import { err, ok } from '../RestAPI';
import { Profile } from '../shared/types/Profile.types';
import { deleteProfile, getAllProfiles, saveProfile } from '../Store';
import { defineRoute, RouteMap } from '../shared/types/RestAPI.types';
import { v4 as uuidv4 } from 'uuid';

export const ProfileRoutes: RouteMap = {
  profiles_list: defineRoute('profiles_list', ({ res }) => ok(res, getAllProfiles())),

  profiles_get: defineRoute('profiles_get', ({ res, params }) => {
    const p = getAllProfiles().find((p) => p.id === params.id);
    p ? ok(res, p) : err(res, 'Profile not found', 404);
  }),

  profiles_create: defineRoute('profiles_create', ({ res, body }) => {
    const b = body as Partial<Profile>;

    const p: Profile = {
      id: uuidv4(),
      name: b.name ?? 'New Profile',
      jarPath: b.jarPath ?? '',
      workingDir: b.workingDir ?? '',
      jvmArgs: b.jvmArgs ?? [],
      systemProperties: b.systemProperties ?? [],
      programArgs: b.programArgs ?? [],
      envVars: b.envVars ?? [],
      javaPath: b.javaPath ?? '',
      autoStart: b.autoStart ?? false,
      autoRestart: b.autoRestart ?? false,
      autoRestartInterval: b.autoRestartInterval ?? 10,
      color: b.color ?? '#4ade80',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProfile(p);
    ok(res, p, 201);
  }),

  profiles_update: defineRoute('profiles_update', ({ res, params, body }) => {
    const existing = getAllProfiles().find((p) => p.id === params.id);
    if (!existing) return err(res, 'Profile not found', 404);

    const updated: Profile = {
      ...existing,
      ...(body as Partial<Profile>),
      id: params.id,
      updatedAt: Date.now(),
    };

    saveProfile(updated);
    processManager.updateProfileSnapshot(updated);
    ok(res, updated);
  }),

  profiles_delete: defineRoute('profiles_delete', ({ res, params }) => {
    if (!getAllProfiles().find((p) => p.id === params.id))
      return err(res, 'Profile not found', 404);

    deleteProfile(params.id);
    ok(res);
  }),
};
