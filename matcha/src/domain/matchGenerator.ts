import { Player, Court, Match, MatchType } from '../types'

export function generateMatchKey(team1: string[], team2: string[]): string {
  const sorted = [...team1, ...team2].sort()
  return sorted.join('|')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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
  // Generate all possible pairs first
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairs.push([ids[i], ids[j]])
    }
  }
  // For each pair, combine with all non-overlapping pairs
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const p1 = pairs[i]
      const p2 = pairs[j]
      // Ensure no player overlap
      const allIds = new Set([...p1, ...p2])
      if (allIds.size === 4) {
        matchups.push([[p1[0], p1[1]], [p2[0], p2[1]]])
      }
    }
  }
  return matchups
}

function generateFixedDoublesMatchups(players: Player[]): [string[], string[]][] {
  // Build pairs from partnerId
  const paired = new Set<string>()
  const pairs: [string, string][] = []
  for (const player of players) {
    if (player.partnerId && !paired.has(player.id)) {
      pairs.push([player.id, player.partnerId])
      paired.add(player.id)
      paired.add(player.partnerId)
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

export function generateRound(
  players: Player[],
  courts: Court[],
  matchType: MatchType,
  usedMatchups: Set<string>,
  byeHistory: string[],
  currentRound: number,
  currentMatchNumber: number
): { matches: Match[], benched: string[], updatedByeHistory: string[] } {
  const availableCourts = courts.filter(c => c.status === 'empty')
  if (availableCourts.length === 0) {
    return { matches: [], benched: players.map(p => p.id), updatedByeHistory: byeHistory }
  }

  // Generate all valid matchups
  let allMatchups: [string[], string[]][] = []
  if (matchType === 'singles') {
    allMatchups = generateSinglesMatchups(players)
  } else if (matchType === 'random-doubles') {
    allMatchups = generateRandomDoublesMatchups(players)
  } else if (matchType === 'fixed-doubles') {
    allMatchups = generateFixedDoublesMatchups(players)
  }

  // Filter out already used matchups
  const freshMatchups = allMatchups.filter(([t1, t2]) => {
    const key = generateMatchKey(t1, t2)
    return !usedMatchups.has(key)
  })

  // If all matchups exhausted, reuse all
  const candidateMatchups = freshMatchups.length > 0 ? freshMatchups : allMatchups

  // Shuffle for variety
  const shuffled = shuffle(candidateMatchups)

  // Greedily assign matchups to courts
  const matches: Match[] = []
  const usedPlayerIds = new Set<string>()
  let matchNum = currentMatchNumber

  for (const court of availableCourts) {
    if (shuffled.length === 0) break
    // Find first matchup where no player is used
    const idx = shuffled.findIndex(([t1, t2]) => {
      const allP = [...t1, ...t2]
      return allP.every(id => !usedPlayerIds.has(id))
    })
    if (idx === -1) break
    const [team1, team2] = shuffled.splice(idx, 1)[0]
    ;[...team1, ...team2].forEach(id => usedPlayerIds.add(id))
    matches.push({
      id: crypto.randomUUID(),
      courtId: court.id,
      team1,
      team2,
      status: 'playing',
      matchNumber: matchNum++,
      round: currentRound,
    })
  }

  // Determine benched players
  const playingIds = new Set(matches.flatMap(m => [...m.team1, ...m.team2]))
  const benched = players.map(p => p.id).filter(id => !playingIds.has(id))

  // Update byeHistory fairly: track who sat out
  // Players who sat out get added to byeHistory. Sort by least byes first
  const updatedByeHistory = [...byeHistory, ...benched]

  return { matches, benched, updatedByeHistory }
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
  // Only consider players not currently playing
  const availablePlayers = players.filter(p => !activePlayerIds.has(p.id))

  let allMatchups: [string[], string[]][] = []
  if (matchType === 'singles') {
    allMatchups = generateSinglesMatchups(availablePlayers)
  } else if (matchType === 'random-doubles') {
    allMatchups = generateRandomDoublesMatchups(availablePlayers)
  } else if (matchType === 'fixed-doubles') {
    allMatchups = generateFixedDoublesMatchups(availablePlayers)
  }

  const freshMatchups = allMatchups.filter(([t1, t2]) => {
    const key = generateMatchKey(t1, t2)
    return !usedMatchups.has(key)
  })

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
