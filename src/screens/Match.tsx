import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession, getPlayerName, getCompletedMatches, getBenchedPlayers, getPlayerMatchCounts } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { canGenerateOnCourt } from '../domain/sessionRules'
import type { Match as MatchType, Player, Court } from '../types'

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
  const activeMatches = session.matches.filter(m => m.status === 'playing')
  const completedMatches = getCompletedMatches(session)
  const benchedPlayers = getBenchedPlayers(session)
  const matchCounts = getPlayerMatchCounts(session)
  const nextMatchNumber = session.matches.length + 1

  function getMatchForCourt(courtId: string): MatchType | undefined {
    return activeMatches.find(m => m.courtId === courtId)
  }

  function handleGenerateForCourt(courtId: string) {
    const check = canGenerateOnCourt(session, courtId)
    if (!check.valid) return
    navigate(`/match/generate/${courtId}`)
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

  function renderActiveMatchCard(court: Court, match: MatchType) {
    const team1Players = match.team1.map(id => getPlayerName(session, id))
    const team2Players = match.team2.map(id => getPlayerName(session, id))
    return (
      <div key={court.id} style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '16px',
            fontWeight: 700,
            color: '#3c3c3c',
            marginBottom: '8px',
          }}
        >
          {court.name}
        </div>
        <div
          style={{
            backgroundColor: '#3c3c3c',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            Match {match.matchNumber}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              {team1Players.map((name, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    color: 'white',
                    textAlign: 'left',
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
            <div style={{ flexShrink: 0, padding: '0 8px' }}>
              <Button variant="primary" size="sm" onClick={() => handleAddScore(match.id)}>
                + Add Score
              </Button>
            </div>
            <div style={{ flex: 1 }}>
              {team2Players.map((name, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    color: 'white',
                    textAlign: 'right',
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderEmptyCourtCard(court: Court, courtIndex: number) {
    const generateCheck = canGenerateOnCourt(session, court.id)
    const emptyMatchNum = nextMatchNumber + courtIndex

    return (
      <div key={court.id} style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            color: '#3c3c3c',
            marginBottom: '8px',
          }}
        >
          {court.name}
        </div>
        <div
          style={{
            border: '2px dashed #FE680C',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              color: '#dcdcdc',
              textAlign: 'center',
              marginBottom: '8px',
            }}
          >
            Match {emptyMatchNum}
          </div>
          {generateCheck.valid ? (
            <Button variant="primary" size="sm" onClick={() => handleGenerateForCourt(court.id)}>
              + Generate Match
            </Button>
          ) : (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#9a9a9a',
                textAlign: 'center',
              }}
            >
              {generateCheck.message ?? 'Waiting for a court to free up'}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="setup-screen">
      {/* Tab bar */}
      <div style={{ flexShrink: 0, padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          {(['match', 'history'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '28px',
                fontWeight: tab === t ? 700 : 400,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: tab === t ? '#3c3c3c' : '#dcdcdc',
                padding: '0',
                lineHeight: '1.2',
              }}
            >
              {t === 'match' ? 'Match' : 'History'}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 24px 16px',
        }}
      >

      {tab === 'match' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Courts section */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '20px',
              fontWeight: 700,
              color: '#3c3c3c',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img src="/icon_court-small.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />Courts
          </div>

          <div>
            {activeCourts.map((court, courtIndex) => {
              const match = getMatchForCourt(court.id)
              return match
                ? renderActiveMatchCard(court, match)
                : renderEmptyCourtCard(court, courtIndex)
            })}
          </div>

          {/* Benched players */}
          {benchedPlayers.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#3c3c3c',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <img src="/icon_benched.png" alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />Benched
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {benchedPlayers.map((p: Player) => (
                  <span
                    key={p.id}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '14px',
                      color: '#3c3c3c',
                    }}
                  >
                    {p.name} ({matchCounts.get(p.id) ?? 0})
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {tab === 'history' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <Button variant="outline-pill" size="sm" onClick={() => setFilterModalOpen(true)}>
              = Filter
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
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  backgroundColor: '#FE680C',
                  borderRadius: '9999px',
                  padding: '2px 10px',
                  color: 'white',
                }}
              >
                {getPlayerName(session, filterPlayerId)}
              </span>
              <button
                type="button"
                onClick={() => setFilterPlayerId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9a9a9a',
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
                color: '#9a9a9a',
                textAlign: 'center',
                paddingTop: '48px',
              }}
            >
              No matches completed yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[...filteredCompleted].reverse().map(m => {
                const team1Players = m.team1.map(id => getPlayerName(session, id))
                const team2Players = m.team2.map(id => getPlayerName(session, id))
                const courtName = session.courts.find(c => c.id === m.courtId)?.name ?? 'Court'
                const winnerIds = m.score?.winnerId ?? []
                const team1Won = m.team1.some(id => winnerIds.includes(id))
                const team1Score = team1Won ? session.winningPoint : (m.score?.team2Points ?? 0)
                const team2Score = team1Won ? (m.score?.team1Points ?? 0) : session.winningPoint

                return (
                  <div key={m.id}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#3c3c3c',
                        marginBottom: '8px',
                      }}
                    >
                      {courtName}
                    </div>
                    <div
                      style={{
                        backgroundColor: '#3c3c3c',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'white',
                          textAlign: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        Match {m.matchNumber}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          {team1Players.map((name, i) => (
                            <div
                              key={i}
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '13px',
                                fontWeight: team1Won ? 700 : 400,
                                color: team1Won ? 'white' : '#9a9a9a',
                                textAlign: 'left',
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                        <div style={{ flexShrink: 0, padding: '0 8px' }}>
                          {m.score ? (
                            <span
                              style={{
                                backgroundColor: '#f4f4f4',
                                color: '#3c3c3c',
                                borderRadius: '9999px',
                                fontSize: '13px',
                                fontWeight: 700,
                                padding: '4px 12px',
                                fontFamily: "'JetBrains Mono', monospace",
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {team1Score} – {team2Score}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '12px',
                                color: '#9a9a9a',
                              }}
                            >
                              No score
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          {team2Players.map((name, i) => (
                            <div
                              key={i}
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '13px',
                                fontWeight: !team1Won ? 700 : 400,
                                color: !team1Won ? 'white' : '#9a9a9a',
                                textAlign: 'right',
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      </div>{/* end scrollable content */}

      {/* Pinned footer — End Game only on match tab */}
      {tab === 'match' && (
        <div
          style={{
            flexShrink: 0,
            padding: `16px 24px calc(16px + env(safe-area-inset-bottom))`,
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <Button variant="secondary" fullWidth onClick={() => setShowEndConfirm(true)}>
            End Game
          </Button>
        </div>
      )}

      {/* End confirm modal */}
      <Modal open={showEndConfirm} onClose={() => setShowEndConfirm(false)} title="End Game">
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            color: '#9a9a9a',
            marginBottom: '20px',
          }}
        >
          Are you sure you want to end the current session? All match data will be cleared.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button variant="primary" fullWidth onClick={handleEndSession}>
            End Session
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setShowEndConfirm(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Filter modal */}
      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter by Player">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {session.players.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setFilterPlayerId(p.id)
                setFilterModalOpen(false)
              }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                padding: '10px 12px',
                background: filterPlayerId === p.id ? '#FE680C' : 'var(--color-bg)',
                color: filterPlayerId === p.id ? 'white' : '#3c3c3c',
                border: '1.5px solid var(--color-border)',
                borderRadius: '12px',
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
