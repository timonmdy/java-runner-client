/**
 * Console log persistence — saves and loads console logs from localStorage
 * to maintain console history across app minimize/reopen cycles.
 * 
 * Note: Console logs are keyed by profileId. Do NOT mix logs from different profiles.
 */
import type { ConsoleLine, Profile } from '../types'

const STORAGE_KEY_PREFIX = 'console:logs:'
const MAX_STORAGE_SIZE = 100 // entries per profile (limit to avoid bloating localStorage)

/**
 * Remove startup system messages to avoid showing old "Starting...", "PID:", etc.
 * These will be regenerated when the process starts again.
 */
function removeOldStartupMessages(lines: ConsoleLine[]): ConsoleLine[] {
  // Patterns that indicate process startup messages from a previous run
  const startupPatterns = [/^Starting:/, /^PID:/, /^Working dir:/, /^Failed to start/, /^Process stopped/]
  
  return lines.filter(line => {
    if (line.type !== 'system') return true
    return !startupPatterns.some(pattern => pattern.test(line.text))
  })
}

/**
 * Save console logs for a profile to localStorage.
 * Only persist logs that belong to this profile.
 * Filters out old startup messages to reduce storage and avoid duplication.
 */
export function saveConsoleLogs(profileId: string, lines: ConsoleLine[]): void {
  if (!profileId || !lines) return
  try {
    // Keep only the last MAX_STORAGE_SIZE lines to avoid localStorage bloat
    let toStore = lines.slice(-MAX_STORAGE_SIZE)
    // Remove old startup messages before saving to prevent duplicates
    toStore = removeOldStartupMessages(toStore)
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${profileId}`, JSON.stringify(toStore))
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

/**
 * Load console logs for a profile from localStorage.
 * Filters out old startup system messages to prevent showing stale "Starting..." etc.
 * Returns an empty array if no logs found or on error.
 */
export function loadConsoleLogs(profileId: string): ConsoleLine[] {
  if (!profileId) return []
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${profileId}`)
    if (!stored) return []
    const logs = JSON.parse(stored)
    // Validate structure
    if (!Array.isArray(logs)) return []
    // Remove old startup messages to avoid duplicates when process starts again
    return removeOldStartupMessages(logs)
  } catch {
    return []
  }
}

/**
 * Clear console logs for a profile from localStorage.
 */
export function clearConsoleLogs(profileId: string): void {
  if (!profileId) return
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${profileId}`)
  } catch {
    // Silently fail
  }
}

/**
 * Clear all console logs from localStorage.
 */
export function clearAllConsoleLogs(): void {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // Silently fail
  }
}

/**
 * Clean up orphaned console logs (logs for deleted profiles).
 */
export function cleanupOrphanedLogs(activeProfileIds: Set<string>): void {
  try {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const profileId = key.slice(STORAGE_KEY_PREFIX.length)
        if (!activeProfileIds.has(profileId)) {
          localStorage.removeItem(key)
        }
      }
    }
  } catch {
    // Silently fail
  }
}
