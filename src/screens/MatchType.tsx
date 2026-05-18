import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SessionMode } from '../types'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { SetupScreenLayout } from '../components/SetupScreenLayout'

const SINGLES_OPTION = {
  value: 'singles' as SessionMode,
  label: 'Singles',
  description: 'Individual matches',
  icon: '/logo_match_single.png',
}

const DOUBLES_OPTIONS = [
  {
    value: 'fixed-doubles' as SessionMode,
    label: 'Fixed Doubles',
    description: 'Partners stay the same',
    icon: '/icon_match_doubles.png',
  },
  {
    value: 'random-doubles' as SessionMode,
    label: 'Random Doubles',
    description: 'Randomly assigned teams',
    icon: '/icon_match_doubles.png',
  },
]

const MIXED_OPTION = {
  value: 'mixed' as SessionMode,
  label: 'Mixed',
  description: 'Singles or doubles per court',
  icon: '/icon_match_doubles.png',
}

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
  const [selected, setSelected] = useState<SessionMode | null>(
    session.status === 'setup' && session.mode ? session.mode : null
  )

  function handleSelect(mode: SessionMode) {
    setSelected(mode)
  }

  function handleNext() {
    if (!selected) return
    dispatch({ type: 'SET_MATCH_TYPE', mode: selected })
    navigate('/setup/players')
  }

  function cardStyle(value: SessionMode): React.CSSProperties {
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

      <Section label="Singles">
        <ModeCard
          option={SINGLES_OPTION}
          style={cardStyle(SINGLES_OPTION.value)}
          onSelect={() => handleSelect(SINGLES_OPTION.value)}
        />
      </Section>

      <Section label="Doubles" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {DOUBLES_OPTIONS.map(opt => (
            <ModeCard
              key={opt.value}
              option={opt}
              style={cardStyle(opt.value)}
              onSelect={() => handleSelect(opt.value)}
            />
          ))}
        </div>
      </Section>

      <Section label="Mixed" style={{ marginTop: '24px' }}>
        <ModeCard
          option={MIXED_OPTION}
          style={cardStyle(MIXED_OPTION.value)}
          onSelect={() => handleSelect(MIXED_OPTION.value)}
        />
      </Section>
    </SetupScreenLayout>
  )
}

function Section({
  label,
  style,
  children,
}: {
  label: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div style={style}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '16px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '12px',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function ModeCard({
  option,
  style,
  onSelect,
}: {
  option: { value: SessionMode; label: string; description: string; icon: string }
  style: React.CSSProperties
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-testid={`mode-${option.value}`}
      onClick={onSelect}
      style={{
        ...style,
        textAlign: 'left',
        font: 'inherit',
      }}
    >
      <img src={option.icon} alt={option.label} style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '8px' }} />
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '14px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '4px',
        }}
      >
        {option.label}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: '#9a9a9a',
        }}
      >
        {option.description}
      </div>
    </button>
  )
}
