import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MatchType as MatchTypeValue } from '../types'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ASSETS } from '../constants/assets'

const pageFont = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

const SINGLES_OPTION = {
  value: 'singles' as const,
  label: 'Singles',
  description: 'Individual matches',
  icon: ASSETS.logoSingles,
}

const DOUBLES_OPTIONS = [
  {
    value: 'fixed-doubles' as const,
    label: 'Fixed Doubles',
    description: 'Fixed partner doubles matches',
    icon: ASSETS.iconDoubles,
  },
  {
    value: 'random-doubles' as const,
    label: 'Random Doubles',
    description: 'Rotating partner doubles matches',
    icon: ASSETS.iconDoubles,
  },
]

type OptionConfig = {
  value: MatchTypeValue
  label: string
  description: string
  icon: string
}

function MatchTypeOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: OptionConfig
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card selected={selected} rounded onClick={onSelect}>
      <img
        src={option.icon}
        alt=""
        width={56}
        height={56}
        style={{ display: 'block', marginBottom: '12px' }}
      />
      <div
        style={{
          fontFamily: pageFont,
          fontSize: '15px',
          fontWeight: 700,
          color: selected ? 'var(--color-reverse)' : 'var(--color-text-primary)',
          marginBottom: '6px',
          lineHeight: 1.2,
        }}
      >
        {option.label}
      </div>
      <p
        style={{
          fontFamily: pageFont,
          fontSize: '13px',
          fontWeight: 400,
          color: selected ? 'var(--color-reverse)' : 'var(--color-text-secondary)',
          opacity: selected ? 0.9 : 1,
          lineHeight: 1.35,
          margin: 0,
        }}
      >
        {option.description}
      </p>
    </Card>
  )
}

export function MatchType() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<MatchTypeValue | null>(
    session.status === 'setup' && session.matchType ? session.matchType : null,
  )

  function handleSelect(type: MatchTypeValue) {
    setSelected(type)
  }

  function handleNext() {
    if (!selected) return
    dispatch({ type: 'SET_MATCH_TYPE', matchType: selected })
    navigate('/setup/players')
  }

  const sectionTitleStyle: CSSProperties = {
    fontFamily: pageFont,
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    marginBottom: '12px',
  }

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '24px 24px 32px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          padding: 0,
          marginBottom: '20px',
          cursor: 'pointer',
          fontFamily: pageFont,
          fontSize: '15px',
          color: 'var(--color-text-primary)',
        }}
      >
        ‹ Back
      </button>

      <h1
        style={{
          fontFamily: pageFont,
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '28px',
          letterSpacing: '-0.02em',
        }}
      >
        Match Type
      </h1>

      <div style={{ flex: 1 }}>
        <section style={{ marginBottom: '28px' }}>
          <h2 style={sectionTitleStyle}>Singles</h2>
          <div style={{ maxWidth: 'calc(50% - 6px)', minWidth: '140px' }}>
            <MatchTypeOptionCard
              option={SINGLES_OPTION}
              selected={selected === SINGLES_OPTION.value}
              onSelect={() => handleSelect(SINGLES_OPTION.value)}
            />
          </div>
        </section>

        <section>
          <h2 style={sectionTitleStyle}>Doubles</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            {DOUBLES_OPTIONS.map(opt => (
              <MatchTypeOptionCard
                key={opt.value}
                option={opt}
                selected={selected === opt.value}
                onSelect={() => handleSelect(opt.value)}
              />
            ))}
          </div>
        </section>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '32px',
        }}
      >
        <Button variant="primary" pill disabled={!selected} onClick={handleNext}>
          Players ›
        </Button>
      </div>
    </div>
  )
}
