// Round-robin fixture generation shared by league creation and squad changes.

export function generateRounds(players, matchType) {
  const rounds = []
  let playersList = [...players]

  // If odd number of players, add a dummy "BYE" player
  if (playersList.length % 2 === 1) {
    playersList.push({ id: 'bye', name: 'BYE' })
  }

  const totalPlayers = playersList.length
  const numRounds = totalPlayers - 1

  for (let round = 0; round < numRounds; round++) {
    const roundMatches = []

    for (let i = 0; i < totalPlayers / 2; i++) {
      const player1 = playersList[i]
      const player2 = playersList[totalPlayers - 1 - i]

      if (player1.id === 'bye' || player2.id === 'bye') {
        const real = player1.id === 'bye' ? player2 : player1
        if (real.id !== 'bye') {
          roundMatches.push({
            id: `round-${round}-bye-${real.id}`,
            player1: real,
            player2: { id: 'bye', name: 'BYE' },
            winner: real,
            completed: true,
            score: { player1: 3, player2: 0 }
          })
        }
      } else {
        roundMatches.push({
          id: `round-${round}-match-${i}`,
          player1,
          player2,
          winner: null,
          completed: false,
          score: { player1: 0, player2: 0 }
        })
      }
    }

    rounds.push(roundMatches)

    // Rotate players (except the first one which stays fixed)
    if (totalPlayers > 2) {
      const lastPlayer = playersList.pop()
      playersList.splice(1, 0, lastPlayer)
    }
  }

  if (matchType === 'double') {
    // Second leg: swap sides; winner/score derived from whichever side is the
    // bye placeholder AFTER the swap (this fixed a crash for odd player counts).
    const secondRounds = rounds.map(round => round.map(match => {
      const newPlayer1 = match.player2
      const newPlayer2 = match.player1
      const isBye = newPlayer1.id === 'bye' || newPlayer2.id === 'bye'
      const winner = isBye ? (newPlayer1.id === 'bye' ? newPlayer2 : newPlayer1) : null
      const score = isBye
        ? (newPlayer1.id === 'bye' ? { player1: 0, player2: 3 } : { player1: 3, player2: 0 })
        : { player1: 0, player2: 0 }

      return {
        ...match,
        id: `second-${match.id}`,
        player1: newPlayer1,
        player2: newPlayer2,
        winner,
        completed: isBye,
        score
      }
    }))
    return [...rounds, ...secondRounds]
  }

  return rounds
}

export function createDefaultDraw() {
  return {
    currentStep: 'pot-selection',
    selectedPot: null,
    availableTeams: [],
    selectedTeams: [],
    revealedBalls: [],
    drawCount: 0,
    stirWheelResult: null
  }
}

export function createDefaultSettings() {
  return {
    winPoints: 3,
    drawPoints: 1,
    losePoints: 0,
    allowDraws: false,
    showGoalDiff: true,
    showGoalsForAgainst: true,
    tiebreaker: 'two'
  }
}

// Admin (owner) key: 8 chars from an unambiguous alphabet (no 0/O, 1/I/L).
// Whoever holds this key can manage the league; viewers only need the 4-digit code.
const ADMIN_KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateAdminKey() {
  let key = ''
  const bytes = new Uint32Array(8)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 8; i++) {
    key += ADMIN_KEY_ALPHABET[bytes[i] % ADMIN_KEY_ALPHABET.length]
  }
  return key
}

// 4-digit league ID (1000-9999, so it's always exactly four digits).
export function generateLeagueId() {
  return String(1000 + Math.floor(Math.random() * 9000))
}

export function generateUniqueLeagueId(existingIds) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const id = generateLeagueId()
    if (!existingIds.includes(id)) return id
  }
  return generateLeagueId()
}
