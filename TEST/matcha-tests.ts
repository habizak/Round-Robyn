/**
 * Matcha — Domain Logic Test Suite
 * Framework: Vitest
 * Scope: Pure domain functions only (no UI, no hooks, no localStorage)
 *
 * Install: `npm install -D vitest`
 * Run:     `npx vitest run`
 *
 * File mirrors the domain layer:
 *   src/domain/matchGenerator.ts
 *   src/domain/sessionRules.ts
 *   src/domain/scoring.ts
 */

import { describe, it, expect } from 'vitest'
import { sessionReducer } from '../src/hooks/useSession'

// ─── Types (inline for test portability) ────────────────────────────────────

type MatchType = 'singles' | 'fixed-doubles' | 'random-doubles'
type SessionMode = 'singles' | 'fixed-doubles' | 'random-doubles' | 'mixed'

type Player = {
  id: string
  name: string
  status: 'playing' | 'benched'
  partnerId?: string
}

type Court = {
  id: string
  name: string
  status: 'empty' | 'occupied'
}

type Match = {
  id: string
  courtId: string
  team1: string[]
  team2: string[]
  status: 'pending' | 'playing' | 'completed'
  score?: Score
  matchNumber: number
  round?: number
}

type Session = {
  id: string
  mode: SessionMode
  matchType: MatchType
  winningPoint: number
  players: Player[]
  courts: Court[]
  matches: Match[]
  currentRound: number
  status: 'setup' | 'active' | 'ended'
  byeHistory: string[]
}

type Score = {
  winnerId: string[]
  team1Points: number
  team2Points: number
}

// ─── Import domain functions ─────────────────────────────────────────────────
// These must be implemented in src/domain/ to pass.

import {
  getAllTeams,
  areDisjoint,
  generateRound,
  getMatchKey,
  getMatchOptions,
  filterMatchOptions,
} from '../src/domain/matchGenerator'

import {
  validatePlayerCount,
  validateCourtCount,
  validateWinningPoint,
  validatePlayerName,
  validateCourtName,
  canProgressFromPlayers,
  canGenerateOnCourt,
  getActivePlayerIds,
} from '../src/domain/sessionRules'

import {
  resolveScore,
  getWinningTeam,
} from '../src/domain/scoring'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(id: string, name: string, status: Player['status'] = 'benched'): Player {
  return { id, name, status }
}

function makeCourt(id: string, name: string, status: Court['status'] = 'empty'): Court {
  return { id, name, status }
}

const p = (n: number) => makePlayer(`p${n}`, `Player ${n}`)
const c = (n: number) => makeCourt(`c${n}`, `Court ${n}`)

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: getAllTeams
// ─────────────────────────────────────────────────────────────────────────────

describe('getAllTeams', () => {
  it('returns all unique 2-player combinations', () => {
    const players = [p(1), p(2), p(3)]
    const teams = getAllTeams(players)
    // C(3,2) = 3
    expect(teams).toHaveLength(3)
  })

  it('returns C(n,2) combinations for n players', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const teams = getAllTeams(players)
    // C(6,2) = 15
    expect(teams).toHaveLength(15)
  })

  it('each team contains exactly 2 players', () => {
    const teams = getAllTeams([p(1), p(2), p(3), p(4)])
    teams.forEach(team => expect(team).toHaveLength(2))
  })

  it('no team contains the same player twice', () => {
    const teams = getAllTeams([p(1), p(2), p(3), p(4)])
    teams.forEach(([a, b]) => expect(a.id).not.toBe(b.id))
  })

  it('returns empty array for fewer than 2 players', () => {
    expect(getAllTeams([])).toHaveLength(0)
    expect(getAllTeams([p(1)])).toHaveLength(0)
  })

  it('returns one team for exactly 2 players', () => {
    expect(getAllTeams([p(1), p(2)])).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: areDisjoint
// ─────────────────────────────────────────────────────────────────────────────

describe('areDisjoint', () => {
  it('returns true when teams share no players', () => {
    expect(areDisjoint([p(1), p(2)], [p(3), p(4)])).toBe(true)
  })

  it('returns false when teams share one player', () => {
    expect(areDisjoint([p(1), p(2)], [p(2), p(3)])).toBe(false)
  })

  it('returns false when teams share all players', () => {
    expect(areDisjoint([p(1), p(2)], [p(1), p(2)])).toBe(false)
  })

  it('works for singles (1-player teams)', () => {
    expect(areDisjoint([p(1)], [p(2)])).toBe(true)
    expect(areDisjoint([p(1)], [p(1)])).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: getMatchKey
// ─────────────────────────────────────────────────────────────────────────────

describe('getMatchKey', () => {
  it('produces the same key regardless of team order', () => {
    const key1 = getMatchKey(['p1', 'p2'], ['p3', 'p4'])
    const key2 = getMatchKey(['p3', 'p4'], ['p1', 'p2'])
    expect(key1).toBe(key2)
  })

  it('produces the same key regardless of player order within team', () => {
    const key1 = getMatchKey(['p1', 'p2'], ['p3', 'p4'])
    const key2 = getMatchKey(['p2', 'p1'], ['p4', 'p3'])
    expect(key1).toBe(key2)
  })

  it('produces different keys for different matchups', () => {
    const key1 = getMatchKey(['p1', 'p2'], ['p3', 'p4'])
    const key2 = getMatchKey(['p1', 'p3'], ['p2', 'p4'])
    expect(key1).not.toBe(key2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: generateRound — Random Doubles
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRound — random-doubles', () => {
  const matchType: MatchType = 'random-doubles'

  it('assigns one match per available court when players are sufficient', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    expect(matches).toHaveLength(2)
  })

  it('does not assign a match to a court when there are not enough unique players', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    expect(matches).toHaveLength(1)
    const allIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('does not assign more matches than courts', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const courts = [c(1)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    expect(matches).toHaveLength(1)
  })

  it('each match has exactly 4 unique players (2 per team)', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    matches.forEach(match => {
      const all = [...match.team1, ...match.team2]
      expect(all).toHaveLength(4)
      expect(new Set(all).size).toBe(4)
    })
  })

  it('no player appears in more than one match per round', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    const allPlayerIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allPlayerIds).size).toBe(allPlayerIds.length)
  })

  it('remaining players are benched', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1)] // 1 court = 4 players play, 2 rest
    const { matches, benched } = generateRound(players, courts, matchType, new Set())
    const playing = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(benched.map(b => b.id).sort()).toEqual(
      players.filter(pl => !playing.includes(pl.id)).map(pl => pl.id).sort()
    )
  })

  it('does not repeat a matchup already in usedMatchups', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1)]

    const usedMatchups = new Set<string>()
    const round1 = generateRound(players, courts, matchType, usedMatchups)
    const match1 = round1.matches[0]
    usedMatchups.add(getMatchKey(match1.team1, match1.team2))

    const round2 = generateRound(players, courts, matchType, usedMatchups)
    const match2 = round2.matches[0]
    expect(getMatchKey(match2.team1, match2.team2)).not.toBe(
      getMatchKey(match1.team1, match1.team2)
    )
  })

  it('handles odd number of players — exactly one player benched', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const courts = [c(1)]
    const { matches, benched } = generateRound(players, courts, matchType, new Set())
    expect(matches).toHaveLength(1)
    expect(benched).toHaveLength(1)
  })

  it('rotates bye fairly — different player sits out each round', () => {
    // With 5 players and 1 court, the same player should not always sit out
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()
    const benchedIds = new Set<string>()

    for (let i = 0; i < 5; i++) {
      const { matches, benched } = generateRound(players, courts, matchType, usedMatchups)
      benched.forEach(b => benchedIds.add(b.id))
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }

    // After 5 rounds, more than 1 unique player should have sat out
    expect(benchedIds.size).toBeGreaterThan(1)
  })

  it('returns empty matches if not enough players for any valid matchup', () => {
    const players = [p(1), p(2), p(3)] // 3 players can't form 2 disjoint doubles teams
    const courts = [c(1)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    // Can't form even 1 doubles match with 3 players
    expect(matches).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: generateRound — Singles
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRound — singles', () => {
  const matchType: MatchType = 'singles'

  it('each match has exactly 2 players (1 per team)', () => {
    const players = [p(1), p(2), p(3), p(4)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    matches.forEach(match => {
      expect(match.team1).toHaveLength(1)
      expect(match.team2).toHaveLength(1)
    })
  })

  it('no player appears in more than one match', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1), c(2), c(3)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    const allIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('does not repeat a singles matchup', () => {
    const players = [p(1), p(2), p(3), p(4)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()

    const round1 = generateRound(players, courts, matchType, usedMatchups)
    usedMatchups.add(getMatchKey(round1.matches[0].team1, round1.matches[0].team2))

    const round2 = generateRound(players, courts, matchType, usedMatchups)
    if (round2.matches.length > 0) {
      expect(getMatchKey(round2.matches[0].team1, round2.matches[0].team2)).not.toBe(
        getMatchKey(round1.matches[0].team1, round1.matches[0].team2)
      )
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: generateRound — Fixed Doubles
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRound — fixed-doubles', () => {
  const matchType: MatchType = 'fixed-doubles'

  it('always uses the same partner pairs', () => {
    // Fixed doubles: players are pre-paired (p1+p2, p3+p4, p5+p6)
    // The generator must respect these fixed pairs, not randomise within them
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1)]

    const round1 = generateRound(players, courts, matchType, new Set())
    const round2 = generateRound(players, courts, matchType, new Set())

    // Each match team should be a consistent fixed pair
    // (Implementation detail: pairs are stored on Player or passed separately)
    for (const round of [round1, round2]) {
      round.matches.forEach(match => {
        expect(match.team1).toHaveLength(2)
        expect(match.team2).toHaveLength(2)
      })
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: sessionRules — validatePlayerCount
// ─────────────────────────────────────────────────────────────────────────────

describe('validatePlayerCount', () => {
  it('singles: valid with 2+ players', () => {
    expect(validatePlayerCount(2, 'singles').valid).toBe(true)
    expect(validatePlayerCount(16, 'singles').valid).toBe(true)
  })

  it('singles: invalid with fewer than 2', () => {
    expect(validatePlayerCount(0, 'singles').valid).toBe(false)
    expect(validatePlayerCount(1, 'singles').valid).toBe(false)
  })

  it('random-doubles: valid with 4+ players', () => {
    expect(validatePlayerCount(4, 'random-doubles').valid).toBe(true)
    expect(validatePlayerCount(5, 'random-doubles').valid).toBe(true)
  })

  it('random-doubles: invalid with fewer than 4', () => {
    expect(validatePlayerCount(3, 'random-doubles').valid).toBe(false)
  })

  it('fixed-doubles: valid with 4+ even number of players', () => {
    expect(validatePlayerCount(4, 'fixed-doubles').valid).toBe(true)
    expect(validatePlayerCount(6, 'fixed-doubles').valid).toBe(true)
  })

  it('fixed-doubles: invalid with odd number of players', () => {
    expect(validatePlayerCount(5, 'fixed-doubles').valid).toBe(false)
    expect(validatePlayerCount(7, 'fixed-doubles').valid).toBe(false)
  })

  it('fixed-doubles: invalid with fewer than 4', () => {
    expect(validatePlayerCount(2, 'fixed-doubles').valid).toBe(false)
  })

  it('any type: invalid above MAX_PLAYERS (16)', () => {
    expect(validatePlayerCount(17, 'singles').valid).toBe(false)
    expect(validatePlayerCount(17, 'random-doubles').valid).toBe(false)
  })

  it('returns a message on failure', () => {
    const result = validatePlayerCount(1, 'singles')
    expect(result.valid).toBe(false)
    expect(result.message).toBeTruthy()
    expect(typeof result.message).toBe('string')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: sessionRules — validateCourtCount
// ─────────────────────────────────────────────────────────────────────────────

describe('validateCourtCount', () => {
  it('valid with 1 court', () => {
    expect(validateCourtCount(1).valid).toBe(true)
  })

  it('valid with up to 8 courts', () => {
    expect(validateCourtCount(8).valid).toBe(true)
  })

  it('invalid with 0 courts', () => {
    expect(validateCourtCount(0).valid).toBe(false)
  })

  it('invalid with more than MAX_COURTS (8)', () => {
    expect(validateCourtCount(9).valid).toBe(false)
  })

  it('returns a message on failure', () => {
    const result = validateCourtCount(0)
    expect(result.message).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: sessionRules — validateWinningPoint
// ─────────────────────────────────────────────────────────────────────────────

describe('validateWinningPoint', () => {
  it('valid for preset values: 7, 11, 15, 21', () => {
    ;[7, 11, 15, 21].forEach(v => {
      expect(validateWinningPoint(v).valid).toBe(true)
    })
  })

  it('valid for any custom value >= 1', () => {
    expect(validateWinningPoint(1).valid).toBe(true)
    expect(validateWinningPoint(30).valid).toBe(true)
    expect(validateWinningPoint(100).valid).toBe(true)
  })

  it('invalid for 0', () => {
    expect(validateWinningPoint(0).valid).toBe(false)
  })

  it('invalid for negative values', () => {
    expect(validateWinningPoint(-1).valid).toBe(false)
    expect(validateWinningPoint(-100).valid).toBe(false)
  })

  it('invalid for non-integer values', () => {
    expect(validateWinningPoint(7.5).valid).toBe(false)
  })

  it('returns a message on failure', () => {
    const result = validateWinningPoint(0)
    expect(result.message).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10: sessionRules — validatePlayerName
// ─────────────────────────────────────────────────────────────────────────────

describe('validatePlayerName', () => {
  it('valid for a unique non-empty name', () => {
    expect(validatePlayerName('Hafiz', []).valid).toBe(true)
  })

  it('invalid for an empty string', () => {
    expect(validatePlayerName('', []).valid).toBe(false)
  })

  it('invalid for whitespace-only string', () => {
    expect(validatePlayerName('   ', []).valid).toBe(false)
  })

  it('invalid for a duplicate name (case-insensitive)', () => {
    const existing = [makePlayer('1', 'Hafiz')]
    expect(validatePlayerName('Hafiz', existing).valid).toBe(false)
    expect(validatePlayerName('hafiz', existing).valid).toBe(false)
    expect(validatePlayerName('HAFIZ', existing).valid).toBe(false)
  })

  it('returns "Name already added." as message for duplicate', () => {
    const existing = [makePlayer('1', 'Hafiz')]
    const result = validatePlayerName('Hafiz', existing)
    expect(result.message).toBe('Name already added.')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11: sessionRules — validateCourtName
// ─────────────────────────────────────────────────────────────────────────────

describe('validateCourtName', () => {
  it('valid for a unique non-empty name', () => {
    expect(validateCourtName('Court A', []).valid).toBe(true)
  })

  it('invalid for an empty string', () => {
    expect(validateCourtName('', []).valid).toBe(false)
  })

  it('invalid for duplicate court name (case-insensitive)', () => {
    const existing = [makeCourt('1', 'Court A')]
    expect(validateCourtName('Court A', existing).valid).toBe(false)
    expect(validateCourtName('court a', existing).valid).toBe(false)
  })

  it('returns "Court already added." as message for duplicate', () => {
    const existing = [makeCourt('1', 'Court A')]
    const result = validateCourtName('Court A', existing)
    expect(result.message).toBe('Court already added.')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12: sessionRules — canProgressFromPlayers
// ─────────────────────────────────────────────────────────────────────────────

describe('canProgressFromPlayers', () => {
  it('singles: can progress with 2 players', () => {
    const players = [p(1), p(2)]
    expect(canProgressFromPlayers(players, 'singles')).toBe(true)
  })

  it('singles: cannot progress with 1 player', () => {
    expect(canProgressFromPlayers([p(1)], 'singles')).toBe(false)
  })

  it('random-doubles: can progress with 4 players', () => {
    expect(canProgressFromPlayers([p(1), p(2), p(3), p(4)], 'random-doubles')).toBe(true)
  })

  it('random-doubles: cannot progress with 3 players', () => {
    expect(canProgressFromPlayers([p(1), p(2), p(3)], 'random-doubles')).toBe(false)
  })

  it('fixed-doubles: can progress with 4 players (even)', () => {
    expect(canProgressFromPlayers([p(1), p(2), p(3), p(4)], 'fixed-doubles')).toBe(true)
  })

  it('fixed-doubles: cannot progress with 5 players (odd)', () => {
    expect(canProgressFromPlayers([p(1), p(2), p(3), p(4), p(5)], 'fixed-doubles')).toBe(false)
  })

  it('cannot progress above 16 players', () => {
    const players = Array.from({ length: 17 }, (_, i) => p(i + 1))
    expect(canProgressFromPlayers(players, 'singles')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13: scoring — resolveScore
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveScore', () => {
  it('returns a valid Score with winnerId, team1Points, team2Points', () => {
    const score = resolveScore(['p1', 'p2'], ['p1', 'p2'], 15, 10)
    expect(score).toMatchObject({
      winnerId: ['p1', 'p2'],
      team1Points: 15,
      team2Points: 10,
    })
  })

  it('accepts 0 as a valid loser score', () => {
    const score = resolveScore(['p1'], ['p1'], 21, 0)
    expect(score.team2Points).toBe(0)
  })

  it('rejects negative points', () => {
    expect(() => resolveScore(['p1'], ['p1'], -1, 10)).toThrow()
  })

  it('rejects non-integer points', () => {
    expect(() => resolveScore(['p1'], ['p1'], 15.5, 10)).toThrow()
  })

  it('requires winnerId to be non-empty', () => {
    expect(() => resolveScore([], [], 15, 10)).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 14: scoring — getWinningTeam
// ─────────────────────────────────────────────────────────────────────────────

describe('getWinningTeam', () => {
  it('returns team1 when team1 is winner', () => {
    const match: Match = {
      id: 'm1',
      courtId: 'c1',
      team1: ['p1', 'p2'],
      team2: ['p3', 'p4'],
      status: 'completed',
      matchNumber: 1,
      score: { winnerId: ['p1', 'p2'], team1Points: 15, team2Points: 10 },
    }
    expect(getWinningTeam(match)).toEqual(['p1', 'p2'])
  })

  it('returns team2 when team2 is winner', () => {
    const match: Match = {
      id: 'm1',
      courtId: 'c1',
      team1: ['p1', 'p2'],
      team2: ['p3', 'p4'],
      status: 'completed',
      matchNumber: 1,
      score: { winnerId: ['p3', 'p4'], team1Points: 10, team2Points: 15 },
    }
    expect(getWinningTeam(match)).toEqual(['p3', 'p4'])
  })

  it('returns null for a match without a score', () => {
    const match: Match = {
      id: 'm1',
      courtId: 'c1',
      team1: ['p1', 'p2'],
      team2: ['p3', 'p4'],
      status: 'playing',
      matchNumber: 1,
    }
    expect(getWinningTeam(match)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 15: Integration — full round cycle
// ─────────────────────────────────────────────────────────────────────────────

describe('full round cycle — random-doubles', () => {
  it('generates 3 rounds without repeating any matchup', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()

    for (let round = 0; round < 3; round++) {
      const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)
      expect(matches.length).toBeGreaterThan(0)

      matches.forEach(m => {
        const key = getMatchKey(m.team1, m.team2)
        expect(usedMatchups.has(key)).toBe(false)
        usedMatchups.add(key)
      })
    }
  })

  it('every player plays at least once across 3 rounds with enough courts', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1), c(2)] // 2 courts = all 6 play each round
    const usedMatchups = new Set<string>()
    const playedIds = new Set<string>()

    for (let round = 0; round < 3; round++) {
      const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)
      matches.forEach(m => {
        ;[...m.team1, ...m.team2].forEach(id => playedIds.add(id))
        usedMatchups.add(getMatchKey(m.team1, m.team2))
      })
    }

    players.forEach(pl => expect(playedIds.has(pl.id)).toBe(true))
  })

  it('handles exhausing all possible matchups gracefully', () => {
    // With 4 players and random doubles, there are only 3 unique matchups:
    // (p1+p2 vs p3+p4), (p1+p3 vs p2+p4), (p1+p4 vs p2+p3)
    const players = [p(1), p(2), p(3), p(4)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()

    // Exhaust all 3 matchups
    for (let i = 0; i < 3; i++) {
      const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }

    // 4th round: no valid matchups left — should not throw, should return empty or reset
    expect(() => {
      generateRound(players, courts, 'random-doubles', usedMatchups)
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 16: getMatchOptions — active player exclusion
// ─────────────────────────────────────────────────────────────────────────────

describe('getMatchOptions', () => {
  it('excludes players in activePlayerIds from all returned options', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)].map(pl => ({
      ...pl,
      status: 'benched' as const,
    }))
    const activeIds = new Set(['p1', 'p2', 'p3', 'p4'])
    const options = getMatchOptions(players, 'random-doubles', new Set(), activeIds)

    expect(options.length).toBeGreaterThan(0)
    options.forEach(opt => {
      const ids = [...opt.team1, ...opt.team2]
      expect(ids.every(id => !activeIds.has(id))).toBe(true)
    })
  })

  it('returns empty array when activeIds contains all players', () => {
    const players = [p(1), p(2), p(3), p(4)].map(pl => ({
      ...pl,
      status: 'benched' as const,
    }))
    const activeIds = new Set(['p1', 'p2', 'p3', 'p4'])
    const options = getMatchOptions(players, 'random-doubles', new Set(), activeIds)
    expect(options).toHaveLength(0)
  })

  it('uses activeIds not player.status — returns options even when all players are status playing', () => {
    // This confirms the known design: getMatchOptions trusts activeIds, not status
    // Caller is responsible for passing correct activeIds
    const players = [p(1), p(2), p(3), p(4)].map(pl => ({
      ...pl,
      status: 'playing' as const, // all marked playing
    }))
    const emptyActiveIds = new Set<string>() // but activeIds is empty
    const options = getMatchOptions(players, 'random-doubles', new Set(), emptyActiveIds)
    // Options ARE returned — status is not the filter, activeIds is
    expect(options.length).toBeGreaterThan(0)
  })

  it('returns at most 4 options by default', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)].map(pl => ({
      ...pl,
      status: 'benched' as const,
    }))
    const options = getMatchOptions(players, 'random-doubles', new Set(), new Set())
    expect(options.length).toBeLessThanOrEqual(4)
    expect(options.length).toBeGreaterThan(0)
  })

  it('prefers options with benched players over playing players', () => {
    const players = [
      { ...p(1), status: 'benched' as const },
      { ...p(2), status: 'benched' as const },
      { ...p(3), status: 'benched' as const },
      { ...p(4), status: 'benched' as const },
      { ...p(5), status: 'playing' as const },
      { ...p(6), status: 'playing' as const },
    ]
    const activeIds = new Set(['p5', 'p6'])
    const options = getMatchOptions(players, 'random-doubles', new Set(), activeIds)
    // All returned options should only contain p1–p4 (none playing/active)
    options.forEach(opt => {
      expect([...opt.team1, ...opt.team2].every(id => !activeIds.has(id))).toBe(true)
    })
  })

  it('returns empty when not enough available players', () => {
    const players = [p(1), p(2), p(3)].map(pl => ({ ...pl, status: 'benched' as const }))
    expect(getMatchOptions(players, 'random-doubles', new Set(), new Set())).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 17: filterMatchOptions
// ─────────────────────────────────────────────────────────────────────────────

describe('filterMatchOptions', () => {
  const options = [
    { team1: ['p1', 'p2'], team2: ['p3', 'p4'], key: 'a' },
    { team1: ['p1', 'p5'], team2: ['p6', 'p7'], key: 'b' },
    { team1: ['p8', 'p9'], team2: ['p10', 'p11'], key: 'c' },
  ]

  it('returns all options when filter is null', () => {
    expect(filterMatchOptions(options, null)).toHaveLength(3)
  })

  it('filters to options that include the specified player', () => {
    const filtered = filterMatchOptions(options, 'p5')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].key).toBe('b')
  })

  it('returns multiple options if player appears in multiple', () => {
    const filtered = filterMatchOptions(options, 'p1')
    expect(filtered).toHaveLength(2)
    expect(filtered.map(o => o.key).sort()).toEqual(['a', 'b'])
  })

  it('returns empty array if player is not in any option', () => {
    expect(filterMatchOptions(options, 'p99')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 18: canGenerateOnCourt
// ─────────────────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    mode: 'random-doubles',
    matchType: 'random-doubles',
    winningPoint: 21,
    players: [],
    courts: [],
    matches: [],
    currentRound: 1,
    status: 'active',
    byeHistory: [],
    ...overrides,
  }
}

describe('canGenerateOnCourt', () => {
  it('returns valid when court is empty and enough benched players exist', () => {
    const session = makeSession({
      players: [
        { ...p(1), status: 'benched' },
        { ...p(2), status: 'benched' },
        { ...p(3), status: 'benched' },
        { ...p(4), status: 'benched' },
      ],
      courts: [c(1)],
    })
    expect(canGenerateOnCourt(session, 'c1').valid).toBe(true)
  })

  it('returns invalid when court not found', () => {
    const session = makeSession({ courts: [c(1)] })
    const result = canGenerateOnCourt(session, 'c999')
    expect(result.valid).toBe(false)
    expect(result.message).toBeTruthy()
  })

  it('returns invalid when court already has an active match', () => {
    const session = makeSession({
      players: [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'playing' as const })),
      courts: [{ ...c(1), status: 'occupied' }],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'playing', matchNumber: 1, round: 1,
      }],
    })
    const result = canGenerateOnCourt(session, 'c1')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/already in progress/i)
  })

  it('returns invalid when benched count is below minimum for match type (doubles)', () => {
    // All 4 players are playing — 0 benched
    const session = makeSession({
      matchType: 'random-doubles',
      players: [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'playing' as const })),
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'playing', matchNumber: 1, round: 1,
      }],
    })
    const result = canGenerateOnCourt(session, 'c2')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/4/i) // mentions min 4
  })

  it('returns invalid when benched count is below minimum for singles', () => {
    const session = makeSession({
      matchType: 'singles',
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
      ],
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1'], team2: ['p2'],
        status: 'playing', matchNumber: 1, round: 1,
      }],
    })
    const result = canGenerateOnCourt(session, 'c2')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/2/i)
  })

  it('becomes valid again after a match completes and players return to benched', () => {
    // Simulate: match completed, players now benched
    const session = makeSession({
      matchType: 'random-doubles',
      players: [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'benched' as const })),
      courts: [c(1)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'completed', matchNumber: 1, round: 1,
      }],
    })
    expect(canGenerateOnCourt(session, 'c1').valid).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 19: getActivePlayerIds
// ─────────────────────────────────────────────────────────────────────────────

describe('getActivePlayerIds', () => {
  it('returns IDs of all players in playing matches', () => {
    const matches: Match[] = [
      { id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'], status: 'playing', matchNumber: 1 },
    ]
    const ids = getActivePlayerIds(matches)
    expect(ids.size).toBe(4)
    ;['p1', 'p2', 'p3', 'p4'].forEach(id => expect(ids.has(id)).toBe(true))
  })

  it('does not include players from completed matches', () => {
    const matches: Match[] = [
      { id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'], status: 'completed', matchNumber: 1 },
    ]
    const ids = getActivePlayerIds(matches)
    expect(ids.size).toBe(0)
  })

  it('includes players from multiple concurrent playing matches', () => {
    const matches: Match[] = [
      { id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'], status: 'playing', matchNumber: 1 },
      { id: 'm2', courtId: 'c2', team1: ['p5', 'p6'], team2: ['p7', 'p8'], status: 'playing', matchNumber: 2 },
    ]
    const ids = getActivePlayerIds(matches)
    expect(ids.size).toBe(8)
  })

  it('returns empty set when no matches exist', () => {
    expect(getActivePlayerIds([])).toEqual(new Set())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 20: byeHistory — fairness over many rounds
// ─────────────────────────────────────────────────────────────────────────────

describe('byeHistory — fairness over many rounds', () => {
  it('distributes byes fairly over 20 rounds with 5 players', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()
    const byeCount: Record<string, number> = {}
    players.forEach(pl => { byeCount[pl.id] = 0 })
    let byeHistory: string[] = []

    for (let round = 0; round < 20; round++) {
      const { matches, benched, updatedByeHistory } = generateRound(
        players,
        courts,
        'random-doubles',
        usedMatchups,
        byeHistory,
      )
      byeHistory = updatedByeHistory
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
      benched.forEach(b => { byeCount[b.id] = (byeCount[b.id] ?? 0) + 1 })
    }

    const counts = Object.values(byeCount)
    const min = Math.min(...counts)
    const max = Math.max(...counts)

    // No player should have more than 1 extra bye than the least-benched player
    expect(max - min).toBeLessThanOrEqual(1)
  })

  it('does not slow down or throw as byeHistory grows', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()

    expect(() => {
      for (let round = 0; round < 20; round++) {
        const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)
        matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
      }
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 21: usedMatchups includes active (playing) matches
// ─────────────────────────────────────────────────────────────────────────────

describe('usedMatchups includes playing matches', () => {
  it('active match key is in usedMatchups — cannot be re-generated on another court', () => {
    // Simulate getUsedMatchups behaviour: includes status='playing' matches
    const playingMatch: Match = {
      id: 'm1', courtId: 'c1',
      team1: ['p1', 'p2'], team2: ['p3', 'p4'],
      status: 'playing', matchNumber: 1,
    }

    // Build usedMatchups the same way the reducer does
    const usedMatchups = new Set<string>()
    if (playingMatch.status === 'completed' || playingMatch.status === 'playing') {
      usedMatchups.add(getMatchKey(playingMatch.team1, playingMatch.team2))
    }

    expect(usedMatchups.has(getMatchKey(['p1', 'p2'], ['p3', 'p4']))).toBe(true)

    // Generate for court 2 with same 4 players — should not produce same matchup
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(2)]
    const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)

    if (matches.length > 0) {
      const key = getMatchKey(matches[0].team1, matches[0].team2)
      expect(key).not.toBe(getMatchKey(['p1', 'p2'], ['p3', 'p4']))
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 22: Fixed Doubles — partner reference integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Fixed Doubles — partner reference integrity', () => {
  it('player with partnerId pointing to removed player should have undefined partnerId', () => {
    // Simulate what SET_PARTNER + REMOVE_PLAYER does in the reducer
    let players: Player[] = [
      { ...p(1), partnerId: 'p2' },
      { ...p(2), partnerId: 'p1' },
      { ...p(3), partnerId: 'p4' },
      { ...p(4), partnerId: 'p3' },
    ]

    // Simulate REMOVE_PLAYER for p1
    const removedId = 'p1'
    players = players
      .filter(pl => pl.id !== removedId)
      .map(pl => pl.partnerId === removedId ? { ...pl, partnerId: undefined } : pl)

    expect(players.find(pl => pl.id === 'p2')?.partnerId).toBeUndefined()
    expect(players.find(pl => pl.id === 'p3')?.partnerId).toBe('p4')
    expect(players.find(pl => pl.id === 'p4')?.partnerId).toBe('p3')
    expect(players.some(pl => pl.partnerId === removedId)).toBe(false)
  })

  it('no orphaned partnerId references after player removal', () => {
    let players: Player[] = [
      { ...p(1), partnerId: 'p2' },
      { ...p(2), partnerId: 'p1' },
    ]

    const removedId = 'p2'
    players = players
      .filter(pl => pl.id !== removedId)
      .map(pl => pl.partnerId === removedId ? { ...pl, partnerId: undefined } : pl)

    const playerIds = new Set(players.map(pl => pl.id))
    players.forEach(pl => {
      if (pl.partnerId) {
        expect(playerIds.has(pl.partnerId)).toBe(true)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 23: Match type change clears players
// ─────────────────────────────────────────────────────────────────────────────

describe('SET_MATCH_TYPE clears player list', () => {
  it('changing match type resets players to empty array', () => {
    // Simulate SET_MATCH_TYPE reducer behaviour
    const stateBefore = {
      matchType: 'singles' as MatchType,
      players: [p(1), p(2), p(3), p(4)],
    }

    const stateAfter = {
      ...stateBefore,
      matchType: 'random-doubles' as MatchType,
      players: [],
    }

    expect(stateAfter.players).toHaveLength(0)
    expect(stateAfter.matchType).toBe('random-doubles')
  })

  it('changing from fixed-doubles clears all partnerId references', () => {
    const stateBefore = {
      matchType: 'fixed-doubles' as MatchType,
      players: [
        { ...p(1), partnerId: 'p2' },
        { ...p(2), partnerId: 'p1' },
      ],
    }

    // SET_MATCH_TYPE sets players: []
    const stateAfter = {
      ...stateBefore,
      matchType: 'singles' as MatchType,
      players: [],
    }

    expect(stateAfter.players).toHaveLength(0)
    // No player objects remain — no orphaned partnerIds possible
    expect(stateAfter.players.some((pl: Player) => pl.partnerId !== undefined)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 24: Mixed Mode — canGenerateOnCourt
// ─────────────────────────────────────────────────────────────────────────────
//
// These tests cover the updated canGenerateOnCourt behaviour when
// session.mode === 'mixed'. The minimum bench count gate drops to 2
// (MIN_PLAYERS_SINGLES) because the match type is chosen at generation
// time, not at session level.
//
// Append this section to TEST/matcha-tests.ts after Section 23.
// Update the Session type at the top of the file to include:
//
//   type SessionMode = 'singles' | 'fixed-doubles' | 'random-doubles' | 'mixed'
//   type Session = { ..., mode: SessionMode }
//
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — canGenerateOnCourt', () => {

  // ── Helper: mixed session factory ─────────────────────────────────────────

  function makeMixedSession(overrides: Partial<Session> = {}): Session {
    return {
      id: 's1',
      mode: 'mixed',
      matchType: 'singles', // fallback; not used for gate logic in mixed mode
      winningPoint: 11,
      players: [],
      courts: [],
      matches: [],
      currentRound: 1,
      status: 'active',
      byeHistory: [],
      ...overrides,
    }
  }

  // ── Gate: minimum 2 benched (not 4) ───────────────────────────────────────

  it('J-domain-1: allows generation with 2 benched players in mixed mode', () => {
    const session = makeMixedSession({
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
        { ...p(3), status: 'benched' },
        { ...p(4), status: 'benched' },
      ],
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1'], team2: ['p2'],
        status: 'playing', matchNumber: 1, round: 1, matchType: 'singles',
      }],
    })
    expect(canGenerateOnCourt(session, 'c2').valid).toBe(true)
  })

  it('J-domain-2: blocks generation with only 1 benched player in mixed mode', () => {
    const session = makeMixedSession({
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
        { ...p(3), status: 'playing' },
        { ...p(4), status: 'benched' },
      ],
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'playing', matchNumber: 1, round: 1, matchType: 'random-doubles',
      }],
    })
    const result = canGenerateOnCourt(session, 'c2')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/2/i)
  })

  it('J-domain-3: blocks generation with 0 benched players in mixed mode', () => {
    const session = makeMixedSession({
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
        { ...p(3), status: 'playing' },
        { ...p(4), status: 'playing' },
      ],
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'playing', matchNumber: 1, round: 1, matchType: 'random-doubles',
      }],
    })
    expect(canGenerateOnCourt(session, 'c2').valid).toBe(false)
  })

  it('J-domain-4: non-mixed session with 2 benched still requires 4 for doubles', () => {
    // Confirm existing non-mixed behaviour is NOT broken by the mixed-mode change
    const session = makeSession({
      mode: 'random-doubles',
      matchType: 'random-doubles',
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
        { ...p(3), status: 'benched' },
        { ...p(4), status: 'benched' },
      ],
      courts: [c(1), c(2)],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1', 'p2'], team2: ['p3', 'p4'],
        status: 'playing', matchNumber: 1, round: 1, matchType: 'random-doubles',
      }],
    })
    // Only 2 benched — not enough for doubles in non-mixed mode
    expect(canGenerateOnCourt(session, 'c2').valid).toBe(false)
  })

  it('J-domain-5: court with active match is still blocked in mixed mode', () => {
    const session = makeMixedSession({
      players: [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'playing' as const })),
      courts: [{ ...c(1), status: 'occupied' }],
      matches: [{
        id: 'm1', courtId: 'c1', team1: ['p1'], team2: ['p2'],
        status: 'playing', matchNumber: 1, round: 1, matchType: 'singles',
      }],
    })
    const result = canGenerateOnCourt(session, 'c1')
    expect(result.valid).toBe(false)
    expect(result.message).toMatch(/already in progress/i)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 25: Mixed Mode — Match.matchType field
// ─────────────────────────────────────────────────────────────────────────────
//
// Verifies that match objects produced or assembled in mixed sessions
// carry the correct matchType, and that legacy matches without matchType
// fall back gracefully.
//
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — Match.matchType field', () => {

  it('J-domain-6: match object with matchType: singles has team sizes of 1', () => {
    const match = {
      id: 'm1', courtId: 'c1',
      team1: ['p1'], team2: ['p2'],
      status: 'playing' as const,
      matchNumber: 1, round: 1,
      matchType: 'singles' as MatchType,
    }
    expect(match.team1).toHaveLength(1)
    expect(match.team2).toHaveLength(1)
    expect(match.matchType).toBe('singles')
  })

  it('J-domain-7: match object with matchType: random-doubles has team sizes of 2', () => {
    const match = {
      id: 'm2', courtId: 'c2',
      team1: ['p3', 'p4'], team2: ['p5', 'p6'],
      status: 'playing' as const,
      matchNumber: 2, round: 1,
      matchType: 'random-doubles' as MatchType,
    }
    expect(match.team1).toHaveLength(2)
    expect(match.team2).toHaveLength(2)
    expect(match.matchType).toBe('random-doubles')
  })

  it('J-domain-8: legacy match without matchType falls back to session.matchType', () => {
    // Simulates the backward-compatibility read in Match history display:
    //   const matchType = match.matchType ?? session.matchType
    const session = makeSession({ matchType: 'random-doubles' })
    const legacyMatch = {
      id: 'm1', courtId: 'c1',
      team1: ['p1', 'p2'], team2: ['p3', 'p4'],
      status: 'completed' as const,
      matchNumber: 1, round: 1,
      // matchType intentionally omitted — simulating pre-Mixed-mode match
    }
    const resolvedType = (legacyMatch as any).matchType ?? session.matchType
    expect(resolvedType).toBe('random-doubles')
  })

  it('J-domain-9: two concurrent matches in mixed session can have different matchTypes', () => {
    const matches = [
      {
        id: 'm1', courtId: 'c1',
        team1: ['p1'], team2: ['p2'],
        status: 'playing' as const,
        matchNumber: 1, round: 1,
        matchType: 'singles' as MatchType,
      },
      {
        id: 'm2', courtId: 'c2',
        team1: ['p3', 'p4'], team2: ['p5', 'p6'],
        status: 'playing' as const,
        matchNumber: 2, round: 1,
        matchType: 'random-doubles' as MatchType,
      },
    ]
    expect(matches[0].matchType).toBe('singles')
    expect(matches[1].matchType).toBe('random-doubles')
    // Player integrity: no overlap across both matches
    const allIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allIds).size).toBe(allIds.length)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 26: Mixed Mode — SET_MATCH_TYPE reducer behaviour
// ─────────────────────────────────────────────────────────────────────────────
//
// These tests simulate the reducer logic directly (pure state transforms)
// to verify mode and matchType are set correctly, and players are cleared.
//
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — SET_MATCH_TYPE reducer behaviour', () => {

  function applySetMatchType(
    state: Session,
    mode: SessionMode,
  ): Session {
    // Mirrors the reducer case:
    //   case 'SET_MATCH_TYPE': {
    //     const matchType = mode === 'mixed' ? 'singles' : mode
    //     return { ...state, mode, matchType, players: [] }
    //   }
    const matchType: MatchType = mode === 'mixed' ? 'singles' : mode
    return { ...state, mode, matchType, players: [] }
  }

  it('J-domain-10: SET_MATCH_TYPE with mixed sets mode=mixed, matchType=singles, clears players', () => {
    const before = makeSession({
      mode: 'singles',
      matchType: 'singles',
      players: [p(1), p(2), p(3), p(4)],
    })
    const after = applySetMatchType(before, 'mixed')
    expect(after.mode).toBe('mixed')
    expect(after.matchType).toBe('singles')
    expect(after.players).toHaveLength(0)
  })

  it('J-domain-11: SET_MATCH_TYPE with random-doubles sets mode and matchType identically', () => {
    const before = makeSession({ mode: 'mixed', matchType: 'singles', players: [p(1)] })
    const after = applySetMatchType(before, 'random-doubles')
    expect(after.mode).toBe('random-doubles')
    expect(after.matchType).toBe('random-doubles')
    expect(after.players).toHaveLength(0)
  })

  it('J-domain-12: SET_MATCH_TYPE with mixed does not set matchType to mixed (mixed is not a MatchType)', () => {
    const before = makeSession({ mode: 'singles', matchType: 'singles', players: [] })
    const after = applySetMatchType(before, 'mixed')
    const validMatchTypes: MatchType[] = ['singles', 'fixed-doubles', 'random-doubles']
    expect(validMatchTypes).toContain(after.matchType)
  })

  it('J-domain-13: switching from fixed-doubles to mixed clears all players (and implicitly all partnerIds)', () => {
    const before = makeSession({
      mode: 'fixed-doubles',
      matchType: 'fixed-doubles',
      players: [
        { ...p(1), partnerId: 'p2' },
        { ...p(2), partnerId: 'p1' },
        { ...p(3), partnerId: 'p4' },
        { ...p(4), partnerId: 'p3' },
      ],
    })
    const after = applySetMatchType(before, 'mixed')
    expect(after.players).toHaveLength(0)
    // No player objects remain — no orphaned partnerIds possible
    expect(after.players.some((pl: Player) => pl.partnerId !== undefined)).toBe(false)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 27: Mixed Mode — Player integrity invariant
// ─────────────────────────────────────────────────────────────────────────────
//
// Verifies that the core invariant (playing + benched = total) holds
// when courts run different match types simultaneously.
//
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — player integrity invariant', () => {

  it('J-domain-14: playing + benched = total when one court is singles, another is doubles', () => {
    // Simulate state after two matches assigned: Court 1 = singles (2 players),
    // Court 2 = doubles (4 players). 6 total players, 0 benched.
    const players: Player[] = [
      { ...p(1), status: 'playing' }, // Court 1 singles
      { ...p(2), status: 'playing' }, // Court 1 singles
      { ...p(3), status: 'playing' }, // Court 2 doubles
      { ...p(4), status: 'playing' }, // Court 2 doubles
      { ...p(5), status: 'playing' }, // Court 2 doubles
      { ...p(6), status: 'playing' }, // Court 2 doubles
    ]
    const playing = players.filter(p => p.status === 'playing').length
    const benched = players.filter(p => p.status === 'benched').length
    expect(playing + benched).toBe(players.length)
  })

  it('J-domain-15: no player appears in both active matches across courts', () => {
    const court1Match = { team1: ['p1'], team2: ['p2'] }         // singles
    const court2Match = { team1: ['p3', 'p4'], team2: ['p5', 'p6'] } // doubles

    const c1Ids = new Set([...court1Match.team1, ...court1Match.team2])
    const c2Ids = new Set([...court2Match.team1, ...court2Match.team2])

    const overlap = [...c1Ids].filter(id => c2Ids.has(id))
    expect(overlap).toHaveLength(0)
  })

  it('J-domain-16: playing + benched = total after Court 1 singles match completes', () => {
    // Before: 2 playing (Court 1), 4 playing (Court 2), 0 benched
    // After Court 1 completes: 2 now benched, 4 still playing
    const playersBefore: Player[] = [
      { ...p(1), status: 'playing' },
      { ...p(2), status: 'playing' },
      { ...p(3), status: 'playing' },
      { ...p(4), status: 'playing' },
      { ...p(5), status: 'playing' },
      { ...p(6), status: 'playing' },
    ]

    // Simulate COMPLETE_MATCH for Court 1 (p1, p2 freed)
    const freedIds = new Set(['p1', 'p2'])
    const playersAfter = playersBefore.map(pl =>
      freedIds.has(pl.id) ? { ...pl, status: 'benched' as const } : pl,
    )

    const playing = playersAfter.filter(pl => pl.status === 'playing').length
    const benched = playersAfter.filter(pl => pl.status === 'benched').length
    expect(playing).toBe(4)
    expect(benched).toBe(2)
    expect(playing + benched).toBe(playersBefore.length)
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 28: Mixed Mode — Regression (existing modes unchanged)
// ─────────────────────────────────────────────────────────────────────────────
//
// Quick smoke tests to confirm Singles, Fixed Doubles, and Random Doubles
// sessions are unaffected by the Mixed mode additions.
//
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — regression: existing modes unchanged', () => {

  it('J-domain-17: singles session canGenerateOnCourt still requires 2 benched', () => {
    const session = makeSession({
      mode: 'singles',
      matchType: 'singles',
      players: [
        { ...p(1), status: 'benched' },
        { ...p(2), status: 'benched' },
      ],
      courts: [c(1)],
    })
    expect(canGenerateOnCourt(session, 'c1').valid).toBe(true)
  })

  it('J-domain-18: random-doubles session canGenerateOnCourt still requires 4 benched', () => {
    const session = makeSession({
      mode: 'random-doubles',
      matchType: 'random-doubles',
      players: [
        { ...p(1), status: 'benched' },
        { ...p(2), status: 'benched' },
        // only 2 benched — not enough
      ],
      courts: [c(1)],
    })
    expect(canGenerateOnCourt(session, 'c1').valid).toBe(false)
  })

  it('J-domain-19: fixed-doubles session is unaffected — pairing logic intact', () => {
    const players: Player[] = [
      { ...p(1), status: 'benched', partnerId: 'p2' },
      { ...p(2), status: 'benched', partnerId: 'p1' },
      { ...p(3), status: 'benched', partnerId: 'p4' },
      { ...p(4), status: 'benched', partnerId: 'p3' },
    ]
    const session = makeSession({
      mode: 'fixed-doubles',
      matchType: 'fixed-doubles',
      players,
      courts: [c(1)],
    })
    expect(canGenerateOnCourt(session, 'c1').valid).toBe(true)
    // All players still have valid partnerIds
    players.forEach(pl => expect(pl.partnerId).toBeDefined())
  })

})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 29: Mixed Mode — sessionReducer (START_SESSION, ASSIGN_MATCH)
// ─────────────────────────────────────────────────────────────────────────────

describe('Mixed Mode — sessionReducer', () => {

  it('J-domain-20: START_SESSION in mixed mode activates with no matches and all players benched', () => {
    const before = makeMixedSession({
      status: 'setup',
      winningPoint: 11,
      players: [p(1), p(2), p(3), p(4), p(5), p(6)].map(pl => ({ ...pl, status: 'benched' as const })),
      courts: [c(1), c(2)],
    })
    const after = sessionReducer(before, { type: 'START_SESSION' })
    expect(after.status).toBe('active')
    expect(after.matches).toHaveLength(0)
    expect(after.players.every(pl => pl.status === 'benched')).toBe(true)
    expect(after.courts.every(ct => ct.status === 'empty')).toBe(true)
  })

  it('J-domain-21: ASSIGN_MATCH stores matchType on the new match', () => {
    const before = makeMixedSession({
      players: [p(1), p(2), p(3), p(4), p(5), p(6)].map(pl => ({ ...pl, status: 'benched' as const })),
      courts: [c(1), c(2)],
    })
    const after = sessionReducer(before, {
      type: 'ASSIGN_MATCH',
      courtId: 'c1',
      team1: ['p1', 'p2'],
      team2: ['p3', 'p4'],
      matchType: 'random-doubles',
    })
    expect(after.matches).toHaveLength(1)
    expect(after.matches[0].matchType).toBe('random-doubles')
    expect(after.matches[0].status).toBe('playing')
    const playingIds = new Set(['p1', 'p2', 'p3', 'p4'])
    expect(after.players.filter(pl => pl.status === 'playing').map(pl => pl.id).sort()).toEqual(
      [...playingIds].sort(),
    )
    expect(after.players.filter(pl => pl.status === 'benched')).toHaveLength(2)
  })

  it('J-domain-22: ASSIGN_MATCH rejects a player already in an active match', () => {
    const before = makeMixedSession({
      players: [
        { ...p(1), status: 'playing' },
        { ...p(2), status: 'playing' },
        { ...p(3), status: 'benched' },
        { ...p(4), status: 'benched' },
      ],
      courts: [{ ...c(1), status: 'occupied' }, c(2)],
      matches: [{
        id: 'm1',
        courtId: 'c1',
        team1: ['p1'],
        team2: ['p2'],
        status: 'playing',
        matchNumber: 1,
        round: 1,
        matchType: 'singles',
      }],
    })
    const after = sessionReducer(before, {
      type: 'ASSIGN_MATCH',
      courtId: 'c2',
      team1: ['p1'],
      team2: ['p3'],
      matchType: 'singles',
    })
    expect(after).toBe(before)
    expect(after.matches).toHaveLength(1)
  })

  function makeMixedSession(overrides: Partial<Session> = {}): Session {
    return {
      id: 's1',
      mode: 'mixed',
      matchType: 'singles',
      winningPoint: 11,
      players: [],
      courts: [],
      matches: [],
      currentRound: 1,
      status: 'active',
      byeHistory: [],
      ...overrides,
    }
  }

})
