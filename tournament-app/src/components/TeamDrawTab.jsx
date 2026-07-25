import PotSelection from './PotSelection'
import CoveredBall from './CoveredBall'
import StirWheel from './StirWheel'
import { TEAM_POTS, getRandomTeamsFromPot } from '../data/TeamData'
import { calculateLeaderboard } from '../utils/leaderboard'
import { getCopy } from '../i18n'

const DEFAULT_DRAW = {
  currentStep: 'pot-selection',
  selectedPot: null,
  availableTeams: [],
  selectedTeams: [],
  revealedBalls: [],
  drawCount: 0,
  stirWheelResult: null
}

function TeamDrawTab({ tournament, draw, onDrawChange, isOwner = true, onBack, t: tProp }) {
  const t = tProp || getCopy('tr')

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
    <>
      <div className="screen-pad tight">
        <button className="btn-outline" onClick={onBack}>← {t.back}</button>
        <h1 className="screen-title" style={{ marginTop: 14 }}>{t.drawTitle}</h1>
        <div className="draw-badges">
          <div className="chip dark">{t.drawNo} #{drawCount + 1}</div>
          <div className="chip">{t.week} {currentWeek}</div>
          {isStirWeek && <div className="stir-chip">{t.stirWeek}</div>}
        </div>
      </div>

      {!isOwner && (
        <div className="readonly-banner" style={{ margin: '14px 18px 0' }}>{t.readOnlyBanner}</div>
      )}

      {currentStep === 'pot-selection' && (
        <div className="screen-pad tight">
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--ink)', margin: '12px 0' }}>
            {t.potHelp}
          </p>
          <PotSelection t={t} onPotSelected={handlePotSelected} interactive={isOwner} />
        </div>
      )}

      {currentStep === 'team-selection' && (
        <div className="screen-pad tight">
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--ink)' }}>
            {TEAM_POTS[selectedPot]?.name}
          </div>
          <div className="screen-title sm" style={{ fontSize: 26, marginTop: 4 }}>
            {isOwner ? t.tapBalls : t.ballsWaiting}
          </div>

          <div className="ball-grid">
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

          <div className="progress-row">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(revealedBalls.length / availableTeams.length) * 100}%` }} />
            </div>
            <div className="progress-label">{revealedBalls.length}/{availableTeams.length}</div>
          </div>
        </div>
      )}

      {currentStep === 'stir-wheel' && tournament && (
        isOwner ? (
          <StirWheel
            t={t}
            leaderboard={calculateLeaderboard(tournament)}
            onWheelComplete={handleWheelComplete}
          />
        ) : (
          <div className="wheel-screen">
            <div className="title">{t.stirTitle}</div>
            <div className="wheel-waiting">{t.stirWaiting}</div>
          </div>
        )
      )}

      {currentStep === 'completed' && (
        <div className="screen-pad tight">
          <div className="done-banner">
            <div className="title">{t.drawDone}</div>
            <div className="sub">{TEAM_POTS[selectedPot]?.name}</div>
          </div>

          <div className="done-list">
            {selectedTeams.map((team, index) => (
              <div key={team.id} className="done-team-row">
                <div className="soccer-ball done-team-badge"><div className="p p1" /><div className="p p2" /><div className="p p3" /></div>
                <div className="done-team-info">
                  <div className="name">{team.name}</div>
                  <div className="country">{team.country}</div>
                </div>
                <div className="done-team-owner">{tournament?.participants?.[index]?.name || ''}</div>
              </div>
            ))}
          </div>

          {stirWheelResult && (
            <div className="wheel-result-card" style={{ marginTop: 14 }}>
              <div className="kicker">{t.wheelPicked}</div>
              <div className="winner">{stirWheelResult.player.player.name}</div>
              <div className="note">{stirWheelResult.player.player.name} {t.stirSub}</div>
              {isOwner && (
                <button className="btn-outline-block" style={{ marginTop: 10 }} onClick={handleTeamSwap}>
                  {stirWheelResult.player.player.name}
                </button>
              )}
            </div>
          )}

          {isOwner && (
            <button className="btn-cta sm" style={{ marginTop: 14 }} onClick={handleNewDraw}>
              {t.newDraw}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default TeamDrawTab
