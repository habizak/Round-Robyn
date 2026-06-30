import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

type InsertScoreLocationState = {
  winnerTeam?: 'team1' | 'team2'
}

export function InsertScore() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const winnerTeam =
    (location.state as InsertScoreLocationState | null)?.winnerTeam ?? 'team1'

  useEffect(() => {
    if (matchId) {
      const winner = winnerTeam === 'team2' ? 'team2' : 'team1'
      navigate(
        `/match?scoring=${encodeURIComponent(matchId)}&step=score&winner=${winner}`,
        { replace: true },
      )
      return
    }

    navigate('/match', { replace: true })
  }, [matchId, navigate, winnerTeam])

  return null
}
