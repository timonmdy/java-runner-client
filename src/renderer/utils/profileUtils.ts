/**
 * Utility functions for profile comparison and tracking changes.
 */
import type { Profile } from '../types'

/**
 * Check if two profiles are deeply equal.
 */
export function profilesEqual(a: Profile, b: Profile): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Check if profile has unsaved changes compared to original.
 */
export function hasUnsavedChanges(original: Profile | undefined | null, draft: Profile | undefined | null): boolean {
  if (!original || !draft) return false
  return !profilesEqual(original, draft)
}
