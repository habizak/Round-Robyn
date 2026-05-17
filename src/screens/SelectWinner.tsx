import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

export function SelectWinner() {
  const { matchId } = useParams<{ matchId: string }>()
  const { session } = useSession()
  const navigate = useNavigate()

  const match = session.matches.find(m => m.id === matchId)
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(null)

  if (!match) {
    navigate('/match')
    return null
  }

  const team1Names = match.team1.map(id => getPlayerName(session, id)).join(' & ')
  const team2Names = match.team2.map(id => getPlayerName(session, id)).join(' & ')

  function handleInsertScore() {
    if (!selectedTeam) return
    navigate(`/match/score/${matchId}/score`, {
      state: { winnerTeam: selectedTeam },
    })
  }

  function handleEndMatch() {
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
        <Button variant="ghost" onClick={() => navigate('/match')}>
          ← Back
        </Button>
      </div>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
      >
        Select Winner
      </h1>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          marginBottom: '24px',
        }}
      >
        Match #{match.matchNumber}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <Card
            selected={selectedTeam === 'team1'}
            onClick={() => setSelectedTeam('team1')}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: selectedTeam === 'team1' ? 'var(--color-reverse)' : 'var(--color-text-secondary)',
                opacity: selectedTeam === 'team1' ? 0.85 : 1,
                marginBottom: '4px',
              }}
            >
              Team 1
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: selectedTeam === 'team1' ? 'var(--color-reverse)' : 'var(--color-text-primary)',
              }}
            >
              {team1Names}
            </div>
          </Card>
        </div>
        <div style={{ flex: 1 }}>
          <Card
            selected={selectedTeam === 'team2'}
            onClick={() => setSelectedTeam('team2')}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: selectedTeam === 'team2' ? 'var(--color-reverse)' : 'var(--color-text-secondary)',
                opacity: selectedTeam === 'team2' ? 0.85 : 1,
                marginBottom: '4px',
              }}
            >
              Team 2
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: selectedTeam === 'team2' ? 'var(--color-reverse)' : 'var(--color-text-primary)',
              }}
            >
              {team2Names}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <Button variant="ghost" onClick={handleEndMatch}>
          End Match
        </Button>
        <div style={{ flex: 1 }}>
          <Button
            variant="primary"
            fullWidth
            disabled={!selectedTeam}
            onClick={handleInsertScore}
          >
            Insert Score →
          </Button>
        </div>
      </div>
    </div>
  )
}
