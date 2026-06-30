import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function SelectWinner() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (matchId) {
      navigate(`/match?scoring=${encodeURIComponent(matchId)}&step=winner`, { replace: true })
      return
    }

    navigate('/match', { replace: true })
  }, [matchId, navigate])

  return null
}
