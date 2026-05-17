import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

export function InsertScore() {
  const { matchId } = useParams<{ matchId: string }>()
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  const winnerTeam: 'team1' | 'team2' =
    (location.state as { winnerTeam?: 'team1' | 'team2' })?.winnerTeam ?? 'team1'

  const match = session.matches.find(m => m.id === matchId)
  const [loserScore, setLoserScore] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!match) {
      navigate('/match')
    }
  }, [match, navigate])

  if (!match) return null

  const winnerIds = winnerTeam === 'team1' ? match.team1 : match.team2
  const loserIds = winnerTeam === 'team1' ? match.team2 : match.team1
  const winnerNames = winnerIds.map(id => getPlayerName(session, id)).join(' & ')
  const loserNames = loserIds.map(id => getPlayerName(session, id)).join(' & ')
  const currentMatchId = match.id

  function handleSubmit() {
    const pts = parseInt(loserScore, 10)
    if (isNaN(pts) || pts < 0) {
      setError('Enter a valid score (0 or more).')
      return
    }
    if (pts >= session.winningPoint) {
      setError(`Loser's score must be less than ${session.winningPoint}.`)
      return
    }

    const score = {
      winnerId: winnerIds,
      team1Points: winnerTeam === 'team1' ? session.winningPoint : pts,
      team2Points: winnerTeam === 'team2' ? session.winningPoint : pts,
    }

    dispatch({ type: 'COMPLETE_MATCH', matchId: currentMatchId, score })
    navigate('/match')
  }

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
      <div style={{ marginBottom: '24px' }}>
        <Button
          variant="ghost"
          onClick={() => navigate(`/match/score/${matchId}/winner`)}
        >
          ← Back
        </Button>
      </div>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '24px',
        }}
      >
        Insert Score
      </h1>

      <div
        style={{
          padding: '16px',
          border: '1px solid var(--color-border)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            marginBottom: '8px',
          }}
        >
          Match #{match.matchNumber}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginRight: '8px',
            }}
          >
            Winner:
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-accent)',
            }}
          >
            {winnerNames}
          </span>
        </div>
        <div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginRight: '8px',
            }}
          >
            Loser:
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: 'var(--color-text-primary)',
            }}
          >
            {loserNames}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Input
          label={`${loserNames}'s score`}
          type="number"
          value={loserScore}
          onChange={v => {
            setLoserScore(v)
            setError('')
          }}
          placeholder="e.g. 15"
          error={error}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {session.winningPoint} – {loserScore || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <Button
            variant="primary"
            fullWidth
            disabled={!loserScore}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
