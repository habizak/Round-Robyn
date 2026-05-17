import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { Button } from '../components/Button'
import { AppLogo } from '../components/AppLogo'

const homeFont = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"

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
        padding: '24px 24px 40px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <AppLogo size={160} />
        <h1
          style={{
            fontFamily: homeFont,
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginTop: '20px',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          Matcha
        </h1>
        <p
          style={{
            fontFamily: homeFont,
            fontSize: '16px',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            lineHeight: 1.4,
            maxWidth: '280px',
          }}
        >
          Your friendly, simple match generator.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
        }}
      >
        {!hasActiveSession ? (
          <Button variant="primary" fullWidth pill onClick={handleGenerateNew}>
            Generate Matches
          </Button>
        ) : (
          <>
            <Button variant="primary" fullWidth pill onClick={handleResume}>
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
