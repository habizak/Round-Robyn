import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'

export function Home() {
  const { session, dispatch } = useSession()
  const navigate = useNavigate()

  const hasActiveSession = session.status === 'active'

  function handleGenerateNew() {
    dispatch({ type: 'END_SESSION' })
    navigate('/setup/match-type')
  }

  function handleResume() {
    navigate('/match')
  }

  function handleNewSession() {
    dispatch({ type: 'END_SESSION' })
    navigate('/setup/match-type')
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
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '48px' }}>
        <h1
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          Matcha
        </h1>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Your friendly, simple match generator.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!hasActiveSession ? (
          <Button variant="primary" fullWidth onClick={handleGenerateNew}>
            Generate Matches
          </Button>
        ) : (
          <>
            <Button variant="secondary" fullWidth onClick={handleResume}>
              Resume Session
            </Button>
            <Button variant="ghost" fullWidth onClick={handleNewSession}>
              New Session
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
