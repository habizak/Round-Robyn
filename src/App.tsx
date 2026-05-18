import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SessionProvider, useSession } from './hooks/useSession'
import { Home } from './screens/Home'
import { MatchType } from './screens/MatchType'
import { Players } from './screens/Players'
import { WinningPoint } from './screens/WinningPoint'
import { Court } from './screens/Court'
import { Match } from './screens/Match'
import { SelectWinner } from './screens/SelectWinner'
import { InsertScore } from './screens/InsertScore'
import { GenerateMatch } from './screens/GenerateMatch'

function ActiveSessionRedirect() {
  const { session } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (session.status === 'active') {
      const path = window.location.pathname
      if (path.startsWith('/setup')) {
        navigate('/match', { replace: true })
      }
    }
  }, [session.status, navigate])

  return null
}

function AppRoutes() {
  return (
    <>
      <ActiveSessionRedirect />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup/match-type" element={<MatchType />} />
        <Route path="/setup/players" element={<Players />} />
        <Route path="/setup/winning-point" element={<WinningPoint />} />
        <Route path="/setup/court" element={<Court />} />
        <Route path="/match" element={<Match />} />
        <Route path="/match/generate/:courtId" element={<GenerateMatch />} />
        <Route path="/match/score/:matchId/winner" element={<SelectWinner />} />
        <Route path="/match/score/:matchId/score" element={<InsertScore />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
        <Analytics />
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
