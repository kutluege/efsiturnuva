import { useState } from 'react'

function CoveredBall({ team, ballNumber, onBallClick, isRevealed, interactive = true }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (!interactive || isRevealed || isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      onBallClick(ballNumber)
      setIsAnimating(false)
    }, 500)
  }

  return (
    <div
      className={`ball-wrap ${!interactive ? 'readonly' : ''}`}
      onClick={handleClick}
    >
      {!isRevealed && !isAnimating && (
        <div className="ball-cover">
          <div className="ball-number">{ballNumber}</div>
        </div>
      )}

      {(isRevealed || isAnimating) && (
        <div className="ball-revealed">
          <div className="team-name">{team?.name}</div>
          <div className="team-country">{team?.country}</div>
        </div>
      )}
    </div>
  )
}

export default CoveredBall
