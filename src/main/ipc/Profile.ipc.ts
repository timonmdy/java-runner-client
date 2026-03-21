import type { RouteMap } from '../IPCController'
import { getAllProfiles, saveProfile, deleteProfile, reorderProfiles } from '../Store'
import { processManager } from '../ProcessManager'
import type { Profile } from '../shared/types/Profile.types'

export const ProfileIPC = {
  getProfiles: { type: 'invoke', channel: 'profiles:getAll', handler: () => getAllProfiles() },
  deleteProfile: {
    type: 'invoke',
    channel: 'profiles:delete',
    handler: (_e: any, id: string) => deleteProfile(id),
  },
  reorderProfiles: {
    type: 'invoke',
    channel: 'profiles:reorder',
    handler: (_e: any, ids: string[]) => reorderProfiles(ids),
  },

  saveProfile: {
    type: 'invoke',
    channel: 'profiles:save',
    handler: (_e: any, profile: Profile) => {
      saveProfile(profile)
      processManager.updateProfileSnapshot(profile)
    },
  },
} satisfies RouteMap
