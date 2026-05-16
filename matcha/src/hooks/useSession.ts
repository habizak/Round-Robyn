import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  createElement,
} from 'react'
import { Session, MatchType, Player, Court, Match, Score } from '../types'
import { loadSession, saveSession, clearSession } from '../infrastructure/storage'
import { generateRound, generateMatchKey, generateSingleMatch } from '../domain/matchGenerator'

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_MATCH_TYPE'; matchType: MatchType }
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'SET_PARTNER'; playerId: string; partnerId: string }
  | { type: 'SET_WINNING_POINT'; points: number }
  | { type: 'ADD_COURT'; name: string }
  | { type: 'REMOVE_COURT'; id: string }
  | { type: 'START_SESSION' }
  | { type: 'COMPLETE_MATCH'; matchId: string; score: Score }
  | { type: 'GENERATE_NEXT_MATCH'; courtId: string }
  | { type: 'END_SESSION' }
  | { type: 'LOAD_SESSION'; session: Session }

// ─── Initial state ───────────────────────────────────────────────────────────

const initialSession: Session = {
  id: crypto.randomUUID(),
  matchType: 'singles',
  winningPoint: 21,
  players: [],
  courts: [],
  matches: [],
  currentRound: 1,
  status: 'setup',
  byeHistory: [],
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function getUsedMatchups(matches: Match[]): Set<string> {
  const used = new Set<string>()
  for (const m of matches) {
    if (m.status === 'completed' || m.status === 'playing') {
      used.add(generateMatchKey(m.team1, m.team2))
    }
  }
  return used
}

function sessionReducer(state: Session, action: Action): Session {
  switch (action.type) {
    case 'LOAD_SESSION':
      return action.session

    case 'SET_MATCH_TYPE':
      return { ...state, matchType: action.matchType, players: [] }

    case 'ADD_PLAYER': {
      const id = crypto.randomUUID()
      const newPlayer: Player = { id, name: action.name, status: 'benched' }
      return { ...state, players: [...state.players, newPlayer] }
    }

    case 'REMOVE_PLAYER': {
      const players = state.players
        .filter(p => p.id !== action.id)
        .map(p => p.partnerId === action.id ? { ...p, partnerId: undefined } : p)
      return { ...state, players }
    }

    case 'SET_PARTNER': {
      const players = state.players.map(p => {
        if (p.id === action.playerId) return { ...p, partnerId: action.partnerId }
        if (p.id === action.partnerId) return { ...p, partnerId: action.playerId }
        // Clear if previously partnered with one of these
        if (p.partnerId === action.playerId || p.partnerId === action.partnerId) {
          return { ...p, partnerId: undefined }
        }
        return p
      })
      return { ...state, players }
    }

    case 'SET_WINNING_POINT':
      return { ...state, winningPoint: action.points }

    case 'ADD_COURT': {
      const id = crypto.randomUUID()
      const newCourt: Court = { id, name: action.name, status: 'empty' }
      return { ...state, courts: [...state.courts, newCourt] }
    }

    case 'REMOVE_COURT': {
      const courts = state.courts.filter(c => c.id !== action.id)
      return { ...state, courts }
    }

    case 'START_SESSION': {
      const usedMatchups = new Set<string>()
      const result = generateRound(
        state.players,
        state.courts,
        state.matchType,
        usedMatchups,
        state.byeHistory,
        1,
        1
      )

      // Update court statuses
      const playingCourtIds = new Set(result.matches.map(m => m.courtId))
      const courts = state.courts.map(c =>
        playingCourtIds.has(c.id) ? { ...c, status: 'occupied' as const } : c
      )

      // Update player statuses
      const playingPlayerIds = new Set(result.matches.flatMap(m => [...m.team1, ...m.team2]))
      const players = state.players.map(p => ({
        ...p,
        status: playingPlayerIds.has(p.id) ? 'playing' as const : 'benched' as const,
      }))

      return {
        ...state,
        status: 'active',
        courts,
        players,
        matches: result.matches,
        currentRound: 1,
        byeHistory: result.updatedByeHistory,
      }
    }

    case 'COMPLETE_MATCH': {
      const matches = state.matches.map(m =>
        m.id === action.matchId
          ? { ...m, status: 'completed' as const, score: action.score }
          : m
      )

      // Free the court
      const completedMatch = state.matches.find(m => m.id === action.matchId)
      let courts = state.courts
      if (completedMatch) {
        courts = state.courts.map(c =>
          c.id === completedMatch.courtId ? { ...c, status: 'empty' as const } : c
        )
      }

      // Update player statuses - players who were on this match are now benched
      let players = state.players
      if (completedMatch) {
        const freedPlayers = new Set([...completedMatch.team1, ...completedMatch.team2])
        players = state.players.map(p =>
          freedPlayers.has(p.id) ? { ...p, status: 'benched' as const } : p
        )
      }

      return { ...state, matches, courts, players }
    }

    case 'GENERATE_NEXT_MATCH': {
      const court = state.courts.find(c => c.id === action.courtId)
      if (!court || court.status !== 'empty') return state

      // Players currently playing
      const activePlayerIds = new Set(
        state.matches
          .filter(m => m.status === 'playing')
          .flatMap(m => [...m.team1, ...m.team2])
      )

      const usedMatchups = getUsedMatchups(state.matches)
      const matchNumber = state.matches.length + 1

      const newMatch = generateSingleMatch(
        state.players,
        court,
        state.matchType,
        usedMatchups,
        activePlayerIds,
        state.currentRound,
        matchNumber
      )

      if (!newMatch) return state

      const courts = state.courts.map(c =>
        c.id === action.courtId ? { ...c, status: 'occupied' as const } : c
      )

      const playingIds = new Set([...newMatch.team1, ...newMatch.team2])
      const players = state.players.map(p =>
        playingIds.has(p.id) ? { ...p, status: 'playing' as const } : p
      )

      return {
        ...state,
        courts,
        players,
        matches: [...state.matches, newMatch],
        byeHistory: [...state.byeHistory, ...state.players.filter(p => !playingIds.has(p.id) && !activePlayerIds.has(p.id)).map(p => p.id)],
      }
    }

    case 'END_SESSION':
      return { ...initialSession, id: crypto.randomUUID() }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

type SessionContextType = {
  session: Session
  dispatch: (action: Action) => void
}

const SessionContext = createContext<SessionContextType | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const saved = loadSession()
  const [session, dispatch] = useReducer(sessionReducer, saved ?? initialSession)

  useEffect(() => {
    if (session.status === 'setup' && session.players.length === 0 && session.matches.length === 0) {
      clearSession()
    } else {
      saveSession(session)
    }
  }, [session])

  return createElement(
    SessionContext.Provider,
    { value: { session, dispatch } },
    children
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(): SessionContextType {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

// ─── Selectors ───────────────────────────────────────────────────────────────

export function getPlayerName(session: Session, id: string): string {
  return session.players.find(p => p.id === id)?.name ?? id
}

export function getActiveMatches(session: Session): Match[] {
  return session.matches.filter(m => m.status === 'playing')
}

export function getCompletedMatches(session: Session): Match[] {
  return session.matches.filter(m => m.status === 'completed')
}

export function getBenchedPlayers(session: Session): Player[] {
  return session.players.filter(p => p.status === 'benched')
}
