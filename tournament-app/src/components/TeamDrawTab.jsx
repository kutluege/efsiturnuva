import PotSelection from './PotSelection'
import CoveredBall from './CoveredBall'
import StirWheel from './StirWheel'
import { TEAM_POTS, getRandomTeamsFromPot } from '../data/TeamData'
import { calculateLeaderboard } from '../utils/leaderboard'

const DEFAULT_DRAW = {
  currentStep: 'pot-selection',
  selectedPot: null,
  availableTeams: [],
  selectedTeams: [],
  revealedBalls: [],
  drawCount: 0,
  stirWheelResult: null
}

function TeamDrawTab({ tournament, draw, onDrawChange, isOwner = true, onBack }) {
  const {
    currentStep,
    selectedPot,
    availableTeams,
    selectedTeams,
    revealedBalls,
    drawCount,
    stirWheelResult
  } = draw || DEFAULT_DRAW

  const handlePotSelected = (potKey) => {
    if (!isOwner) return

    const potTeams = TEAM_POTS[potKey].teams
    const participantCount = tournament ? tournament.participants.length : 4
    const randomTeams = getRandomTeamsFromPot(potKey, Math.min(participantCount, potTeams.length))
    onDrawChange({ selectedPot: potKey, availableTeams: randomTeams })

    setTimeout(() => {
      onDrawChange({ currentStep: 'team-selection' })
    }, 1500)
  }

  const handleBallClick = (ballNumber) => {
    if (!isOwner || revealedBalls.includes(ballNumber)) return

    const newRevealedBalls = [...revealedBalls, ballNumber]
    onDrawChange({ revealedBalls: newRevealedBalls })

    // Check if all balls are revealed
    if (newRevealedBalls.length === availableTeams.length) {
      onDrawChange({ selectedTeams: availableTeams, drawCount: drawCount + 1 })

      // If it's a stir week and we have tournament data, show the wheel
      if (isStirWeek && tournament) {
        setTimeout(() => {
          onDrawChange({ currentStep: 'stir-wheel' })
        }, 2000)
      } else {
        setTimeout(() => {
          onDrawChange({ currentStep: 'completed' })
        }, 2000)
      }
    }
  }

  const handleWheelComplete = (result) => {
    if (!isOwner) return
    onDrawChange({ stirWheelResult: result, currentStep: 'completed' })
  }

  const handleNewDraw = () => {
    if (!isOwner) return
    onDrawChange({
      currentStep: 'pot-selection',
      selectedPot: null,
      availableTeams: [],
      selectedTeams: [],
      revealedBalls: [],
      stirWheelResult: null
    })
  }

  const handleTeamSwap = () => {
    if (!isOwner) return
    // Open team swap interface for the wheel winner
    // This could be expanded to show all teams for selection
    alert(`${stirWheelResult?.player?.player?.name} can now select any team they want!`)
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
  const isStirWeek = currentWeek === 3 || currentWeek === 6

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

      {!isOwner && (
        <div className="read-only-banner">Bu turnuvayı canlı takip ediyorsunuz (salt okunur)</div>
      )}

      {isStirWeek && currentStep === 'pot-selection' && (
        <div className="stir-announcement">
          <h2>Time to stir things up! 😈</h2>
          <p>This is week {currentWeek} - after the team draw, the wheel will spin!</p>
        </div>
      )}

      {currentStep === 'pot-selection' && (
        <PotSelection onPotSelected={handlePotSelected} interactive={isOwner} />
      )}

      {currentStep === 'team-selection' && (
        <div className="team-selection">
          <div className="selection-header">
            <h2>Team Selection</h2>
            <p>Selected Pot: <strong>{TEAM_POTS[selectedPot]?.name}</strong></p>
            <p>{isOwner ? 'Click the balls to reveal your teams!' : 'Takımlar açılıyor...'}</p>
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
                interactive={isOwner}
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
        isOwner ? (
          <StirWheel
            leaderboard={calculateLeaderboard(tournament)}
            onWheelComplete={handleWheelComplete}
          />
        ) : (
          <div className="stir-wheel-waiting">
            <h2>Time to stir things up! 😈</h2>
            <p>Çark döndürülüyor, sonuç bekleniyor...</p>
          </div>
        )
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
              {selectedTeams.map((team) => (
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
              {isOwner && (
                <button className="btn-team-swap" onClick={handleTeamSwap}>
                  Change Team for {stirWheelResult.player.player.name}
                </button>
              )}
            </div>
          )}

          {isOwner && (
            <div className="draw-actions">
              <button className="btn-new-draw" onClick={handleNewDraw}>
                Start New Draw
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeamDrawTab
