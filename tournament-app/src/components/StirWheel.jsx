import { useState, useEffect } from 'react'

function StirWheel({ leaderboard, onWheelComplete }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [showResult, setShowResult] = useState(false)

  // Probability weights: 1st place 10%, 2nd place 20%, 3rd place 25%, 4th place 45%
  const getWeightedRandomPlayer = () => {
    const sortedPlayers = [...leaderboard].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points // Descending for first place first
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })

    const weights = [10, 20, 25, 45] // 1st: 10%, 2nd: 20%, 3rd: 25%, 4th: 45%
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    const random = Math.random() * totalWeight

    let weightSum = 0
    for (let i = 0; i < Math.min(4, sortedPlayers.length); i++) {
      weightSum += weights[i]
      if (random <= weightSum) {
        return {
          player: sortedPlayers[i],
          position: i + 1,
          probability: weights[i]
        }
      }
    }

    // Fallback to fourth place
    return {
      player: sortedPlayers[3] || sortedPlayers[sortedPlayers.length - 1],
      position: 4,
      probability: weights[3]
    }
  }

  const showConfetti = () => {
    // Create confetti animation
    const confettiCount = 100
    const confettiContainer = document.createElement('div')
    confettiContainer.className = 'confetti-container'
    document.body.appendChild(confettiContainer)

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-piece'
      confetti.style.left = Math.random() * 100 + 'vw'
      confetti.style.animationDelay = Math.random() * 3 + 's'
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`
      confettiContainer.appendChild(confetti)
    }

    // Remove confetti after animation
    setTimeout(() => {
      document.body.removeChild(confettiContainer)
    }, 5000)
  }

  const spinWheel = () => {
    if (isSpinning) return
    
    setIsSpinning(true)
    setShowResult(false)
    
    // Random number of rotations between 5-8 full spins plus final position
    const extraRotations = 5 + Math.random() * 3
    const finalRotation = wheelRotation + (extraRotations * 360)
    
    setWheelRotation(finalRotation)
    
    // After 3 seconds, determine winner and show result
    setTimeout(() => {
      const result = getWeightedRandomPlayer()
      setSelectedPlayer(result)
      setIsSpinning(false)
      setShowResult(true)
      
      // Show confetti animation
      showConfetti()
      
      // Notify parent component after showing result
      setTimeout(() => {
        onWheelComplete(result)
      }, 2000)
    }, 3000)
  }

  useEffect(() => {
    // Auto-start spinning when component mounts
    const timer = setTimeout(() => {
      spinWheel()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  const getPositionText = (position) => {
    switch(position) {
      case 1: return '1st Place'
      case 2: return '2nd Place'
      case 3: return '3rd Place'  
      case 4: return '4th Place'
      default: return `${position}th Place`
    }
  }

  return (
    <div className="stir-wheel-container">
      <div className="stir-header">
        <h2>Time to stir things up! 😈</h2>
        <p>The wheel is spinning to select who can change their team...</p>
      </div>

      <div className="wheel-section">
        <div className="wheel-wrapper">
          <div 
            className={`wheel ${isSpinning ? 'spinning' : ''}`}
            style={{ transform: `rotate(${wheelRotation}deg)` }}
          >
            {leaderboard.slice(0, 4).map((player, index) => {
              const angle = (360 / Math.min(4, leaderboard.length)) * index
              const weights = [10, 20, 25, 45] // 1st: 10%, 2nd: 20%, 3rd: 25%, 4th: 45%
              return (
                <div 
                  key={player.player.id}
                  className="wheel-segment"
                  style={{ 
                    transform: `rotate(${angle}deg)`,
                    '--segment-color': `hsl(${120 + index * 60}, 70%, 50%)`
                  }}
                >
                  <div className="segment-content">
                    <div className="player-name">{player.player.name}</div>
                    <div className="probability">{weights[index]}%</div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="wheel-pointer">📍</div>
        </div>

        {isSpinning && (
          <div className="spinning-status">
            <div className="spinner"></div>
            <p>Spinning the wheel...</p>
          </div>
        )}
      </div>

      {showResult && selectedPlayer && (
        <div className="wheel-result">
          <div className="result-announcement">
            <div className="winner-icon">🎯</div>
            <h3>{selectedPlayer.player.player.name} is selected!</h3>
            <p className="position-info">
              Current position: {getPositionText(selectedPlayer.position)}
            </p>
            <p className="probability-info">
              Had a {selectedPlayer.probability}% chance of being selected
            </p>
            <div className="result-description">
              <strong>{selectedPlayer.player.player.name}</strong>, you can switch teams to any team you choose!
            </div>
          </div>
        </div>
      )}

      <div className="stir-info">
        <h4>How it works:</h4>
        <ul>
          <li>1st place: 10% chance</li>
          <li>2nd place: 20% chance</li>
          <li>3rd place: 25% chance</li>
          <li>4th place: 45% chance</li>
        </ul>
      </div>
    </div>
  )
}

export default StirWheel