import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { MAX_COURTS } from '../domain/constants'

export function Court() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()

  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const courts = session.courts

  function handleAdd() {
    const name = inputValue.trim()
    if (!name) return
    if (courts.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setInputError('Court already added.')
      return
    }
    if (courts.length >= MAX_COURTS) {
      setInputError(`Max ${MAX_COURTS} courts.`)
      return
    }
    setInputError('')
    dispatch({ type: 'ADD_COURT', name })
    setInputValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  function handleRemove(id: string) {
    dispatch({ type: 'REMOVE_COURT', id })
  }

  function handleGenerate() {
    if (courts.length === 0) return
    dispatch({ type: 'START_SESSION' })
    navigate('/match')
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
        <Button variant="ghost" onClick={() => navigate('/setup/winning-point')}>
          ← Winning Point
        </Button>
      </div>

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
      >
        Court
      </h1>
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          marginBottom: '24px',
        }}
      >
        {courts.length}/{MAX_COURTS} courts added
      </p>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <Input
            value={inputValue}
            onChange={v => {
              setInputValue(v)
              setInputError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Court name"
            error={inputError}
          />
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={courts.length >= MAX_COURTS}
          >
            Add
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {courts.map((c, i) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                color: 'var(--color-text-primary)',
              }}
            >
              {i + 1}. {c.name}
            </span>
            <button
              onClick={() => handleRemove(c.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '16px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <Button
          variant="primary"
          fullWidth
          disabled={courts.length === 0}
          onClick={handleGenerate}
        >
          Generate Match
        </Button>
      </div>
    </div>
  )
}
