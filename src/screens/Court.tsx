import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { SetupScreenLayout } from '../components/SetupScreenLayout'
import { MAX_COURTS } from '../domain/constants'

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

  // Reversed for display (newest at top)
  const reversedCourts = [...courts].reverse()

  return (
    <SetupScreenLayout
      backButton={(
        <button style={backNavStyle} onClick={() => navigate('/setup/winning-point')}>
          ‹ Winning Point
        </button>
      )}
      footer={(
        <Button
          variant="primary"
          fullWidth
          disabled={courts.length === 0}
          onClick={handleGenerate}
        >
          Generate Match
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
        Court
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
          helper={`You may key in a maximum of ${MAX_COURTS} courts`}
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
        Court List
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {reversedCourts.map((c, i) => {
          const displayIndex = courts.length - i
          return (
            <div
              key={c.id}
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
                {displayIndex}. {c.name}
              </span>
              <button
                onClick={() => handleRemove(c.id)}
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

    </SetupScreenLayout>
  )
}
