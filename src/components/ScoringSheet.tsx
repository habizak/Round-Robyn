import { useEffect, useState } from 'react'
import type React from 'react'
import { useSession, getPlayerName } from '../hooks/useSession'
import { BottomSheet } from './BottomSheet'
import { Button } from './Button'
import { Input } from './Input'

type ScoringSheetProps = {
  open: boolean
  matchId: string | null
  onClose: () => void
  initialStep?: 'winner' | 'score'
  initialWinnerTeam?: 'team1' | 'team2'
}

export function ScoringSheet({
  open,
  matchId,
  onClose,
  initialStep = 'winner',
  initialWinnerTeam = 'team1',
}: ScoringSheetProps) {
  const { session, dispatch } = useSession()
  const [step, setStep] = useState(initialStep)
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(
    initialStep === 'score' ? initialWinnerTeam : null,
  )
  const [loserScore, setLoserScore] = useState('')
  const [error, setError] = useState('')

  const match = matchId ? session.matches.find(m => m.id === matchId) : undefined

  useEffect(() => {
    if (open && matchId && !match) {
      onClose()
    }
  }, [open, matchId, match, onClose])

  if (!open || !matchId || !match) return null

  const currentMatchId = matchId

  const team1Players = match.team1.map(id => getPlayerName(session, id))
  const team2Players = match.team2.map(id => getPlayerName(session, id))
  const winnerTeam = selectedTeam ?? initialWinnerTeam
  const winnerIds = winnerTeam === 'team1' ? match.team1 : match.team2
  const loserIds = winnerTeam === 'team1' ? match.team2 : match.team1
  const winnerNames = winnerIds.map(id => getPlayerName(session, id)).join(' & ')
  const loserNames = loserIds.map(id => getPlayerName(session, id)).join(' & ')

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

  function handleEndMatch() {
    dispatch({
      type: 'COMPLETE_MATCH',
      matchId: currentMatchId,
      score: undefined,
    })
    onClose()
  }

  function handleInsertScore() {
    if (!selectedTeam) return
    setStep('score')
    setLoserScore('')
    setError('')
  }

  function handleSubmitScore() {
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
    onClose()
  }

  function handleBackToWinner() {
    setStep('winner')
    setLoserScore('')
    setError('')
  }

  if (step === 'winner') {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Select Winner"
        footer={(
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="primary" fullWidth disabled={!selectedTeam} onClick={handleInsertScore}>
              Insert Score ›
            </Button>
            <Button variant="ghost" fullWidth onClick={handleEndMatch}>
              End Match
            </Button>
          </div>
        )}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            role="button"
            tabIndex={0}
            style={teamCardStyle('team1')}
            onClick={() => setSelectedTeam('team1')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedTeam('team1')
            }}
          >
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

          <div
            role="button"
            tabIndex={0}
            style={teamCardStyle('team2')}
            onClick={() => setSelectedTeam('team2')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedTeam('team2')
            }}
          >
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
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Insert Score"
      footer={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button variant="primary" fullWidth disabled={!loserScore} onClick={handleSubmitScore}>
            Submit
          </Button>
          <Button variant="ghost" fullWidth onClick={handleBackToWinner}>
            ‹ Back
          </Button>
        </div>
      )}
    >
      <div style={{ marginBottom: '16px' }}>
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

      <div>
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
    </BottomSheet>
  )
}
