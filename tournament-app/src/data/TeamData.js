// `overall` is an approximate FC26-style club strength rating (1-99), hand-estimated for
// sorting/draw-balance purposes rather than pulled from an official EA database.
const RAW_TEAM_POTS = {
  pot1: {
    name: "Pot 1",
    teams: [
      { id: 1, name: "Manchester City", country: "England", overall: 88 },
      { id: 2, name: "Real Madrid", country: "Spain", overall: 89 },
      { id: 3, name: "Liverpool", country: "England", overall: 87 },
      { id: 4, name: "FC Bayern München", country: "Germany", overall: 87 },
      { id: 5, name: "Inter Milan", country: "Italy", overall: 85 },
      { id: 6, name: "FC Barcelona", country: "Spain", overall: 87 },
      { id: 7, name: "Paris Saint Germain", country: "France", overall: 88 },
      { id: 8, name: "Arsenal", country: "England", overall: 85 }
    ]
  },
  pot2: {
    name: "Pot 2",
    teams: [
      { id: 9, name: "Newcastle United", country: "England", overall: 80 },
      { id: 10, name: "Aston Villa", country: "England", overall: 80 },
      { id: 11, name: "Tottenham Hotspur", country: "England", overall: 81 },
      { id: 12, name: "Borussia Dortmund", country: "Germany", overall: 83 },
      { id: 13, name: "AC Milan", country: "Italy", overall: 82 },
      { id: 14, name: "Chelsea", country: "England", overall: 82 },
      { id: 15, name: "Manchester United", country: "England", overall: 81 },
      { id: 16, name: "Atalanta", country: "Italy", overall: 81 },
      { id: 17, name: "Atletico Madrid", country: "Spain", overall: 84 },
      { id: 18, name: "Bayer 04 Leverkusen", country: "Germany", overall: 82 },
      { id: 30, name: "Sporting CP", country: "Portugal", overall: 82 },
      { id: 31, name: "PSV Eindhoven", country: "Netherlands", overall: 80 }
    ]
  },
  pot3: {
    name: "Pot 3",
    teams: [
      { id: 19, name: "RB Leipzig", country: "Germany", overall: 80 },
      { id: 20, name: "Juventus", country: "Italy", overall: 83 },
      { id: 21, name: "Fenerbahçe SK", country: "Turkey", overall: 78 },
      { id: 22, name: "Athletic Club", country: "Spain", overall: 79 },
      { id: 23, name: "Lazio", country: "Italy", overall: 78 },
      { id: 24, name: "Galatasaray", country: "Turkey", overall: 79 },
      { id: 25, name: "Napoli", country: "Italy", overall: 84 },
      { id: 26, name: "SL Benfica", country: "Portugal", overall: 81 },
      { id: 27, name: "Roma", country: "Italy", overall: 80 },
      { id: 28, name: "Crystal Palace", country: "England", overall: 77 },
      { id: 29, name: "Beşiktaş", country: "Turkey", overall: 76 },
      { id: 32, name: "Club Brugge", country: "Belgium", overall: 78 },
      { id: 33, name: "Olympiacos", country: "Greece", overall: 77 },
      { id: 34, name: "Union Saint-Gilloise", country: "Belgium", overall: 74 },
      { id: 35, name: "Bodø/Glimt", country: "Norway", overall: 73 },
      { id: 36, name: "Qarabağ", country: "Azerbaijan", overall: 72 },
      { id: 37, name: "Pafos FC", country: "Cyprus", overall: 70 }
    ]
  }
}

function sortPotByOverall(pot) {
  return { ...pot, teams: [...pot.teams].sort((a, b) => b.overall - a.overall) }
}

export const TEAM_POTS = Object.fromEntries(
  Object.entries(RAW_TEAM_POTS).map(([key, pot]) => [key, sortPotByOverall(pot)])
)

export const getAllTeams = () => {
  return [
    ...TEAM_POTS.pot1.teams,
    ...TEAM_POTS.pot2.teams,
    ...TEAM_POTS.pot3.teams
  ]
}

export const getTeamById = (id) => {
  const allTeams = getAllTeams()
  return allTeams.find(team => team.id === id)
}

export const getRandomTeamsFromPot = (potKey, count) => {
  const pot = TEAM_POTS[potKey]
  if (!pot || count > pot.teams.length) {
    return []
  }

  const shuffled = [...pot.teams].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const POT_KEYS = ['pot1', 'pot2', 'pot3']
