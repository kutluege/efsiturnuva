import { useState, useEffect } from 'react'
import { getCopy } from '../i18n'

function StirWheel({ leaderboard, onWheelComplete, t: tProp }) {
  const t = tProp || getCopy('tr')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weights = [10, 20, 25, 45]
  const topFour = leaderboard.slice(0, 4)
  const segAngle = 360 / Math.max(1, Math.min(4, topFour.length))

  return (
    <div className="wheel-screen">
      <div className="title">{t.stirTitle}</div>
      <div className="sub">{t.stirSub}</div>

      <div className="wheel-outer">
        <div className="wheel-disc" style={{ transform: `rotate(${wheelRotation}deg)` }}>
          {topFour.map((player, index) => (
            <div
              key={player.player.id}
              className={`wheel-segment ${index % 2 ? 'odd' : 'even'}`}
              style={{ transform: `rotate(${index * segAngle}deg)` }}
            >
              <div className="wheel-segment-inner" style={{ transform: `translateY(-50%) rotate(${-index * segAngle}deg)` }}>
                <div className="n">{player.player.name}</div>
                <div className="p">{weights[index]}%</div>
              </div>
            </div>
          ))}
        </div>
        <div className="wheel-pointer-tri" />
        <div className="wheel-center">EF</div>
      </div>

      {isSpinning && (
        <div style={{ marginTop: 14, color: 'var(--ink-soft)', fontWeight: 600 }}>
          <div className="spinner" style={{ margin: '0 auto 8px' }} />
        </div>
      )}

      {showResult && selectedPlayer && (
        <div className="wheel-result-card">
          <div className="kicker">{t.wheelPicked}</div>
          <div className="winner">{selectedPlayer.player.player.name}</div>
          <div className="note">{selectedPlayer.probability}% — {t.howItWorks}</div>
        </div>
      )}

      <div className="how-card">
        <div className="title">{t.howItWorks}</div>
        <div className="how-grid">
          <div className="how-cell"><div className="v">10%</div><div className="l">1.</div></div>
          <div className="how-cell"><div className="v">20%</div><div className="l">2.</div></div>
          <div className="how-cell"><div className="v">25%</div><div className="l">3.</div></div>
          <div className="how-cell"><div className="v">45%</div><div className="l">4.</div></div>
        </div>
      </div>
    </div>
  )
}

export default StirWheel
