export type MatchType = 'singles' | 'fixed-doubles' | 'random-doubles'

export type Player = {
  id: string
  name: string
  status: 'playing' | 'benched'
  partnerId?: string  // for fixed-doubles
}

export type Court = {
  id: string
  name: string
  status: 'empty' | 'occupied'
}

export type Score = {
  winnerId: string[]
  team1Points: number
  team2Points: number
}

export type Match = {
  id: string
  courtId: string
  team1: string[]
  team2: string[]
  status: 'pending' | 'playing' | 'completed'
  score?: Score
  matchNumber: number
  round: number
}

export type Session = {
  id: string
  matchType: MatchType
  winningPoint: number
  players: Player[]
  courts: Court[]
  matches: Match[]
  currentRound: number
  status: 'setup' | 'active' | 'ended'
  byeHistory: string[]  // player ids who have had byes, for fairness
}
