// Standings for a league. Counts both the current fixtures AND archived matches
// from `matchHistory` (matches played before the squad was changed), so player
// statistics survive fixture regenerations. Each side of a match is credited
// independently — a history match against a since-removed player still counts
// for the player who is still in the league.
export function calculateLeaderboard(tournament) {
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

  const creditMatch = (match) => {
    if (!match.completed || match.player1.id === 'bye' || match.player2.id === 'bye') return

    const player1Stats = standings[match.player1.id]
    const player2Stats = standings[match.player2.id]
    const isDraw = match.winner === 'draw'
    const p1Won = !isDraw && match.winner?.id === match.player1.id

    if (player1Stats) {
      player1Stats.goalsFor += match.score.player1
      player1Stats.goalsAgainst += match.score.player2
      player1Stats.matches.push({
        opponent: match.player2,
        goalsFor: match.score.player1,
        goalsAgainst: match.score.player2,
        result: isDraw ? 'draw' : (p1Won ? 'win' : 'loss')
      })
      if (isDraw) {
        player1Stats.points += 1
        player1Stats.draws += 1
      } else if (p1Won) {
        player1Stats.points += 3
        player1Stats.wins += 1
      } else {
        player1Stats.losses += 1
      }
    }

    if (player2Stats) {
      player2Stats.goalsFor += match.score.player2
      player2Stats.goalsAgainst += match.score.player1
      player2Stats.matches.push({
        opponent: match.player1,
        goalsFor: match.score.player2,
        goalsAgainst: match.score.player1,
        result: isDraw ? 'draw' : (p1Won ? 'loss' : 'win')
      })
      if (isDraw) {
        player2Stats.points += 1
        player2Stats.draws += 1
      } else if (p1Won) {
        player2Stats.losses += 1
      } else {
        player2Stats.points += 3
        player2Stats.wins += 1
      }
    }
  }

  // History first so form (last 5) stays roughly chronological.
  ;(tournament.matchHistory || []).forEach(creditMatch)
  tournament.rounds.forEach(round => round.forEach(creditMatch))

  Object.values(standings).forEach(stats => {
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst
  })

  const getHeadToHeadRecord = (playerA, playerB) => {
    let aPoints = 0
    let bPoints = 0

    playerA.matches.forEach(match => {
      if (match.opponent.id === playerB.player.id) {
        if (match.result === 'win') aPoints += 3
        else if (match.result === 'draw') aPoints += 1
      }
    })

    playerB.matches.forEach(match => {
      if (match.opponent.id === playerA.player.id) {
        if (match.result === 'win') bPoints += 3
        else if (match.result === 'draw') bPoints += 1
      }
    })

    return { aPoints, bPoints }
  }

  return Object.values(standings).sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points

    const headToHead = getHeadToHeadRecord(a, b)
    if (headToHead.aPoints !== headToHead.bPoints) {
      return headToHead.bPoints - headToHead.aPoints
    }

    if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference

    return b.goalsFor - a.goalsFor
  })
}
