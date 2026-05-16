import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MatchType } from '../types'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Card } from '../components/Card'

const OPTIONS: { value: MatchType; label: string; description: string }[] = [
  {
    value: 'singles',
    label: 'Singles',
    description: '1 vs 1 — players compete individually',
  },
  {
    value: 'random-doubles',
    label: 'Random Doubles',
    description: '2 vs 2 — teams are randomly assigned each round',
  },
  {
    value: 'fixed-doubles',
    label: 'Fixed Doubles',
    description: '2 vs 2 — partners stay the same throughout',
  },
]

export function MatchType() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<MatchType | null>(
    session.status === 'setup' && session.matchType ? session.matchType : null
  )

  function handleSelect(type: MatchType) {
    setSelected(type)
  }

  function handleNext() {
    if (!selected) return
    dispatch({ type: 'SET_MATCH_TYPE', matchType: selected })
    navigate('/setup/players')
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
        <Button variant="ghost" onClick={() => navigate('/')}>
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
        Match Type
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {OPTIONS.map(opt => (
          <Card
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => handleSelect(opt.value)}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
              }}
            >
              {opt.label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {opt.description}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <Button
          variant="primary"
          fullWidth
          disabled={!selected}
          onClick={handleNext}
        >
          Players →
        </Button>
      </div>
    </div>
  )
}
