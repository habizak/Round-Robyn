import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSession, getPlayerName, getCompletedMatches, getBenchedPlayers } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Badge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { ASSETS } from '../constants/assets'
import { canGenerateOnCourt } from '../domain/sessionRules'
import type { Match as MatchType, Player, Court } from '../types'

const pageFont = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      {icon}
      <h2
        style={{
          fontFamily: pageFont,
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  )
}


export function Match() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterPlayerId, setFilterPlayerId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState('')

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
  const nextMatchNumber = session.matches.length + 1

  function getMatchForCourt(courtId: string): MatchType | undefined {
    return activeMatches.find(m => m.courtId === courtId)
  }

  function handleGenerateForCourt(courtId: string) {
    const check = canGenerateOnCourt(session, courtId)
    if (!check.valid) {
      setGenerateError(check.message ?? 'Cannot generate a match right now.')
      return
    }
    setGenerateError('')
    navigate(`/match/generate/${courtId}`)
  }

  function handleAddScore(matchId: string) {
    navigate(`/match/score/${matchId}/winner`)
  }

  function handleEndSession() {
    dispatch({ type: 'END_SESSION' })
    navigate('/')
  }

  const availableCourt = activeCourts.find(
    c => !getMatchForCourt(c.id) && canGenerateOnCourt(session, c.id).valid,
  )

  const filteredCompleted = filterPlayerId
    ? completedMatches.filter(
        m => m.team1.includes(filterPlayerId) || m.team2.includes(filterPlayerId),
      )
    : completedMatches

  const tabStyle = (active: boolean): CSSProperties => ({
    fontFamily: pageFont,
    fontSize: '16px',
    fontWeight: active ? 700 : 400,
    padding: '4px 0',
    marginRight: '20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
  })

  function renderActiveMatchCard(court: Court, match: MatchType) {
    const team1Ids = match.team1
    const team2Ids = match.team2

    return (
      <div key={court.id} style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontFamily: pageFont,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          {court.name}
        </p>
        <Card dark rounded>
          <p
            style={{
              fontFamily: pageFont,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-reverse)',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            Match {match.matchNumber}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: 0,
              }}
            >
              {team1Ids.map(id => (
                <span
                  key={id}
                  style={{
                    fontFamily: pageFont,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--color-reverse)',
                    lineHeight: 1.25,
                  }}
                >
                  {getPlayerName(session, id)}
                </span>
              ))}
            </div>
            <div style={{ flexShrink: 0 }}>
              <Button variant="primary" pill onClick={() => handleAddScore(match.id)}>
                + Add Score
              </Button>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-end',
                textAlign: 'right',
                minWidth: 0,
              }}
            >
              {team2Ids.map(id => (
                <span
                  key={id}
                  style={{
                    fontFamily: pageFont,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--color-reverse)',
                    lineHeight: 1.25,
                  }}
                >
                  {getPlayerName(session, id)}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  function renderEmptyCourtCard(court: Court) {
    const generateCheck = canGenerateOnCourt(session, court.id)

    return (
      <div key={court.id} style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontFamily: pageFont,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          {court.name}
        </p>
        <Card dashedAccent rounded>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <p
              style={{
                fontFamily: pageFont,
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Match {nextMatchNumber}
            </p>
            {generateCheck.valid ? (
              <Button variant="primary" pill onClick={() => handleGenerateForCourt(court.id)}>
                + Generate Match
              </Button>
            ) : (
              <p
                style={{
                  fontFamily: pageFont,
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  margin: 0,
                  maxWidth: '240px',
                }}
              >
                {generateCheck.message ?? 'Waiting for a court to free up'}
              </p>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '16px 20px 32px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button type="button" onClick={() => setTab('match')} style={tabStyle(tab === 'match')}>
            Match
          </button>
          <button type="button" onClick={() => setTab('history')} style={tabStyle(tab === 'history')}>
            History
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowEndConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M19.4 15a7.97 7.97 0 0 0 .1-6l1.5-1.2-2-3.4-1.8.7a8.06 8.06 0 0 0-5.2-3L12 1h-4l-.5 2.1a8.06 8.06 0 0 0-5.2 3l-1.8-.7-2 3.4L4.5 9a7.97 7.97 0 0 0 .1 6l-1.5 1.2 2 3.4 1.8-.7a8.06 8.06 0 0 0 5.2 3L8 23h4l.5-2.1a8.06 8.06 0 0 0 5.2-3l1.8.7 2-3.4-1.5-1.2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {tab === 'match' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {availableCourt && (
            <section style={{ marginBottom: '28px' }}>
              <SectionHeader
                icon={
                  <img
                    src={ASSETS.iconAvailableCourt}
                    alt=""
                    width={20}
                    height={20}
                    style={{ display: 'block', flexShrink: 0 }}
                  />
                }
                title="Available Court"
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <img
                  src={ASSETS.iconCourt}
                  alt=""
                  width={48}
                  height={48}
                  style={{ display: 'block', marginBottom: '8px' }}
                />
                <span
                  style={{
                    fontFamily: pageFont,
                    fontSize: '14px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {availableCourt.name}
                </span>
              </div>
            </section>
          )}

          {activeCourts.length > 0 && (
            <section style={{ marginBottom: '28px' }}>
              <SectionHeader
                icon={
                  <img
                    src={ASSETS.iconCourtSmall}
                    alt=""
                    width={20}
                    height={20}
                    style={{ display: 'block', flexShrink: 0 }}
                  />
                }
                title="Courts"
              />
              {activeCourts.map(court => {
                const match = getMatchForCourt(court.id)
                return match ? renderActiveMatchCard(court, match) : renderEmptyCourtCard(court)
              })}
              {generateError && (
                <p
                  style={{
                    fontFamily: pageFont,
                    fontSize: '13px',
                    color: 'var(--color-error)',
                    marginTop: '8px',
                  }}
                >
                  {generateError}
                </p>
              )}
            </section>
          )}

          {benchedPlayers.length > 0 && (
            <section style={{ marginBottom: '24px' }}>
              <SectionHeader
                icon={
                  <img
                    src={ASSETS.iconBenched}
                    alt=""
                    width={20}
                    height={20}
                    style={{ display: 'block', flexShrink: 0 }}
                  />
                }
                title="Benched"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {benchedPlayers.map((p: Player) => (
                  <span
                    key={p.id}
                    style={{
                      fontFamily: pageFont,
                      fontSize: '15px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <Button variant="outline" fullWidth pill onClick={() => setShowEndConfirm(true)}>
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
                fontFamily: pageFont,
                fontSize: '14px',
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
              <Badge accent>{getPlayerName(session, filterPlayerId)}</Badge>
              <button
                type="button"
                onClick={() => setFilterPlayerId(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontFamily: pageFont,
                  fontSize: '13px',
                }}
              >
                × clear
              </button>
            </div>
          )}

          {filteredCompleted.length === 0 ? (
            <p
              style={{
                fontFamily: pageFont,
                fontSize: '15px',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                paddingTop: '48px',
              }}
            >
              No matches completed yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...filteredCompleted].reverse().map(m => {
                const team1Names = m.team1.map(id => getPlayerName(session, id)).join(' & ')
                const team2Names = m.team2.map(id => getPlayerName(session, id)).join(' & ')
                const courtName = session.courts.find(c => c.id === m.courtId)?.name ?? 'Court'
                const winnerIds = m.score?.winnerId ?? []
                const team1Won = m.team1.some(id => winnerIds.includes(id))
                const team1Score = team1Won ? session.winningPoint : (m.score?.team2Points ?? 0)
                const team2Score = team1Won ? (m.score?.team1Points ?? 0) : session.winningPoint

                return (
                  <Card key={m.id} dark rounded>
                    <p
                      style={{
                        fontFamily: pageFont,
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      {courtName} · Match {m.matchNumber}
                    </p>
                    <div style={{ fontFamily: pageFont, fontSize: '14px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontWeight: team1Won ? 700 : 400,
                          color: team1Won ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {team1Names}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)', margin: '0 8px' }}>vs</span>
                      <span
                        style={{
                          fontWeight: !team1Won ? 700 : 400,
                          color: !team1Won ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {team2Names}
                      </span>
                    </div>
                    {m.score ? (
                      <span
                        style={{
                          fontFamily: pageFont,
                          fontSize: '14px',
                          color: 'var(--color-reverse)',
                          fontWeight: 700,
                        }}
                      >
                        {team1Score} – {team2Score}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: pageFont,
                          fontSize: '13px',
                          color: 'var(--color-text-secondary)',
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

      <Modal open={showEndConfirm} onClose={() => setShowEndConfirm(false)} title="End Game">
        <p
          style={{
            fontFamily: pageFont,
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
          <Button variant="primary" pill onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </Modal>

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
                fontFamily: pageFont,
                fontSize: '14px',
                padding: '10px 12px',
                background: filterPlayerId === p.id ? 'var(--color-accent)' : 'var(--color-bg)',
                color: filterPlayerId === p.id ? 'var(--color-reverse)' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
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
