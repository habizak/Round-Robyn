import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MatchType } from '../types'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { SetupScreenLayout } from '../components/SetupScreenLayout'

const SINGLES_OPTION = {
  value: 'singles' as MatchType,
  label: 'Singles',
  description: 'Individual matches',
  icon: '/logo_match_single.png',
}

const DOUBLES_OPTIONS = [
  {
    value: 'fixed-doubles' as MatchType,
    label: 'Fixed Doubles',
    description: 'Partners stay the same',
    icon: '/icon_match_doubles.png',
  },
  {
    value: 'random-doubles' as MatchType,
    label: 'Random Doubles',
    description: 'Randomly assigned teams',
    icon: '/icon_match_doubles.png',
  },
]

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

  function cardStyle(value: MatchType): React.CSSProperties {
    const isSelected = selected === value
    return {
      border: isSelected ? '2px solid #FE680C' : '1.5px solid #dcdcdc',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      backgroundColor: 'var(--color-surface)',
      width: 'calc(50% - 6px)',
      boxSizing: 'border-box',
    }
  }

  return (
    <SetupScreenLayout
      backButton={(
        <button style={backNavStyle} onClick={() => navigate('/')}>
          ‹ Back
        </button>
      )}
      footer={(
        <Button
          variant="primary"
          fullWidth
          disabled={!selected}
          onClick={handleNext}
        >
          Players ›
        </Button>
      )}
    >
      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '28px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '24px',
        }}
      >
        Match Type
      </h1>

      {/* Singles section */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '20px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '12px',
        }}
      >
        Singles
      </div>

      <div
        style={cardStyle(SINGLES_OPTION.value)}
        onClick={() => handleSelect(SINGLES_OPTION.value)}
      >
        <img src={SINGLES_OPTION.icon} alt="Singles" style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '8px' }} />
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            fontWeight: 700,
            color: '#3c3c3c',
            marginBottom: '4px',
          }}
        >
          {SINGLES_OPTION.label}
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: '#9a9a9a',
          }}
        >
          {SINGLES_OPTION.description}
        </div>
      </div>

      {/* Doubles section */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '16px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginTop: '24px',
          marginBottom: '12px',
        }}
      >
        Doubles
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {DOUBLES_OPTIONS.map(opt => (
          <div
            key={opt.value}
            style={cardStyle(opt.value)}
            onClick={() => handleSelect(opt.value)}
          >
            <img src={opt.icon} alt={opt.label} style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '8px' }} />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: '#3c3c3c',
                marginBottom: '4px',
              }}
            >
              {opt.label}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#9a9a9a',
              }}
            >
              {opt.description}
            </div>
          </div>
        ))}
      </div>

    </SetupScreenLayout>
  )
}
