import type { Session, SessionMode } from '../types'
import { STORAGE_KEY } from '../domain/constants'

function normalizeSession(raw: Session): Session {
  const mode: SessionMode = raw.mode ?? raw.matchType ?? 'singles'
  const matchType = raw.matchType ?? (mode === 'mixed' ? 'singles' : mode)
  return { ...raw, mode, matchType }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeSession(JSON.parse(raw) as Session)
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage errors
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
