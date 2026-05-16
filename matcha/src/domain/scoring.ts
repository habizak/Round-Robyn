import type { Score, Match } from '../types'

export function resolveScore(
  winnerId: string[],
  _winnerTeam: string[],
  winnerPoints: number,
  loserPoints: number
): Score {
  if (!winnerId || winnerId.length === 0) {
    throw new Error('winnerId must be non-empty.')
  }
  if (!Number.isInteger(winnerPoints) || !Number.isInteger(loserPoints)) {
    throw new Error('Points must be integers.')
  }
  if (winnerPoints < 0 || loserPoints < 0) {
    throw new Error('Points cannot be negative.')
  }
  return {
    winnerId,
    team1Points: winnerPoints,
    team2Points: loserPoints,
  }
}

export function getWinningTeam(match: Match): string[] | null {
  return match.score?.winnerId ?? null
}
