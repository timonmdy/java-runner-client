import type { RouteMap } from '../shared/IPCController'
import { getAllProfiles, saveProfile, deleteProfile, reorderProfiles } from '../store'
import { processManager } from '../processManager'
import type { Profile } from '../shared/types'

export const ProfileIPC = {
  getProfiles: { type: 'invoke', channel: 'profiles:getAll', handler: () => getAllProfiles() },
  deleteProfile: { type: 'invoke', channel: 'profiles:delete', handler: (_e: any, id: string) => deleteProfile(id) },
  reorderProfiles: { type: 'invoke', channel: 'profiles:reorder', handler: (_e: any, ids: string[]) => reorderProfiles(ids) },

  saveProfile: {
    type: 'invoke',
    channel: 'profiles:save',
    handler: (_e: any, profile: Profile) => {
      saveProfile(profile)
      processManager.updateProfileSnapshot(profile)
    },
  },
} satisfies RouteMap
