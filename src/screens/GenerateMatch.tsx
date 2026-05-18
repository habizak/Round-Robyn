import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession, getPlayerName, getPlayerMatchCounts } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { SetupScreenLayout } from '../components/SetupScreenLayout'
import {
  filterMatchOptions,
  generateMatchKey,
  getMatchOptions,
  type MatchOption,
} from '../domain/matchGenerator'
import { canGenerateOnCourt, getActivePlayerIds } from '../domain/sessionRules'
import { MIN_PLAYERS_DOUBLES } from '../domain/constants'
import type { MatchType, Session } from '../types'

const PAGE_SIZE = 4

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

function MatchOptionPicker({
  filteredOptions,
  allScoredOptions,
  session,
  selectedKey,
  onSelect,
}: {
  filteredOptions: MatchOption[]
  allScoredOptions: MatchOption[]
  session: Session
  selectedKey: string | null
  onSelect: (key: string | null) => void
}) {
  const [page, setPage] = useState(0)

  const visibleOptions = filteredOptions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const canRegenerate = filteredOptions.length > PAGE_SIZE

  function handleRegenerate() {
    const nextPage = (page + 1) * PAGE_SIZE < filteredOptions.length ? page + 1 : 0
    setPage(nextPage)
    onSelect(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
          {allScoredOptions.length === 0
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
            onSelect={() => onSelect(option.key)}
          />
        ))
      )}
      {canRegenerate && (
        <Button variant="outline-pill" fullWidth onClick={handleRegenerate}>
          ↻ Re-generate
        </Button>
      )}
    </div>
  )
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
        border: selected ? '2px solid #FE680C' : '1.5px solid #dcdcdc',
        background: selected ? '#FE680C' : 'var(--color-bg)',
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

const activeToggleStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '14px',
  fontWeight: 700,
  padding: '10px 16px',
  borderRadius: '12px',
  border: '2px solid #FE680C',
  backgroundColor: '#FE680C',
  color: 'white',
  cursor: 'pointer',
}

const inactiveToggleStyle: React.CSSProperties = {
  flex: 1,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '14px',
  fontWeight: 700,
  padding: '10px 16px',
  borderRadius: '12px',
  border: '1.5px solid #dcdcdc',
  backgroundColor: 'var(--color-bg)',
  color: '#3c3c3c',
  cursor: 'pointer',
}

export function GenerateMatch() {
  const { courtId } = useParams<{ courtId: string }>()
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterPlayerIds, setFilterPlayerIds] = useState<string[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [chosenType, setChosenType] = useState<'singles' | 'random-doubles'>('singles')

  const isMixed = session.mode === 'mixed'
  const benchedCount = session.players.filter(p => p.status === 'benched').length
  const canPickDoubles = benchedCount >= MIN_PLAYERS_DOUBLES
  const activeMatchType: MatchType = isMixed ? chosenType : session.matchType

  const court = session.courts.find(c => c.id === courtId)
  const canGenerate = courtId ? canGenerateOnCourt(session, courtId) : { valid: false }

  useEffect(() => {
    if (!courtId || !court || !canGenerate.valid) {
      navigate('/match', { replace: true })
    }
  }, [courtId, court, canGenerate.valid, navigate])

  useEffect(() => {
    setSelectedKey(null)
  }, [chosenType])

  useEffect(() => {
    if (isMixed && chosenType === 'random-doubles' && !canPickDoubles) {
      setChosenType('singles')
    }
  }, [isMixed, chosenType, canPickDoubles])

  const allScoredOptions = useMemo(() => {
    const activeIds = getActivePlayerIds(session.matches)
    const matchCounts = getPlayerMatchCounts(session)
    return getMatchOptions(
      session.players,
      activeMatchType,
      getUsedMatchups(session.matches),
      activeIds,
      100,
      matchCounts,
    )
  }, [session, activeMatchType])

  const filteredOptions = useMemo(
    () => filterMatchOptions(allScoredOptions, filterPlayerIds),
    [allScoredOptions, filterPlayerIds],
  )

  const optionPickerKey = `${filterPlayerIds.join(',')}|${allScoredOptions.map(o => o.key).join(',')}`

  useEffect(() => {
    setSelectedKey(null)
  }, [optionPickerKey])

  const selectedOption = filteredOptions.find(o => o.key === selectedKey) ?? null

  function toggleFilter(id: string) {
    setFilterPlayerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    if (!courtId || !selectedOption) return
    dispatch({
      type: 'ASSIGN_MATCH',
      courtId,
      team1: selectedOption.team1,
      team2: selectedOption.team2,
      matchType: activeMatchType,
    })
    navigate('/match')
  }

  if (!court || !canGenerate.valid) return null

  const benchedPlayers = session.players.filter(p => p.status === 'benched')

  return (
    <SetupScreenLayout
      backButton={(
        <button style={backNavStyle} onClick={() => navigate('/match')}>
          ‹ Back
        </button>
      )}
      footer={(
        <Button variant="primary" fullWidth disabled={!selectedOption} onClick={handleSubmit}>
          Submit
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
        Generate Match
      </h1>

      {isMixed && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setChosenType('singles')}
              style={chosenType === 'singles' ? activeToggleStyle : inactiveToggleStyle}
            >
              Singles
            </button>
            <button
              type="button"
              onClick={() => setChosenType('random-doubles')}
              disabled={!canPickDoubles}
              style={{
                ...(chosenType === 'random-doubles' ? activeToggleStyle : inactiveToggleStyle),
                opacity: canPickDoubles ? 1 : 0.5,
                cursor: canPickDoubles ? 'pointer' : 'not-allowed',
              }}
            >
              Doubles
            </button>
          </div>
          {!canPickDoubles && (
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#9a9a9a',
                marginTop: '8px',
              }}
            >
              Not enough players for doubles
            </p>
          )}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Button variant="outline-pill" size="sm" onClick={() => setFilterModalOpen(true)}>
          = Filter{filterPlayerIds.length > 0 ? ` (${filterPlayerIds.length})` : ''}
        </Button>
      </div>

      {filterPlayerIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}
        >
          {filterPlayerIds.map(id => (
            <span
              key={id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                backgroundColor: '#FE680C',
                borderRadius: '9999px',
                padding: '2px 8px 2px 10px',
                color: 'white',
              }}
            >
              {getPlayerName(session, id)}
              <button
                type="button"
                onClick={() => toggleFilter(id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  padding: '0',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setFilterPlayerIds([])}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9a9a9a',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              padding: '0',
            }}
          >
            clear all
          </button>
        </div>
      )}

      <MatchOptionPicker
        key={optionPickerKey}
        filteredOptions={filteredOptions}
        allScoredOptions={allScoredOptions}
        session={session}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />

      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filter by Player">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {benchedPlayers.map(p => {
            const active = filterPlayerIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleFilter(p.id)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  padding: '10px 12px',
                  background: active ? '#FE680C' : 'var(--color-bg)',
                  color: active ? 'white' : '#3c3c3c',
                  border: active ? '1.5px solid #FE680C' : '1.5px solid var(--color-border)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {p.name}
              </button>
            )
          })}
        </div>
        {filterPlayerIds.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <Button variant="primary" fullWidth onClick={() => setFilterModalOpen(false)}>
              Apply
            </Button>
          </div>
        )}
      </Modal>
    </SetupScreenLayout>
  )
}
