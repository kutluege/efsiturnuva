import { useState, useEffect } from 'react'
import PotSelection from './PotSelection'
import CoveredBall from './CoveredBall'
import StirWheel from './StirWheel'
import { TEAM_POTS, getRandomTeamsFromPot, getAllTeams } from '../data/TeamData'

function TeamDrawTab({ tournament, onBack }) {
  const [currentStep, setCurrentStep] = useState('pot-selection') // pot-selection, team-selection, stir-wheel, completed
  const [selectedPot, setSelectedPot] = useState(null)
  const [availableTeams, setAvailableTeams] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])
  const [revealedBalls, setRevealedBalls] = useState([])
  const [drawCount, setDrawCount] = useState(0)
  const [isStirWeek, setIsStirWeek] = useState(false)
  const [stirWheelResult, setStirWheelResult] = useState(null)
  
  // Calculate current tournament week based on completed matches and check if it's a stir week (3 or 6)
  useEffect(() => {
    if (tournament) {
      // Calculate completed rounds
      let completedRounds = 0
      for (let i = 0; i < tournament.rounds.length; i++) {
        const round = tournament.rounds[i]
        const allMatchesCompleted = round.every(match => match.completed)
        if (allMatchesCompleted) {
          completedRounds++
        } else {
          break // Stop at first incomplete round
        }
      }
      
      const currentWeek = completedRounds + 1
      setIsStirWeek(currentWeek === 3 || currentWeek === 6)
    }
  }, [tournament])

  const handlePotSelected = (potKey) => {
    setSelectedPot(potKey)
    const potTeams = TEAM_POTS[potKey].teams
    const participantCount = tournament ? tournament.participants.length : 4
    const randomTeams = getRandomTeamsFromPot(potKey, Math.min(participantCount, potTeams.length))
    setAvailableTeams(randomTeams)
    
    setTimeout(() => {
      setCurrentStep('team-selection')
    }, 1500)
  }

  const handleBallClick = (ballNumber) => {
    if (revealedBalls.includes(ballNumber)) return
    
    setRevealedBalls([...revealedBalls, ballNumber])
    
    // Check if all balls are revealed
    if (revealedBalls.length + 1 === availableTeams.length) {
      setSelectedTeams(availableTeams)
      setDrawCount(drawCount + 1)
      
      // If it's a stir week and we have tournament data, show the wheel
      if (isStirWeek && tournament) {
        setTimeout(() => {
          setCurrentStep('stir-wheel')
        }, 2000)
      } else {
        setTimeout(() => {
          setCurrentStep('completed')
        }, 2000)
      }
    }
  }

  const handleWheelComplete = (result) => {
    setStirWheelResult(result)
    setCurrentStep('completed')
  }

  const handleNewDraw = () => {
    setCurrentStep('pot-selection')
    setSelectedPot(null)
    setAvailableTeams([])
    setSelectedTeams([])
    setRevealedBalls([])
    setStirWheelResult(null)
  }

  const handleTeamSwap = () => {
    // Open team swap interface for the wheel winner
    // This could be expanded to show all teams for selection
    alert(`${stirWheelResult?.player?.player?.name} can now select any team they want!`)
  }

  // Calculate leaderboard for stir wheel
  const getLeaderboard = () => {
    if (!tournament) return []
    
    const standings = {}
    
    tournament.participants.forEach(participant => {
      standings[participant.id] = {
        player: participant,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        matches: []
      }
    })

    tournament.rounds.forEach(round => {
      round.forEach(match => {
        if (match.completed && match.player2.id !== 'bye') {
          const player1Stats = standings[match.player1.id]
          const player2Stats = standings[match.player2.id]
          
          player1Stats.goalsFor += match.score.player1
          player1Stats.goalsAgainst += match.score.player2
          player2Stats.goalsFor += match.score.player2
          player2Stats.goalsAgainst += match.score.player1

          if (match.winner === 'draw') {
            player1Stats.points += 1
            player2Stats.points += 1
            player1Stats.draws += 1
            player2Stats.draws += 1
          } else if (match.winner?.id === match.player1.id) {
            player1Stats.points += 3
            player1Stats.wins += 1
            player2Stats.losses += 1
          } else {
            player2Stats.points += 3
            player2Stats.wins += 1
            player1Stats.losses += 1
          }
        }
      })
    })

    Object.values(standings).forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst
    })

    return Object.values(standings).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })
  }

  // Calculate current week based on completed rounds
  const getCurrentWeek = () => {
    if (!tournament) return 1
    
    let completedRounds = 0
    for (let i = 0; i < tournament.rounds.length; i++) {
      const round = tournament.rounds[i]
      const allMatchesCompleted = round.every(match => match.completed)
      if (allMatchesCompleted) {
        completedRounds++
      } else {
        break
      }
    }
    
    return completedRounds + 1
  }
  
  const currentWeek = getCurrentWeek()

  return (
    <div className="team-draw-tab">
      <div className="team-draw-header">
        <button className="btn-back" onClick={onBack}>← Back to Tournament</button>
        <div className="draw-info">
          <h1>Team Draw</h1>
          <div className="draw-stats">
            <span>Draw #{drawCount + 1}</span>
            <span>Week {currentWeek}</span>
            {isStirWeek && (
              <span className="stir-indicator">🔥 Stir Week!</span>
            )}
          </div>
        </div>
      </div>

      {isStirWeek && currentStep === 'pot-selection' && (
        <div className="stir-announcement">
          <h2>Time to stir things up! 😈</h2>
          <p>This is week {currentWeek} - after the team draw, the wheel will spin!</p>
        </div>
      )}

      {currentStep === 'pot-selection' && (
        <PotSelection onPotSelected={handlePotSelected} />
      )}

      {currentStep === 'team-selection' && (
        <div className="team-selection">
          <div className="selection-header">
            <h2>Team Selection</h2>
            <p>Selected Pot: <strong>{TEAM_POTS[selectedPot]?.name}</strong></p>
            <p>Click the balls to reveal your teams!</p>
          </div>

          <div className="balls-container">
            {availableTeams.map((team, index) => (
              <CoveredBall
                key={team.id}
                team={team}
                ballNumber={index + 1}
                onBallClick={handleBallClick}
                isRevealed={revealedBalls.includes(index + 1)}
                isSelected={selectedTeams.includes(team)}
              />
            ))}
          </div>

          <div className="selection-progress">
            <p>{revealedBalls.length} of {availableTeams.length} teams revealed</p>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(revealedBalls.length / availableTeams.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'stir-wheel' && tournament && (
        <StirWheel 
          leaderboard={getLeaderboard()} 
          onWheelComplete={handleWheelComplete}
        />
      )}

      {currentStep === 'completed' && (
        <div className="draw-completed">
          <div className="completion-header">
            <div className="success-icon">🎉</div>
            <h2>Draw Complete!</h2>
            <p>Week {currentWeek} team assignments</p>
          </div>

          <div className="selected-teams-display">
            <h3>Your Teams from {TEAM_POTS[selectedPot]?.name}:</h3>
            <div className="teams-grid">
              {selectedTeams.map((team, index) => (
                <div key={team.id} className="team-card">
                  <div className="team-badge">⚽</div>
                  <div className="team-info">
                    <div className="team-name">{team.name}</div>
                    <div className="team-country">{team.country}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stirWheelResult && (
            <div className="stir-result">
              <h3>Stir Result:</h3>
              <div className="winner-announcement">
                <strong>{stirWheelResult.player.player.name}</strong> was selected by the wheel!
                <br />
                They can change their team to any team they want.
              </div>
              <button className="btn-team-swap" onClick={handleTeamSwap}>
                Change Team for {stirWheelResult.player.player.name}
              </button>
            </div>
          )}

          <div className="draw-actions">
            <button className="btn-new-draw" onClick={handleNewDraw}>
              Start New Draw
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamDrawTab