import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession, getPlayerName } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { Badge } from '../components/Badge'
import {
  filterMatchOptions,
  generateMatchKey,
  getMatchOptions,
  type MatchOption,
} from '../domain/matchGenerator'
import { canGenerateOnCourt, getActivePlayerIds } from '../domain/sessionRules'
import type { Session } from '../types'

const pageFont = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

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
        borderRadius: 12,
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-text-primary)'}`,
        background: selected ? 'var(--color-accent)' : 'var(--color-bg)',
        color: selected ? 'var(--color-reverse)' : 'var(--color-text-primary)',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: pageFont,
        fontSize: '15px',
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      <span style={{ textAlign: 'right' }}>{formatSide(session, option.team1)}</span>
      <span style={{ fontWeight: 700, fontSize: '14px' }}>VS</span>
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
        padding: '16px 20px 32px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/match')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.49.57 1.08.6 1.7.03.62-.14 1.23-.5 1.75-.36.52-.88.93-1.5 1.15Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <h1
        style={{
          fontFamily: pageFont,
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          margin: '0 0 16px',
          lineHeight: 1.15,
        }}
      >
        Generate Match
      </h1>

      <div style={{ marginBottom: '20px' }}>
        <Button variant="outline" pill onClick={() => setFilterModalOpen(true)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Filter
          </span>
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
          <Badge accent>{getPlayerName(session, filterPlayerId)}</Badge>
          <button
            type="button"
            onClick={() => setFilterPlayerId(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontFamily: pageFont,
              fontSize: '13px',
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
              fontFamily: pageFont,
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
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
          pill
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
                  fontFamily: pageFont,
                  fontSize: '14px',
                  padding: '10px 12px',
                  background:
                    filterPlayerId === p.id ? 'var(--color-accent)' : 'var(--color-bg)',
                  color:
                    filterPlayerId === p.id
                      ? 'var(--color-reverse)'
                      : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
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
