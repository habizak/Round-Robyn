import type { MatchType, Player, Court } from '../types'
import { MAX_PLAYERS, MAX_COURTS, MIN_PLAYERS_SINGLES, MIN_PLAYERS_DOUBLES } from './constants'

type ValidationResult = { valid: boolean; message?: string }

export function validatePlayerCount(count: number, matchType: MatchType): ValidationResult {
  if (count > MAX_PLAYERS) {
    return { valid: false, message: `Maximum ${MAX_PLAYERS} players allowed.` }
  }
  if (matchType === 'singles') {
    if (count < MIN_PLAYERS_SINGLES) {
      return { valid: false, message: `Singles requires at least ${MIN_PLAYERS_SINGLES} players.` }
    }
  } else if (matchType === 'random-doubles') {
    if (count < MIN_PLAYERS_DOUBLES) {
      return { valid: false, message: `Doubles requires at least ${MIN_PLAYERS_DOUBLES} players.` }
    }
  } else if (matchType === 'fixed-doubles') {
    if (count < MIN_PLAYERS_DOUBLES) {
      return { valid: false, message: `Fixed doubles requires at least ${MIN_PLAYERS_DOUBLES} players.` }
    }
    if (count % 2 !== 0) {
      return { valid: false, message: 'Fixed doubles requires an even number of players.' }
    }
  }
  return { valid: true }
}

export function validateCourtCount(count: number): ValidationResult {
  if (count < 1) {
    return { valid: false, message: 'At least 1 court is required.' }
  }
  if (count > MAX_COURTS) {
    return { valid: false, message: `Maximum ${MAX_COURTS} courts allowed.` }
  }
  return { valid: true }
}

export function validateWinningPoint(value: number): ValidationResult {
  if (!Number.isInteger(value)) {
    return { valid: false, message: 'Winning point must be a whole number.' }
  }
  if (value < 1) {
    return { valid: false, message: 'Winning point must be at least 1.' }
  }
  return { valid: true }
}

export function validatePlayerName(name: string, existing: Player[]): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name cannot be empty.' }
  }
  const lower = name.trim().toLowerCase()
  const duplicate = existing.some(p => p.name.toLowerCase() === lower)
  if (duplicate) {
    return { valid: false, message: 'Name already added.' }
  }
  return { valid: true }
}

export function validateCourtName(name: string, existing: Court[]): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Court name cannot be empty.' }
  }
  const lower = name.trim().toLowerCase()
  const duplicate = existing.some(c => c.name.toLowerCase() === lower)
  if (duplicate) {
    return { valid: false, message: 'Court already added.' }
  }
  return { valid: true }
}

export function canProgressFromPlayers(players: Player[], matchType: MatchType): boolean {
  return validatePlayerCount(players.length, matchType).valid
}
