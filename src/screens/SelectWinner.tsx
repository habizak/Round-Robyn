import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import type React from 'react'

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

export function SelectWinner() {
  const { matchId } = useParams<{ matchId: string }>()
  const { session, dispatch } = useSession()
  const navigate = useNavigate()

  const match = session.matches.find(m => m.id === matchId)
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(null)

  if (!match) {
    navigate('/match')
    return null
  }

  const team1Players = match.team1.map(id => getPlayerName(session, id))
  const team2Players = match.team2.map(id => getPlayerName(session, id))

  function handleInsertScore() {
    if (!selectedTeam) return
    navigate(`/match/score/${matchId}/score`, {
      state: { winnerTeam: selectedTeam },
    })
  }

  function handleEndMatch() {
    if (!matchId) return
    // Complete the match with no score — court freed, shows in history without a score
    dispatch({
      type: 'COMPLETE_MATCH',
      matchId,
      score: undefined,
    })
    navigate('/match')
  }

  function teamCardStyle(team: 'team1' | 'team2'): React.CSSProperties {
    const isSelected = selectedTeam === team
    return {
      border: isSelected ? '2px solid #FE680C' : '1.5px solid #dcdcdc',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      flex: 1,
      backgroundColor: 'var(--color-surface)',
    }
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
      <button style={backNavStyle} onClick={() => navigate('/match')}>
        ‹ Back
      </button>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '24px',
        }}
      >
        Select Winner
      </h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <div style={teamCardStyle('team1')} onClick={() => setSelectedTeam('team1')}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#9a9a9a',
              marginBottom: '8px',
            }}
          >
            Team 1
          </div>
          {team1Players.map((name, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: '#3c3c3c',
              }}
            >
              {name}
            </div>
          ))}
        </div>

        <div style={teamCardStyle('team2')} onClick={() => setSelectedTeam('team2')}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#9a9a9a',
              marginBottom: '8px',
            }}
          >
            Team 2
          </div>
          {team2Players.map((name, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: '#3c3c3c',
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: 'auto',
        }}
      >
        <Button variant="primary" fullWidth disabled={!selectedTeam} onClick={handleInsertScore}>
          Insert Score ›
        </Button>
        <Button variant="ghost" fullWidth onClick={handleEndMatch}>
          End Match
        </Button>
      </div>
    </div>
  )
}
