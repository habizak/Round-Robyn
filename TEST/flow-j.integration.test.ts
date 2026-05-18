/**
 * Flow J — Mixed mode session integration (automated walkthrough of matcha-flow-tests.md J-5–J-11).
 * UI steps J-0–J-4 are covered by manual QA + MatchType/Players unit tests.
 */
import { describe, it, expect } from 'vitest'
import { sessionReducer } from '../src/hooks/useSession'
import type { Session, Player, Court } from '../src/types'

function p(id: string, name: string): Player {
  return { id, name, status: 'benched' }
}

function court(id: string, name: string): Court {
  return { id, name, status: 'empty' }
}

function setupMixedSession(): Session {
  let session: Session = {
    id: 'flow-j',
    mode: 'mixed',
    matchType: 'singles',
    winningPoint: 11,
    players: [
      p('hafiz', 'Hafiz'),
      p('razak', 'Razak'),
      p('jojo', 'Jojo'),
      p('khairi', 'Khairi'),
      p('noni', 'Noni'),
      p('remy', 'Remy'),
    ],
    courts: [court('c1', 'Court 1'), court('c2', 'Court 2')],
    matches: [],
    currentRound: 1,
    status: 'setup',
    byeHistory: [],
  }
  session = sessionReducer(session, { type: 'START_SESSION' })
  return session
}

describe('Flow J — Mixed mode integration', () => {
  it('J-5: START_SESSION leaves all courts empty and all players benched', () => {
    const session = setupMixedSession()
    expect(session.status).toBe('active')
    expect(session.matches).toHaveLength(0)
    expect(session.players.every(pl => pl.status === 'benched')).toBe(true)
    expect(session.courts.every(c => c.status === 'empty')).toBe(true)
  })

  it('J-7: Court 1 doubles assigns 4 playing, 2 benched, matchType random-doubles', () => {
    let session = setupMixedSession()
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c1',
      team1: ['hafiz', 'razak'],
      team2: ['jojo', 'khairi'],
      matchType: 'random-doubles',
    })
    expect(session.matches).toHaveLength(1)
    expect(session.matches[0].matchType).toBe('random-doubles')
    expect(session.players.filter(pl => pl.status === 'playing')).toHaveLength(4)
    expect(session.players.filter(pl => pl.status === 'benched')).toHaveLength(2)
    const playing = new Set(session.players.filter(pl => pl.status === 'playing').map(pl => pl.id))
    const benched = new Set(session.players.filter(pl => pl.status === 'benched').map(pl => pl.id))
    expect([...playing].filter(id => benched.has(id))).toHaveLength(0)
  })

  it('J-10: Court 2 singles uses remaining benched only', () => {
    let session = setupMixedSession()
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c1',
      team1: ['hafiz', 'razak'],
      team2: ['jojo', 'khairi'],
      matchType: 'random-doubles',
    })
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c2',
      team1: ['noni'],
      team2: ['remy'],
      matchType: 'singles',
    })
    expect(session.matches).toHaveLength(2)
    expect(session.matches[1].matchType).toBe('singles')
    expect(session.players.filter(pl => pl.status === 'benched')).toHaveLength(0)
    expect(session.players.filter(pl => pl.status === 'playing')).toHaveLength(6)
  })

  it('J-11: no player appears on both courts', () => {
    let session = setupMixedSession()
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c1',
      team1: ['hafiz', 'razak'],
      team2: ['jojo', 'khairi'],
      matchType: 'random-doubles',
    })
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c2',
      team1: ['noni'],
      team2: ['remy'],
      matchType: 'singles',
    })
    const m1Ids = new Set([...session.matches[0].team1, ...session.matches[0].team2])
    const m2Ids = new Set([...session.matches[1].team1, ...session.matches[1].team2])
    expect([...m1Ids].filter(id => m2Ids.has(id))).toHaveLength(0)
  })

  it('J-12: completing court 1 frees 4 players to bench', () => {
    let session = setupMixedSession()
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c1',
      team1: ['hafiz', 'razak'],
      team2: ['jojo', 'khairi'],
      matchType: 'random-doubles',
    })
    session = sessionReducer(session, {
      type: 'ASSIGN_MATCH',
      courtId: 'c2',
      team1: ['noni'],
      team2: ['remy'],
      matchType: 'singles',
    })
    const matchId = session.matches[0].id
    session = sessionReducer(session, {
      type: 'COMPLETE_MATCH',
      matchId,
      score: {
        winnerId: ['hafiz', 'razak'],
        team1Points: 11,
        team2Points: 5,
      },
    })
    expect(session.players.filter(pl => pl.status === 'benched')).toHaveLength(4)
    expect(session.players.filter(pl => pl.status === 'playing')).toHaveLength(2)
    expect(session.courts.find(c => c.id === 'c1')?.status).toBe('empty')
  })
})
