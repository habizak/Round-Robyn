import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession, getPlayerName, getCompletedMatches, getBenchedPlayers } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Modal } from '../components/Modal'
import type { Match as MatchType, Player } from '../types'

export function Match() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterPlayerId, setFilterPlayerId] = useState<string | null>(null)

  const tab = searchParams.get('tab') === 'history' ? 'history' : 'match'

  function setTab(t: 'match' | 'history') {
    if (t === 'history') {
      setSearchParams({ tab: 'history' })
    } else {
      setSearchParams({})
    }
  }

  const activeCourts = session.courts
  const emptyCourtsCount = activeCourts.filter(c => c.status === 'empty').length
  const allOccupied = activeCourts.every(c => c.status === 'occupied')

  const activeMatches = session.matches.filter(m => m.status === 'playing')
  const completedMatches = getCompletedMatches(session)
  const benchedPlayers = getBenchedPlayers(session)

  function getMatchForCourt(courtId: string): MatchType | undefined {
    return activeMatches.find(m => m.courtId === courtId)
  }

  function handleGenerateForCourt(courtId: string) {
    dispatch({ type: 'GENERATE_NEXT_MATCH', courtId })
  }

  function handleAddScore(matchId: string) {
    navigate(`/match/score/${matchId}/winner`)
  }

  function handleEndSession() {
    dispatch({ type: 'END_SESSION' })
    navigate('/')
  }

  const filteredCompleted = filterPlayerId
    ? completedMatches.filter(
        m => m.team1.includes(filterPlayerId) || m.team2.includes(filterPlayerId)
      )
    : completedMatches

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '24px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          Matcha
        </h1>
        <button
          onClick={() => setShowEndConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: '20px',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '4px',
          }}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '20px',
        }}
      >
        {(['match', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              fontWeight: tab === t ? 700 : 500,
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
              color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              marginBottom: '-1px',
            }}
          >
            {t === 'match' ? 'Match' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'match' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Available courts count */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge accent={emptyCourtsCount > 0}>{emptyCourtsCount} available</Badge>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              courts
            </span>
          </div>

          {/* Court cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeCourts.map(court => {
              const match = getMatchForCourt(court.id)
              if (match) {
                // Active match
                const team1Names = match.team1.map(id => getPlayerName(session, id)).join(' & ')
                const team2Names = match.team2.map(id => getPlayerName(session, id)).join(' & ')
                return (
                  <Card key={court.id} dark>
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          color: '#8C8880',
                          display: 'block',
                          marginBottom: '2px',
                        }}
                      >
                        {court.name} · Match #{match.matchNumber}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#F5F2EC',
                        }}
                      >
                        {team1Names}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          color: '#8C8880',
                          margin: '0 8px',
                        }}
                      >
                        vs
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#F5F2EC',
                        }}
                      >
                        {team2Names}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => handleAddScore(match.id)}
                    >
                      + Add Score
                    </Button>
                  </Card>
                )
              } else {
                // Empty court
                return (
                  <Card key={court.id} dashed>
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {court.name}
                      </span>
                    </div>
                    {allOccupied ? (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Waiting for a court to free up
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleGenerateForCourt(court.id)}
                      >
                        + Generate Match
                      </Button>
                    )}
                  </Card>
                )
              }
            })}
          </div>

          {/* Benched players */}
          {benchedPlayers.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Benched
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {benchedPlayers.map((p: Player) => (
                  <Badge key={p.id}>{p.name}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* End Game */}
          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <Button variant="secondary" fullWidth onClick={() => setShowEndConfirm(true)}>
              End Game
            </Button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {completedMatches.length} matches completed
            </span>
            <Button variant="ghost" onClick={() => setFilterModalOpen(true)}>
              Filter
            </Button>
          </div>

          {filterPlayerId && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <Badge accent>
                {getPlayerName(session, filterPlayerId)}
              </Badge>
              <button
                onClick={() => setFilterPlayerId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                }}
              >
                × clear
              </button>
            </div>
          )}

          {filteredCompleted.length === 0 ? (
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                paddingTop: '48px',
              }}
            >
              No matches completed yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...filteredCompleted].reverse().map(m => {
                const team1Names = m.team1.map(id => getPlayerName(session, id)).join(' & ')
                const team2Names = m.team2.map(id => getPlayerName(session, id)).join(' & ')
                const courtName = session.courts.find(c => c.id === m.courtId)?.name ?? 'Court'
                const winnerIds = m.score?.winnerId ?? []
                const team1Won = m.team1.some(id => winnerIds.includes(id))
                const team1Score = team1Won ? session.winningPoint : (m.score?.team2Points ?? 0)
                const team2Score = team1Won ? (m.score?.team1Points ?? 0) : session.winningPoint

                return (
                  <Card key={m.id} dark>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px',
                          color: '#8C8880',
                        }}
                      >
                        {courtName} · Match #{m.matchNumber}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: team1Won ? 700 : 400,
                          color: team1Won ? '#1F9E78' : '#8C8880',
                        }}
                      >
                        {team1Names}
                      </span>
                      <span style={{ color: '#8C8880', margin: '0 8px' }}>vs</span>
                      <span
                        style={{
                          fontWeight: !team1Won ? 700 : 400,
                          color: !team1Won ? '#1F9E78' : '#8C8880',
                        }}
                      >
                        {team2Names}
                      </span>
                    </div>
                    {m.score && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '13px',
                          color: '#F5F2EC',
                          fontWeight: 700,
                        }}
                      >
                        {team1Score} – {team2Score}
                      </span>
                    )}
                    {!m.score && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '12px',
                          color: '#8C8880',
                        }}
                      >
                        No score recorded
                      </span>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* End confirm modal */}
      <Modal
        open={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        title="End Game"
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginBottom: '20px',
          }}
        >
          Are you sure you want to end the current session? All match data will be cleared.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setShowEndConfirm(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </Modal>

      {/* Filter modal */}
      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filter by Player"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {session.players.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setFilterPlayerId(p.id)
                setFilterModalOpen(false)
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                padding: '10px 12px',
                background: filterPlayerId === p.id ? '#1F9E78' : 'var(--color-bg)',
                color: filterPlayerId === p.id ? '#F5F2EC' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 0,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
