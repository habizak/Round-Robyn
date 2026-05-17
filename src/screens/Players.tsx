import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { MAX_PLAYERS, MIN_PLAYERS_SINGLES, MIN_PLAYERS_DOUBLES } from '../domain/constants'
import type { Player } from '../types'

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

export function Players() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [navError, setNavError] = useState('')

  const isDoubles = session.matchType !== 'singles'
  const isFixedDoubles = session.matchType === 'fixed-doubles'
  const players = session.players
  const minPlayers = isDoubles ? MIN_PLAYERS_DOUBLES : MIN_PLAYERS_SINGLES

  function handleAdd() {
    const name = inputValue.trim()
    if (!name) return
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setInputError('Name already added.')
      return
    }
    if (players.length >= MAX_PLAYERS) {
      setInputError(`Max ${MAX_PLAYERS} players.`)
      return
    }
    setInputError('')
    dispatch({ type: 'ADD_PLAYER', name })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  function handleRemove(id: string) {
    dispatch({ type: 'REMOVE_PLAYER', id })
  }

  function handleNext() {
    if (players.length < minPlayers) {
      setNavError(`At least ${minPlayers} players required.`)
      return
    }
    if (isFixedDoubles && players.length % 2 !== 0) {
      setNavError('Need an even number of players for fixed doubles.')
      return
    }
    if (isFixedDoubles) {
      const allPaired = players.every(p => p.partnerId)
      if (!allPaired) {
        setNavError('All players must be paired before continuing.')
        return
      }
    }
    setNavError('')
    navigate('/setup/winning-point')
  }

  function handleSetPartner(playerId: string, partnerId: string) {
    dispatch({ type: 'SET_PARTNER', playerId, partnerId })
  }

  const unpaired = players.filter(p => !p.partnerId)
  const paired = getPairs(players)

  // Show list in reverse order (newest at top)
  const reversedPlayers = [...players].reverse()

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
      <button style={backNavStyle} onClick={() => navigate('/setup/match-type')}>
        ‹ Match Type
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
        Players
      </h1>

      <div style={{ marginBottom: '24px' }}>
        <Input
          value={inputValue}
          onChange={v => {
            setInputValue(v)
            setInputError('')
          }}
          onKeyDown={handleKeyDown}
          placeholder="Name"
          error={inputError}
          helper={`You may key in a maximum of ${MAX_PLAYERS} players`}
        />
      </div>

      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '20px',
          fontWeight: 700,
          color: '#3c3c3c',
          marginBottom: '8px',
        }}
      >
        Player List
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {reversedPlayers.map((p, i) => {
          const displayIndex = players.length - i
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '16px',
                  color: '#3c3c3c',
                }}
              >
                {displayIndex}. {p.name}
              </span>
              <button
                onClick={() => handleRemove(p.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9a9a9a',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '18px',
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* Fixed doubles pairing UI */}
      {isFixedDoubles && players.length >= 2 && (
        <div style={{ marginTop: '24px' }}>
          <h2
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: 700,
              color: '#3c3c3c',
              marginBottom: '12px',
            }}
          >
            Pair Partners
          </h2>

          {/* Show existing pairs */}
          {paired.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {paired.map(([p1, p2]) => (
                <div
                  key={p1.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1.5px solid #A4C92C',
                    borderRadius: '12px',
                    marginBottom: '4px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    color: '#3c3c3c',
                  }}
                >
                  <span>
                    {p1.name} ↔ {p2.name}
                  </span>
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_PARTNER', playerId: p1.id, partnerId: '' })
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9a9a9a',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '12px',
                    }}
                  >
                    unpair
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Unpaired player pairing dropdowns */}
          {unpaired.length >= 2 && (
            <PairingForm unpaired={unpaired} onPair={handleSetPartner} />
          )}

          {unpaired.length === 1 && (
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--color-error)',
              }}
            >
              {unpaired[0].name} needs a partner — add another player.
            </p>
          )}
        </div>
      )}

      {navError && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'var(--color-error)',
            marginTop: '12px',
          }}
        >
          {navError}
        </p>
      )}

      <div style={{ marginTop: '24px' }}>
        <Button
          variant="primary"
          fullWidth
          disabled={players.length < minPlayers}
          onClick={handleNext}
        >
          Winning Point ›
        </Button>
      </div>
    </div>
  )
}

function getPairs(players: Player[]): [Player, Player][] {
  const pairs: [Player, Player][] = []
  const seen = new Set<string>()
  for (const p of players) {
    if (p.partnerId && !seen.has(p.id)) {
      const partner = players.find(x => x.id === p.partnerId)
      if (partner) {
        pairs.push([p, partner])
        seen.add(p.id)
        seen.add(partner.id)
      }
    }
  }
  return pairs
}

function PairingForm({
  unpaired,
  onPair,
}: {
  unpaired: Player[]
  onPair: (p1: string, p2: string) => void
}) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  function handlePair() {
    if (!p1 || !p2 || p1 === p2) return
    onPair(p1, p2)
    setP1('')
    setP2('')
  }

  return (
    <div
      style={{
        padding: '12px',
        border: '2px dashed #A4C92C',
        borderRadius: '12px',
        backgroundColor: 'var(--color-bg)',
        marginBottom: '8px',
      }}
    >
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: '#9a9a9a',
          marginBottom: '8px',
        }}
      >
        Select two players to pair:
      </p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <select
          value={p1}
          onChange={e => setP1(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            padding: '6px 8px',
            backgroundColor: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '12px',
            color: '#3c3c3c',
          }}
        >
          <option value="">Player 1</option>
          {unpaired.map(p => (
            <option key={p.id} value={p.id} disabled={p.id === p2}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={p2}
          onChange={e => setP2(e.target.value)}
          style={{
            flex: 1,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            padding: '6px 8px',
            backgroundColor: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '12px',
            color: '#3c3c3c',
          }}
        >
          <option value="">Player 2</option>
          {unpaired.map(p => (
            <option key={p.id} value={p.id} disabled={p.id === p1}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        variant="secondary"
        onClick={handlePair}
        disabled={!p1 || !p2 || p1 === p2}
      >
        Pair ›
      </Button>
    </div>
  )
}
