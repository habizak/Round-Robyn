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
        alignItems: 'center',
      }}
    >
      <img
        src="/logo_matcha.png"
        alt="Matcha"
        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
      />

      <h1
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '36px',
          fontWeight: 700,
          color: '#3c3c3c',
          textAlign: 'center',
          marginTop: '16px',
        }}
      >
        Matcha
      </h1>

      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '14px',
          color: '#9a9a9a',
          textAlign: 'center',
          marginTop: '8px',
        }}
      >
        Your friendly, simple match generator.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', width: '100%' }}>
        {!hasActiveSession ? (
          <Button variant="primary" fullWidth onClick={handleGenerateNew}>
            Generate Matches
          </Button>
        ) : (
          <>
            <Button variant="secondary" fullWidth onClick={handleResume}>
              Resume Session
            </Button>
            <Button variant="primary" fullWidth onClick={handleGenerateNew}>
              Generate Matches
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
