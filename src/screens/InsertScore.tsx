import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

const backNavStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '13px',
  color: '#3c3c3c',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '0',
  marginBottom: '16px',
}

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
      <button style={backNavStyle} onClick={() => navigate(`/match/score/${matchId}/winner`)}>
        ‹ Back
      </button>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '32px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '24px',
        }}
      >
        Insert Score
      </h1>

      <div style={{ marginBottom: '24px' }}>
        <Input
          type="number"
          value={loserScore}
          onChange={v => {
            setLoserScore(v)
            setError('')
          }}
          placeholder="Score"
          error={error}
        />
      </div>

      {/* Team section */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            color: '#3c3c3c',
            marginBottom: '8px',
          }}
        >
          Winner: {winnerNames}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            color: '#9a9a9a',
          }}
        >
          Loser: {loserNames}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: '#9a9a9a',
            marginTop: '8px',
          }}
        >
          Score: {session.winningPoint} – {loserScore || '?'}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
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
  )
}
