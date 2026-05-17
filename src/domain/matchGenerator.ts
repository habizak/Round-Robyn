import type { Player, Court, Match, MatchType } from '../types'

// ─── Utilities ───────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Public domain API (used by tests) ───────────────────────────────────────

/**
 * Returns all unique 2-player combinations (C(n,2)).
 */
export function getAllTeams(players: Player[]): [Player, Player][] {
  const teams: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push([players[i], players[j]])
    }
  }
  return teams
}

/**
 * Returns true when two teams share no players.
 */
export function areDisjoint(team1: Player[], team2: Player[]): boolean {
  const ids1 = new Set(team1.map(p => p.id))
  return !team2.some(p => ids1.has(p.id))
}

/**
 * Produces a canonical key for a matchup that is order-independent
 * (both team order and player order within a team), but DOES distinguish
 * different team groupings (e.g. {p1,p2} vs {p3,p4} ≠ {p1,p3} vs {p2,p4}).
 *
 * Algorithm:
 *   1. Sort each team's player IDs alphabetically.
 *   2. Sort the two sorted teams relative to each other.
 *   3. Join with '||' between teams and '|' within a team.
 */
export function getMatchKey(team1: string[], team2: string[]): string {
  const t1 = [...team1].sort()
  const t2 = [...team2].sort()
  // Canonical team order: lexicographically smaller team goes first
  const [first, second] = t1.join('|') <= t2.join('|') ? [t1, t2] : [t2, t1]
  return `${first.join('|')}||${second.join('|')}`
}

/**
 * Alias kept for internal use and backward compat.
 */
export function generateMatchKey(team1: string[], team2: string[]): string {
  return getMatchKey(team1, team2)
}

// ─── Internal matchup generators ─────────────────────────────────────────────

function generateSinglesMatchups(players: Player[]): [string[], string[]][] {
  const matchups: [string[], string[]][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matchups.push([[players[i].id], [players[j].id]])
    }
  }
  return matchups
}

function generateRandomDoublesMatchups(players: Player[]): [string[], string[]][] {
  if (players.length < 4) return []
  const matchups: [string[], string[]][] = []
  const ids = players.map(p => p.id)
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i], ids[j]])
    }
  }
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const p1 = pairs[i]
      const p2 = pairs[j]
      const allIds = new Set([...p1, ...p2])
      if (allIds.size === 4) {
        matchups.push([[p1[0], p1[1]], [p2[0], p2[1]]])
      }
    }
  }
  return matchups
}

function generateFixedDoublesMatchups(players: Player[]): [string[], string[]][] {
  const paired = new Set<string>()
  const pairs: [string, string][] = []
  for (const player of players) {
    if (player.partnerId && !paired.has(player.id)) {
      pairs.push([player.id, player.partnerId])
      paired.add(player.id)
      paired.add(player.partnerId)
    }
  }
  // If no partners set (e.g. in tests), pair players sequentially
  if (pairs.length === 0) {
    for (let i = 0; i + 1 < players.length; i += 2) {
      pairs.push([players[i].id, players[i + 1].id])
    }
  }
  const matchups: [string[], string[]][] = []
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      matchups.push([[pairs[i][0], pairs[i][1]], [pairs[j][0], pairs[j][1]]])
    }
  }
  return matchups
}

// ─── Count player appearances in usedMatchups ─────────────────────────────────

function countPlayCounts(players: Player[], usedMatchups: Set<string>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const p of players) counts.set(p.id, 0)
  for (const key of usedMatchups) {
    const ids = key.split('|')
    for (const id of ids) {
      if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}

// ─── generateRound (4-arg version for tests) ─────────────────────────────────

/**
 * Generates one round of matches.
 * Fair bye rotation: when some players must sit out, prefer to bench
 * the player(s) who have played the most (highest count in usedMatchups).
 */
export function generateRound(
  players: Player[],
  courts: Court[],
  matchType: MatchType,
  usedMatchups: Set<string>
): { matches: Match[]; benched: Player[] }

/**
 * Full internal version with bye history and round tracking.
 */
export function generateRound(
  players: Player[],
  courts: Court[],
  matchType: MatchType,
  usedMatchups: Set<string>,
  byeHistory: string[],
  currentRound: number,
  currentMatchNumber: number
): { matches: Match[]; benched: string[]; updatedByeHistory: string[] }

export function generateRound(
  players: Player[],
  courts: Court[],
  matchType: MatchType,
  usedMatchups: Set<string>,
  byeHistory?: string[],
  currentRound?: number,
  currentMatchNumber?: number
): { matches: Match[]; benched: Player[] } | { matches: Match[]; benched: string[]; updatedByeHistory: string[] } {
  const isSimpleCall = byeHistory === undefined

  // Determine which courts to use
  const availableCourts = courts.filter(c => c.status === 'empty')

  if (availableCourts.length === 0) {
    if (isSimpleCall) {
      return { matches: [], benched: [...players] }
    }
    return { matches: [], benched: players.map(p => p.id), updatedByeHistory: byeHistory! }
  }

  // For fair bye rotation in the simple API, determine preferred sitting-out order
  // by counting how many times each player appears in usedMatchups.
  // Players with MORE plays get priority to sit out (so less-played players get to play).
  const playCounts = countPlayCounts(players, usedMatchups)

  // Sort players: those with FEWER plays get priority to play (sit at front).
  // We'll assign tries in this order — players at the back are benched first when seats run out.
  const playersByPriority = [...players].sort((a, b) => {
    const ca = playCounts.get(a.id) ?? 0
    const cb = playCounts.get(b.id) ?? 0
    return ca - cb // ascending: fewer plays = higher priority to play
  })

  // Generate all valid matchups from the priority-sorted player list
  let allMatchups: [string[], string[]][] = []
  if (matchType === 'singles') {
    allMatchups = generateSinglesMatchups(playersByPriority)
  } else if (matchType === 'random-doubles') {
    allMatchups = generateRandomDoublesMatchups(playersByPriority)
  } else if (matchType === 'fixed-doubles') {
    allMatchups = generateFixedDoublesMatchups(playersByPriority)
  }

  // Filter out already-used matchups
  const freshMatchups = allMatchups.filter(([t1, t2]) => !usedMatchups.has(getMatchKey(t1, t2)))

  // Fall back to all matchups if exhausted
  const candidateMatchups = freshMatchups.length > 0 ? freshMatchups : allMatchups

  if (candidateMatchups.length === 0) {
    if (isSimpleCall) {
      return { matches: [], benched: [...players] }
    }
    return { matches: [], benched: players.map(p => p.id), updatedByeHistory: byeHistory! }
  }

  // Shuffle for variety while respecting priority
  const shuffled = shuffle(candidateMatchups)

  // Greedily assign matchups to courts.
  // Primary pass: no player reuse (ideal).
  // Fallback pass: allow player reuse when courts exceed unique-player capacity.
  const matches: Match[] = []
  const usedPlayerIds = new Set<string>()
  let matchNum = currentMatchNumber ?? 0
  const remainingCourts: Court[] = []

  for (const court of availableCourts) {
    if (shuffled.length === 0) break
    const idx = shuffled.findIndex(([t1, t2]) => {
      const allP = [...t1, ...t2]
      return allP.every(id => !usedPlayerIds.has(id))
    })
    if (idx === -1) {
      remainingCourts.push(court)
      continue
    }
    const [team1, team2] = shuffled.splice(idx, 1)[0]
    ;[...team1, ...team2].forEach(id => usedPlayerIds.add(id))
    matches.push({
      id: crypto.randomUUID(),
      courtId: court.id,
      team1,
      team2,
      status: 'playing',
      matchNumber: matchNum++,
      round: currentRound ?? 0,
    })
  }

  // Fallback: fill remaining courts allowing player reuse, but still respect play-count
  // fairness and never assign the same match key twice in a round.
  if (remainingCourts.length > 0 && (freshMatchups.length > 0 || allMatchups.length > 0)) {
    const pool = freshMatchups.length > 0 ? freshMatchups : allMatchups
    // Sort pool by total play-count of participants ascending (least-played first)
    const sortedPool = [...pool].sort((a, b) => {
      const sumA = [...a[0], ...a[1]].reduce((s, id) => s + (playCounts.get(id) ?? 0), 0)
      const sumB = [...b[0], ...b[1]].reduce((s, id) => s + (playCounts.get(id) ?? 0), 0)
      return sumA - sumB
    })
    const assignedMatchKeys = new Set(matches.map(m => getMatchKey(m.team1, m.team2)))

    for (const court of remainingCourts) {
      // Prefer matchups whose players are not already playing this round
      const idx = sortedPool.findIndex(([t1, t2]) => {
        const key = getMatchKey(t1, t2)
        if (assignedMatchKeys.has(key)) return false
        const allP = [...t1, ...t2]
        return allP.every(id => !usedPlayerIds.has(id))
      })
      // If no non-overlapping matchup exists, allow player reuse (same 4 players, new key)
      const fallbackIdx = idx !== -1 ? idx : sortedPool.findIndex(
        ([t1, t2]) => !assignedMatchKeys.has(getMatchKey(t1, t2))
      )
      if (fallbackIdx === -1) break
      const [team1, team2] = sortedPool.splice(fallbackIdx, 1)[0]
      assignedMatchKeys.add(getMatchKey(team1, team2))
      ;[...team1, ...team2].forEach(id => usedPlayerIds.add(id))
      matches.push({
        id: crypto.randomUUID(),
        courtId: court.id,
        team1,
        team2,
        status: 'playing',
        matchNumber: matchNum++,
        round: currentRound ?? 0,
      })
    }
  }

  // Determine benched players (those not in any match)
  const playingIds = new Set(matches.flatMap(m => [...m.team1, ...m.team2]))

  if (isSimpleCall) {
    const benched = players.filter(p => !playingIds.has(p.id))
    return { matches, benched }
  }

  // Legacy path: return string ids and updatedByeHistory
  const benchedIds = players.map(p => p.id).filter(id => !playingIds.has(id))
  const updatedByeHistory = [...byeHistory!, ...benchedIds]
  return { matches, benched: benchedIds, updatedByeHistory }
}

// ─── generateSingleMatch ─────────────────────────────────────────────────────

export type MatchOption = {
  team1: string[]
  team2: string[]
  key: string
}

function minPlayersForMatchType(matchType: MatchType): number {
  return matchType === 'singles' ? 2 : 4
}

function generateMatchupsForType(players: Player[], matchType: MatchType): [string[], string[]][] {
  if (matchType === 'singles') return generateSinglesMatchups(players)
  if (matchType === 'random-doubles') return generateRandomDoublesMatchups(players)
  return generateFixedDoublesMatchups(players)
}

function idsFromMatchKey(key: string): string[] {
  const parts = key.split('||')
  if (parts.length !== 2) return []
  return [...parts[0].split('|'), ...parts[1].split('|')].filter(Boolean)
}

function countPlayCountsFromKeys(players: Player[], usedMatchups: Set<string>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const p of players) counts.set(p.id, 0)
  for (const key of usedMatchups) {
    for (const id of idsFromMatchKey(key)) {
      if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}

function scoreMatchup(
  team1: string[],
  team2: string[],
  players: Player[],
  usedMatchups: Set<string>,
  playCounts: Map<string, number>,
): number {
  const ids = [...team1, ...team2]
  let score = 0
  for (const id of ids) {
    const player = players.find(p => p.id === id)
    if (player?.status === 'benched') score += 10
    score -= playCounts.get(id) ?? 0
  }
  if (!usedMatchups.has(getMatchKey(team1, team2))) score += 5
  return score
}

/**
 * Returns ranked match options for manual selection.
 * Only players not in an active match are eligible; benched players are prioritized.
 */
export function getMatchOptions(
  players: Player[],
  matchType: MatchType,
  usedMatchups: Set<string>,
  activePlayerIds: Set<string>,
  maxOptions = 4,
): MatchOption[] {
  const available = players.filter(p => !activePlayerIds.has(p.id))
  const minPlayers = minPlayersForMatchType(matchType)
  if (available.length < minPlayers) return []

  const allMatchups = generateMatchupsForType(available, matchType)
  if (allMatchups.length === 0) return []

  const playCounts = countPlayCountsFromKeys(players, usedMatchups)
  const scored = allMatchups.map(([team1, team2]) => ({
    team1,
    team2,
    key: getMatchKey(team1, team2),
    score: scoreMatchup(team1, team2, players, usedMatchups, playCounts),
  }))

  scored.sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const options: MatchOption[] = []
  for (const item of scored) {
    if (seen.has(item.key)) continue
    seen.add(item.key)
    options.push({ team1: item.team1, team2: item.team2, key: item.key })
    if (options.length >= maxOptions) break
  }

  return options
}

export function filterMatchOptions(
  options: MatchOption[],
  playerId: string | null,
): MatchOption[] {
  if (!playerId) return options
  return options.filter(
    o => o.team1.includes(playerId) || o.team2.includes(playerId),
  )
}

export function generateSingleMatch(
  players: Player[],
  court: Court,
  matchType: MatchType,
  usedMatchups: Set<string>,
  activePlayerIds: Set<string>,
  currentRound: number,
  matchNumber: number
): Match | null {
  const availablePlayers = players.filter(p => !activePlayerIds.has(p.id))

  let allMatchups: [string[], string[]][] = []
  if (matchType === 'singles') {
    allMatchups = generateSinglesMatchups(availablePlayers)
  } else if (matchType === 'random-doubles') {
    allMatchups = generateRandomDoublesMatchups(availablePlayers)
  } else if (matchType === 'fixed-doubles') {
    allMatchups = generateFixedDoublesMatchups(availablePlayers)
  }

  const freshMatchups = allMatchups.filter(([t1, t2]) => !usedMatchups.has(getMatchKey(t1, t2)))
  const candidateMatchups = freshMatchups.length > 0 ? freshMatchups : allMatchups
  if (candidateMatchups.length === 0) return null

  const shuffled = shuffle(candidateMatchups)
  const [team1, team2] = shuffled[0]

  return {
    id: crypto.randomUUID(),
    courtId: court.id,
    team1,
    team2,
    status: 'playing',
    matchNumber,
    round: currentRound,
  }
}
