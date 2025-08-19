import { useState } from 'react'

function CoveredBall({ team, ballNumber, onBallClick, isRevealed, isSelected }) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    if (isRevealed || isAnimating) return
    
    setIsAnimating(true)
    setTimeout(() => {
      onBallClick(ballNumber)
      setIsAnimating(false)
    }, 500)
  }

  return (
    <div 
      className={`covered-ball ${isRevealed ? 'revealed' : ''} ${isSelected ? 'selected' : ''} ${isAnimating ? 'animating' : ''}`}
      onClick={handleClick}
    >
      <div className="ball-container">
        {!isRevealed && !isAnimating && (
          <div className="ball-cover">
            <div className="ball-number">{ballNumber}</div>
            <div className="ball-pattern"></div>
            <div className="ball-shine"></div>
          </div>
        )}
        
        {(isRevealed || isAnimating) && (
          <div className="ball-content">
            <div className="team-name">{team?.name}</div>
            <div className="team-country">{team?.country}</div>
            <div className="team-badge">⚽</div>
          </div>
        )}
        
        {isAnimating && (
          <div className="reveal-effect">
            <div className="crack-1"></div>
            <div className="crack-2"></div>
            <div className="crack-3"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoveredBall