import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { DEFAULT_WINNING_POINTS } from '../domain/constants'

export function WinningPoint() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()

  const [selected, setSelected] = useState<number | null>(
    DEFAULT_WINNING_POINTS.includes(session.winningPoint) ? session.winningPoint : null
  )
  const [showCustom, setShowCustom] = useState(
    !DEFAULT_WINNING_POINTS.includes(session.winningPoint)
  )
  const [customValue, setCustomValue] = useState(
    !DEFAULT_WINNING_POINTS.includes(session.winningPoint)
      ? String(session.winningPoint)
      : ''
  )
  const [customError, setCustomError] = useState('')

  function handleQuickSelect(pts: number) {
    setSelected(pts)
    setShowCustom(false)
    setCustomError('')
  }

  function handleCustomToggle() {
    setShowCustom(true)
    setSelected(null)
  }

  function handleNext() {
    let points: number
    if (showCustom) {
      points = parseInt(customValue, 10)
      if (isNaN(points) || points < 1) {
        setCustomError('Enter a value of 1 or more.')
        return
      }
    } else if (selected !== null) {
      points = selected
    } else {
      return
    }
    dispatch({ type: 'SET_WINNING_POINT', points })
    navigate('/setup/court')
  }

  const isValid = showCustom
    ? customValue !== '' && parseInt(customValue, 10) >= 1
    : selected !== null

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
        <Button variant="ghost" onClick={() => navigate('/setup/players')}>
          ← Players
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
        Winning Point
      </h1>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {DEFAULT_WINNING_POINTS.map(pts => (
          <button
            key={pts}
            onClick={() => handleQuickSelect(pts)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: 700,
              padding: '12px 20px',
              borderRadius: 0,
              cursor: 'pointer',
              backgroundColor: selected === pts && !showCustom ? 'var(--color-accent)' : 'transparent',
              color: selected === pts && !showCustom ? 'var(--color-reverse)' : 'var(--color-text-primary)',
              border: `1px solid ${selected === pts && !showCustom ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}
          >
            {pts}
          </button>
        ))}
        <button
          onClick={handleCustomToggle}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            padding: '12px 20px',
            borderRadius: 0,
            cursor: 'pointer',
            backgroundColor: showCustom ? 'var(--color-accent)' : 'transparent',
            color: showCustom ? 'var(--color-reverse)' : 'var(--color-text-primary)',
            border: `1px solid ${showCustom ? 'var(--color-accent)' : 'var(--color-border)'}`,
          }}
        >
          ···
        </button>
      </div>

      {showCustom && (
        <div style={{ marginBottom: '16px' }}>
          <Input
            label="Custom winning point"
            type="number"
            value={customValue}
            onChange={v => {
              setCustomValue(v)
              setCustomError('')
            }}
            placeholder="e.g. 30"
            error={customError}
          />
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <Button variant="primary" fullWidth disabled={!isValid} onClick={handleNext}>
          Court →
        </Button>
      </div>
    </div>
  )
}
