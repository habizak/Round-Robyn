import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import {
  filterMatchOptions,
  generateMatchKey,
  getMatchOptions,
  type MatchOption,
} from '../domain/matchGenerator'
import { canGenerateOnCourt, getActivePlayerIds } from '../domain/sessionRules'
import type { Session } from '../types'

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

function getUsedMatchups(matches: Session['matches']): Set<string> {
  const used = new Set<string>()
  for (const m of matches) {
    if (m.status === 'completed' || m.status === 'playing') {
      used.add(generateMatchKey(m.team1, m.team2))
    }
  }
  return used
}

function formatSide(session: Session, ids: string[]): string {
  return ids.map(id => getPlayerName(session, id)).join(' & ')
}

function MatchOptionCard({
  option,
  session,
  selected,
  onSelect,
}: {
  option: MatchOption
  session: Session
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '12px',
        padding: '20px 16px',
        borderRadius: '12px',
        border: selected ? '2px solid #A4C92C' : '1.5px solid #dcdcdc',
        background: selected ? '#A4C92C' : 'var(--color-bg)',
        color: selected ? 'white' : '#3c3c3c',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      <span style={{ textAlign: 'right' }}>{formatSide(session, option.team1)}</span>
      <span style={{ fontWeight: 700, fontSize: '13px' }}>VS</span>
      <span style={{ textAlign: 'left' }}>{formatSide(session, option.team2)}</span>
    </button>
  )
}

export function GenerateMatch() {
  const { courtId } = useParams<{ courtId: string }>()
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterPlayerId, setFilterPlayerId] = useState<string | null>(null)

  const court = session.courts.find(c => c.id === courtId)
  const canGenerate = courtId ? canGenerateOnCourt(session, courtId) : { valid: false }

  useEffect(() => {
    if (!courtId || !court || !canGenerate.valid) {
      navigate('/match', { replace: true })
    }
  }, [courtId, court, canGenerate.valid, navigate])

  const allOptions = useMemo(() => {
    const activeIds = getActivePlayerIds(session.matches)
    return getMatchOptions(
      session.players,
      session.matchType,
      getUsedMatchups(session.matches),
      activeIds,
    )
  }, [session.players, session.matchType, session.matches])

  const visibleOptions = useMemo(
    () => filterMatchOptions(allOptions, filterPlayerId),
    [allOptions, filterPlayerId],
  )

  const selectedOption = visibleOptions.find(o => o.key === selectedKey) ?? null

  useEffect(() => {
    if (selectedKey && !visibleOptions.some(o => o.key === selectedKey)) {
      setSelectedKey(null)
    }
  }, [visibleOptions, selectedKey])

  function handleSubmit() {
    if (!courtId || !selectedOption) return
    dispatch({
      type: 'ASSIGN_MATCH',
      courtId,
      team1: selectedOption.team1,
      team2: selectedOption.team2,
    })
    navigate('/match')
  }

  if (!court || !canGenerate.valid) return null

  return (
    <div
      style={{
        maxWidth: '420px',
        margin: '0 auto',
        padding: '24px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
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
        Generate Match
      </h1>

      <div style={{ marginBottom: '16px' }}>
        <Button variant="outline-pill" size="sm" onClick={() => setFilterModalOpen(true)}>
          = Filter
        </Button>
      </div>

      {filterPlayerId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              backgroundColor: '#A4C92C',
              borderRadius: '9999px',
              padding: '2px 10px',
              color: 'white',
            }}
          >
            {getPlayerName(session, filterPlayerId)}
          </span>
          <button
            type="button"
            onClick={() => setFilterPlayerId(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9a9a9a',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            × clear
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visibleOptions.length === 0 ? (
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              color: '#9a9a9a',
              textAlign: 'center',
              marginTop: '24px',
            }}
          >
            {allOptions.length === 0
              ? 'No match options available right now.'
              : 'No options match this filter.'}
          </p>
        ) : (
          visibleOptions.map(option => (
            <MatchOptionCard
              key={option.key}
              option={option}
              session={session}
              selected={selectedKey === option.key}
              onSelect={() => setSelectedKey(option.key)}
            />
          ))
        )}
      </div>

      <div style={{ marginTop: '24px' }}>
        <Button
          variant="primary"
          fullWidth
          disabled={!selectedOption}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>

      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter by Player">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {session.players
            .filter(p => p.status === 'benched')
            .map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFilterPlayerId(p.id)
                  setFilterModalOpen(false)
                }}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  padding: '10px 12px',
                  background: filterPlayerId === p.id ? '#A4C92C' : 'var(--color-bg)',
                  color: filterPlayerId === p.id ? 'white' : '#3c3c3c',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {p.name}
              </button>
            ))}
        </div>
      </Modal>
    </div>
  )
}
