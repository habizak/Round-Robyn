import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { DEFAULT_WINNING_POINTS } from '../domain/constants'

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
      <button style={backNavStyle} onClick={() => navigate('/setup/players')}>
        ‹ Players
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
        Winning Point
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        {DEFAULT_WINNING_POINTS.map(pts => {
          const isSelected = selected === pts && !showCustom
          return (
            <button
              key={pts}
              onClick={() => handleQuickSelect(pts)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '16px',
                fontWeight: 600,
                aspectRatio: '1',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#A4C92C' : 'white',
                color: isSelected ? 'white' : '#3c3c3c',
                border: isSelected ? '2px solid #A4C92C' : '1.5px solid #dcdcdc',
              }}
            >
              {pts}
            </button>
          )
        })}
        <button
          onClick={handleCustomToggle}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '16px',
            fontWeight: 600,
            aspectRatio: '1',
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundColor: showCustom ? '#A4C92C' : 'white',
            color: showCustom ? 'white' : '#3c3c3c',
            border: showCustom ? '2px solid #A4C92C' : '1.5px solid #dcdcdc',
          }}
        >
          ...
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

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" disabled={!isValid} onClick={handleNext}>
          Court ›
        </Button>
      </div>
    </div>
  )
}
