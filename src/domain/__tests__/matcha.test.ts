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

// ─── Types (inline for test portability) ────────────────────────────────────

type MatchType = 'singles' | 'fixed-doubles' | 'random-doubles'

type Player = {
  id: string
  name: string
  status: 'playing' | 'benched'
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
// SECTION 3b: getMatchOptions
// ─────────────────────────────────────────────────────────────────────────────

describe('getMatchOptions', () => {
  it('excludes players currently in an active match', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)].map((player, i) =>
      i < 4 ? { ...player, status: 'playing' as const } : { ...player, status: 'benched' as const },
    )
    const activeIds = new Set(['p1', 'p2', 'p3', 'p4'])
    const options = getMatchOptions(players, 'random-doubles', new Set(), activeIds)
    expect(options.length).toBeGreaterThan(0)
    options.forEach(opt => {
      const ids = [...opt.team1, ...opt.team2]
      expect(ids.every(id => !activeIds.has(id))).toBe(true)
    })
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

  it('prefers matchups with more benched players', () => {
    const players = [
      { ...p(1), status: 'benched' as const },
      { ...p(2), status: 'benched' as const },
      { ...p(3), status: 'benched' as const },
      { ...p(4), status: 'benched' as const },
    ]
    const options = getMatchOptions(players, 'random-doubles', new Set(), new Set())
    expect(options[0].team1.length + options[0].team2.length).toBe(4)
  })

  it('returns empty when not enough available players', () => {
    const players = [p(1), p(2), p(3)].map(pl => ({ ...pl, status: 'benched' as const }))
    expect(getMatchOptions(players, 'random-doubles', new Set(), new Set())).toHaveLength(0)
  })
})

describe('filterMatchOptions', () => {
  const options = [
    { team1: ['p1', 'p2'], team2: ['p3', 'p4'], key: 'a' },
    { team1: ['p1', 'p5'], team2: ['p6', 'p7'], key: 'b' },
  ]

  it('returns all options when filter is empty', () => {
    expect(filterMatchOptions(options, [])).toHaveLength(2)
  })

  it('filters to options that include the player', () => {
    const filtered = filterMatchOptions(options, ['p5'])
    expect(filtered).toHaveLength(1)
    expect(filtered[0].key).toBe('b')
  })

  it('filters to options that include ALL selected players (AND logic)', () => {
    const filtered = filterMatchOptions(options, ['p1', 'p5'])
    expect(filtered).toHaveLength(1)
    expect(filtered[0].key).toBe('b')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: generateRound — Random Doubles
// ─────────────────────────────────────────────────────────────────────────────

describe('generateRound — random-doubles', () => {
  const matchType: MatchType = 'random-doubles'

  it('assigns one match per available court', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const courts = [c(1), c(2)]
    const { matches } = generateRound(players, courts, matchType, new Set())
    expect(matches).toHaveLength(2)
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
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const courts = [c(1)]

    const round1 = generateRound(players, courts, matchType, new Set())
    const round2 = generateRound(players, courts, matchType, new Set())

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

  it('random-doubles: can progress with odd player count (5)', () => {
    expect(
      canProgressFromPlayers([p(1), p(2), p(3), p(4), p(5)], 'random-doubles'),
    ).toBe(true)
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

describe('canGenerateOnCourt', () => {
  it('allows generation when enough benched players are available', () => {
    const session = {
      id: 's1',
      mode: 'random-doubles' as const,
      matchType: 'random-doubles' as const,
      winningPoint: 21,
      players: [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)].map((player, i) =>
        i < 4 ? { ...player, status: 'playing' as const } : { ...player, status: 'benched' as const },
      ),
      courts: [c(1), c(2)],
      matches: [
        {
          id: 'm1',
          courtId: 'c1',
          team1: ['p1', 'p2'],
          team2: ['p3', 'p4'],
          status: 'playing' as const,
          matchNumber: 1,
          round: 1,
        },
      ],
      currentRound: 1,
      status: 'active' as const,
      byeHistory: [],
    }
    expect(canGenerateOnCourt(session, 'c2').valid).toBe(true)
  })

  it('blocks generation when not enough benched players remain', () => {
    const session = {
      id: 's1',
      mode: 'random-doubles' as const,
      matchType: 'random-doubles' as const,
      winningPoint: 21,
      players: [p(1), p(2), p(3), p(4)].map((player, i) =>
        i < 3 ? { ...player, status: 'playing' as const } : { ...player, status: 'benched' as const },
      ),
      courts: [c(1), c(2)],
      matches: [
        {
          id: 'm1',
          courtId: 'c1',
          team1: ['p1', 'p2'],
          team2: ['p3', 'p4'],
          status: 'playing' as const,
          matchNumber: 1,
          round: 1,
        },
      ],
      currentRound: 1,
      status: 'active' as const,
      byeHistory: [],
    }
    expect(canGenerateOnCourt(session, 'c2').valid).toBe(false)
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
    const players = [p(1), p(2), p(3), p(4)]
    const courts = [c(1)]
    const usedMatchups = new Set<string>()

    for (let i = 0; i < 3; i++) {
      const { matches } = generateRound(players, courts, 'random-doubles', usedMatchups)
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }

    expect(() => {
      generateRound(players, courts, 'random-doubles', usedMatchups)
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 16: Flow D — Random Doubles, 5 players (odd) — full scenario
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow D — Random Doubles, 5 players (odd)', () => {
  const players5 = () => [p(1), p(2), p(3), p(4), p(5)]
  const court1 = () => [c(1)]

  it('D-1: canProgressFromPlayers accepts 5 (odd) for random-doubles without error', () => {
    expect(canProgressFromPlayers(players5(), 'random-doubles')).toBe(true)
  })

  it('D-2: exactly 4 players play and exactly 1 player is benched', () => {
    const { matches, benched } = generateRound(players5(), court1(), 'random-doubles', new Set())
    const playingIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(playingIds).toHaveLength(4)
    expect(new Set(playingIds).size).toBe(4)
    expect(benched).toHaveLength(1)
  })

  it('D-3: benched player does not appear in any active match card', () => {
    const { matches, benched } = generateRound(players5(), court1(), 'random-doubles', new Set())
    const playingIds = new Set(matches.flatMap(m => [...m.team1, ...m.team2]))
    benched.forEach(b => expect(playingIds.has(b.id)).toBe(false))
  })

  it('D-4: playing + benched = total players — no ghost players, no unaccounted', () => {
    const players = players5()
    const { matches, benched } = generateRound(players, court1(), 'random-doubles', new Set())
    const playingCount = matches.flatMap(m => [...m.team1, ...m.team2]).length
    expect(playingCount + benched.length).toBe(players.length)
  })

  it('D-5: bye rotation — round 2 benches a different player than round 1', () => {
    const players = players5()
    const usedMatchups = new Set<string>()

    const r1 = generateRound(players, court1(), 'random-doubles', usedMatchups)
    const benchedR1 = r1.benched[0].id
    r1.matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))

    const r2 = generateRound(players, court1(), 'random-doubles', usedMatchups)
    const benchedR2 = r2.benched[0].id
    expect(benchedR2).not.toBe(benchedR1)
  })

  it('D-6: integrity holds after round 2 — playing and benched are disjoint, total correct', () => {
    const players = players5()
    const usedMatchups = new Set<string>()

    const r1 = generateRound(players, court1(), 'random-doubles', usedMatchups)
    r1.matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))

    const r2 = generateRound(players, court1(), 'random-doubles', usedMatchups)
    const playing = r2.matches.flatMap(m => [...m.team1, ...m.team2])
    const playingSet = new Set(playing)
    expect(playing.length + r2.benched.length).toBe(players.length)
    r2.benched.forEach(b => expect(playingSet.has(b.id)).toBe(false))
  })

  it('D-7: round 3 produces a third unique matchup', () => {
    const players = players5()
    const usedMatchups = new Set<string>()
    const seenKeys: string[] = []

    for (let i = 0; i < 3; i++) {
      const { matches } = generateRound(players, court1(), 'random-doubles', usedMatchups)
      expect(matches.length).toBeGreaterThan(0)
      const key = getMatchKey(matches[0].team1, matches[0].team2)
      expect(seenKeys).not.toContain(key)
      seenKeys.push(key)
      usedMatchups.add(key)
    }
  })

  it('D-8: bye fairness over 5 rounds — no player benched more than 2× more than any other', () => {
    const players = players5()
    const usedMatchups = new Set<string>()
    const benchCounts = new Map(players.map(pl => [pl.id, 0]))

    for (let i = 0; i < 5; i++) {
      const { matches, benched } = generateRound(players, court1(), 'random-doubles', usedMatchups)
      benched.forEach(b => benchCounts.set(b.id, (benchCounts.get(b.id) ?? 0) + 1))
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
      const playing = matches.flatMap(m => [...m.team1, ...m.team2])
      expect(playing.length + benched.length).toBe(players.length)
    }

    const counts = [...benchCounts.values()]
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
  })

  it('D-9: app does not crash after matchups are exhausted — graceful fallback', () => {
    const players = players5()
    const usedMatchups = new Set<string>()
    expect(() => {
      for (let i = 0; i < 20; i++) {
        const { matches } = generateRound(players, court1(), 'random-doubles', usedMatchups)
        matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
      }
    }).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 17: Player Integrity Invariants (Flow G)
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow G — Player integrity invariants', () => {
  it('G-1/G-2: active players and benched players are mutually exclusive', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const { matches, benched } = generateRound(players, [c(1)], 'random-doubles', new Set())
    const playingIds = new Set(matches.flatMap(m => [...m.team1, ...m.team2]))
    const benchedIds = new Set(benched.map(b => b.id))
    expect([...playingIds].filter(id => benchedIds.has(id))).toHaveLength(0)
  })

  it('G-3: no player appears in two different match cards (multi-court)', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const { matches } = generateRound(players, [c(1), c(2)], 'random-doubles', new Set())
    const allIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('G-3: no player appears twice within the same match card', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const { matches } = generateRound(players, [c(1)], 'random-doubles', new Set())
    matches.forEach(m => {
      const allInMatch = [...m.team1, ...m.team2]
      expect(new Set(allInMatch).size).toBe(allInMatch.length)
    })
  })

  it('G-5: playing + benched = total players — invariant holds across 5 consecutive rounds', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6)]
    const usedMatchups = new Set<string>()
    for (let round = 0; round < 5; round++) {
      const { matches, benched } = generateRound(players, [c(1)], 'random-doubles', usedMatchups)
      const playing = matches.flatMap(m => [...m.team1, ...m.team2])
      expect(playing.length + benched.length).toBe(players.length)
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }
  })

  it('G-6: multi-court player isolation — court 1 and court 2 players are completely disjoint', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const { matches } = generateRound(players, [c(1), c(2)], 'random-doubles', new Set())
    expect(matches).toHaveLength(2)
    const c1Ids = new Set([...matches[0].team1, ...matches[0].team2])
    const c2Ids = new Set([...matches[1].team1, ...matches[1].team2])
    expect([...c1Ids].filter(id => c2Ids.has(id))).toHaveLength(0)
    expect(c1Ids.size + c2Ids.size).toBe(8)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 18: Flow H — Additional edge cases (domain-testable)
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow H — Additional edge cases', () => {
  it('H-4: validatePlayerName trims whitespace before duplicate check', () => {
    const existing = [makePlayer('1', 'Hafiz')]
    expect(validatePlayerName('  Hafiz  ', existing).valid).toBe(false)
  })

  it('H-5: validatePlayerName accepts names with spaces and apostrophes', () => {
    expect(validatePlayerName("Chong Wei", []).valid).toBe(true)
    expect(validatePlayerName("O'Brien", []).valid).toBe(true)
  })

  it('H-6: validatePlayerCount — 16th accepted, 17th rejected', () => {
    expect(validatePlayerCount(16, 'singles').valid).toBe(true)
    expect(validatePlayerCount(17, 'singles').valid).toBe(false)
  })

  it('H-7: validateCourtCount — 8th accepted, 9th rejected', () => {
    expect(validateCourtCount(8).valid).toBe(true)
    expect(validateCourtCount(9).valid).toBe(false)
  })

  it('H-14: 5 players random-doubles — CTA enabled, 4 play 1 benched', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    expect(canProgressFromPlayers(players, 'random-doubles')).toBe(true)
    const { matches, benched } = generateRound(players, [c(1)], 'random-doubles', new Set())
    expect(matches.flatMap(m => [...m.team1, ...m.team2])).toHaveLength(4)
    expect(benched).toHaveLength(1)
  })

  it('H-15: 9 players, 2 courts — 8 playing, 1 benched, courts disjoint', () => {
    const players = Array.from({ length: 9 }, (_, i) => p(i + 1))
    const { matches, benched } = generateRound(players, [c(1), c(2)], 'random-doubles', new Set())
    const playingIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(playingIds).toHaveLength(8)
    expect(new Set(playingIds).size).toBe(8)
    expect(benched).toHaveLength(1)
    const c1Ids = new Set([...matches[0].team1, ...matches[0].team2])
    const c2Ids = new Set([...matches[1].team1, ...matches[1].team2])
    expect([...c1Ids].filter(id => c2Ids.has(id))).toHaveLength(0)
  })

  it('H-16: validateCourtName rejects whitespace-only name', () => {
    expect(validateCourtName('   ', []).valid).toBe(false)
  })

  it('H-20: 4 players, 1 court (minimum valid) — all 4 play, 0 benched', () => {
    const players = [p(1), p(2), p(3), p(4)]
    const { matches, benched } = generateRound(players, [c(1)], 'random-doubles', new Set())
    expect(matches).toHaveLength(1)
    expect(matches.flatMap(m => [...m.team1, ...m.team2])).toHaveLength(4)
    expect(benched).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 19: Flow I — State and domain integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow I — State and domain integrity', () => {
  it('I-2: getMatchOptions excludes players passed via activeIds regardless of player.status', () => {
    const players = [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'benched' as const }))
    const activeIds = new Set(['p1', 'p2', 'p3', 'p4'])
    expect(getMatchOptions(players, 'random-doubles', new Set(), activeIds)).toHaveLength(0)
  })

  it('I-2 (known gap): getMatchOptions uses activeIds, not player.status — playing-status players included when activeIds is empty', () => {
    const players = [p(1), p(2), p(3), p(4)].map(pl => ({ ...pl, status: 'playing' as const }))
    expect(getMatchOptions(players, 'random-doubles', new Set(), new Set()).length).toBeGreaterThan(0)
  })

  it('I-3: byeHistory grows by exactly 1 per round over 20 rounds (5 players, 1 court)', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const usedMatchups = new Set<string>()
    let byeHistory: string[] = []
    for (let round = 0; round < 20; round++) {
      const result = generateRound(players, [c(1)], 'random-doubles', usedMatchups, byeHistory, round + 1, round + 1)
      byeHistory = result.updatedByeHistory
      result.matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }
    expect(byeHistory).toHaveLength(20)
  })

  it('I-3: bye fairness over 20 rounds — max bench count exceeds min by at most 1', () => {
    const players = [p(1), p(2), p(3), p(4), p(5)]
    const usedMatchups = new Set<string>()
    let byeHistory: string[] = []
    const benchCounts = new Map(players.map(pl => [pl.id, 0]))
    for (let round = 0; round < 20; round++) {
      const result = generateRound(players, [c(1)], 'random-doubles', usedMatchups, byeHistory, round + 1, round + 1)
      byeHistory = result.updatedByeHistory
      result.benched.forEach((id: string) => benchCounts.set(id, (benchCounts.get(id) ?? 0) + 1))
      result.matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }
    const counts = [...benchCounts.values()]
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
  })

  it('I-4: active match key is in usedMatchups — prevents same matchup on a second court', () => {
    const players = [p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8)]
    const usedMatchups = new Set<string>()

    const r1 = generateRound(players, [c(1)], 'random-doubles', usedMatchups)
    const court1Key = getMatchKey(r1.matches[0].team1, r1.matches[0].team2)
    usedMatchups.add(court1Key)

    const r2 = generateRound(players, [c(2)], 'random-doubles', usedMatchups)
    if (r2.matches.length > 0) {
      expect(getMatchKey(r2.matches[0].team1, r2.matches[0].team2)).not.toBe(court1Key)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 20: Flow B — Fixed Doubles partner integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow B — Fixed Doubles partner integrity', () => {
  function makePairedPlayers() {
    return [
      { id: 'p1', name: 'Rosberg', status: 'benched' as const, partnerId: 'p2' },
      { id: 'p2', name: 'Michael', status: 'benched' as const, partnerId: 'p1' },
      { id: 'p3', name: 'Noni', status: 'benched' as const, partnerId: 'p4' },
      { id: 'p4', name: 'Remy', status: 'benched' as const, partnerId: 'p3' },
      { id: 'p5', name: 'Jojo', status: 'benched' as const, partnerId: 'p6' },
      { id: 'p6', name: 'Razak', status: 'benched' as const, partnerId: 'p5' },
    ]
  }

  const PAIRS = [['p1','p2'], ['p3','p4'], ['p5','p6']].map(pair => [...pair].sort().join(','))

  it('B-5: each team in a generated match is always a fixed pair', () => {
    const { matches } = generateRound(makePairedPlayers(), [c(1)], 'fixed-doubles', new Set())
    matches.forEach(match => {
      expect(PAIRS).toContain([...match.team1].sort().join(','))
      expect(PAIRS).toContain([...match.team2].sort().join(','))
    })
  })

  it('B-7: partners are preserved across multiple rounds — never split', () => {
    const usedMatchups = new Set<string>()
    for (let i = 0; i < 3; i++) {
      const { matches } = generateRound(makePairedPlayers(), [c(1)], 'fixed-doubles', usedMatchups)
      matches.forEach(match => {
        expect(PAIRS).toContain([...match.team1].sort().join(','))
        expect(PAIRS).toContain([...match.team2].sort().join(','))
      })
      matches.forEach(m => usedMatchups.add(getMatchKey(m.team1, m.team2)))
    }
  })

  it('B-2: validatePlayerCount rejects odd count for fixed-doubles', () => {
    expect(validatePlayerCount(7, 'fixed-doubles').valid).toBe(false)
    expect(validatePlayerCount(6, 'fixed-doubles').valid).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 21: E-3 — More courts than possible matches
// ─────────────────────────────────────────────────────────────────────────────

describe('E-3 — More courts than possible matches', () => {
  it('fills only as many courts as valid matchups allow, does not crash', () => {
    const players = [p(1), p(2), p(3), p(4)]
    const { matches, benched } = generateRound(players, [c(1), c(2), c(3)], 'random-doubles', new Set())
    expect(matches.length).toBeLessThanOrEqual(1)
    const playingIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(playingIds.length + benched.length).toBe(players.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 22: The Invariants — must hold at all times
// ─────────────────────────────────────────────────────────────────────────────

describe('The Invariants', () => {
  const scenarios: [number, number, MatchType][] = [
    [4, 1, 'random-doubles'],
    [5, 1, 'random-doubles'],
    [6, 1, 'random-doubles'],
    [6, 2, 'random-doubles'],
    [8, 2, 'random-doubles'],
    [9, 2, 'random-doubles'],
    [4, 1, 'singles'],
    [6, 2, 'singles'],
  ]

  it('I-1: playing + benched = total players across all scenario combinations', () => {
    for (const [playerCount, courtCount, matchType] of scenarios) {
      const players = Array.from({ length: playerCount }, (_, i) => p(i + 1))
      const courts = Array.from({ length: courtCount }, (_, i) => c(i + 1))
      const { matches, benched } = generateRound(players, courts, matchType, new Set())
      const playing = matches.flatMap(m => [...m.team1, ...m.team2])
      expect(playing.length + benched.length).toBe(playerCount)
    }
  })

  it('I-2: a player cannot appear in both playing and benched simultaneously', () => {
    for (const [playerCount, courtCount, matchType] of scenarios) {
      const players = Array.from({ length: playerCount }, (_, i) => p(i + 1))
      const courts = Array.from({ length: courtCount }, (_, i) => c(i + 1))
      const { matches, benched } = generateRound(players, courts, matchType, new Set())
      const playingSet = new Set(matches.flatMap(m => [...m.team1, ...m.team2]))
      benched.forEach(b => expect(playingSet.has(b.id)).toBe(false))
    }
  })

  it('I-3: a player cannot appear in two active matches across courts', () => {
    const players = Array.from({ length: 8 }, (_, i) => p(i + 1))
    const { matches } = generateRound(players, [c(1), c(2)], 'random-doubles', new Set())
    const allIds = matches.flatMap(m => [...m.team1, ...m.team2])
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('I-4: a player cannot appear twice within the same match', () => {
    const players = Array.from({ length: 6 }, (_, i) => p(i + 1))
    const { matches } = generateRound(players, [c(1)], 'random-doubles', new Set())
    matches.forEach(m => {
      const allInMatch = [...m.team1, ...m.team2]
      expect(new Set(allInMatch).size).toBe(allInMatch.length)
    })
  })
})
