export const TEAM_POTS = {
  pot1: {
    name: "Pot 1",
    teams: [
      { id: 1, name: "Manchester City", country: "England" },
      { id: 2, name: "Real Madrid", country: "Spain" },
      { id: 3, name: "Liverpool", country: "England" },
      { id: 4, name: "FC Bayern München", country: "Germany" },
      { id: 5, name: "Inter Milan", country: "Italy" },
      { id: 6, name: "FC Barcelona", country: "Spain" },
      { id: 7, name: "Paris Saint Germain", country: "France" },
      { id: 8, name: "Arsenal", country: "England" }
    ]
  },
  pot2: {
    name: "Pot 2", 
    teams: [
      { id: 9, name: "Newcastle United", country: "England" },
      { id: 10, name: "Aston Villa", country: "England" },
      { id: 11, name: "Tottenham Hotspur", country: "England" },
      { id: 12, name: "Borussia Dortmund", country: "Germany" },
      { id: 13, name: "AC Milan", country: "Italy" },
      { id: 14, name: "Chelsea", country: "England" },
      { id: 15, name: "Manchester United", country: "England" },
      { id: 16, name: "Atalanta", country: "Italy" },
      { id: 17, name: "Atletico Madrid", country: "Spain" },
      { id: 18, name: "Bayer 04 Leverkusen", country: "Germany" }
    ]
  },
  pot3: {
    name: "Pot 3",
    teams: [
      { id: 19, name: "RB Leipzig", country: "Germany" },
      { id: 20, name: "Juventus", country: "Italy" },
      { id: 21, name: "Fenerbahçe SK", country: "Turkey" },
      { id: 22, name: "Athletic Club", country: "Spain" },
      { id: 23, name: "Lazio", country: "Italy" },
      { id: 24, name: "Galatasaray", country: "Turkey" },
      { id: 25, name: "Napoli", country: "Italy" },
      { id: 26, name: "SL Benfica", country: "Portugal" },
      { id: 27, name: "Roma", country: "Italy" },
      { id: 28, name: "Crystal Palace", country: "England" },
      { id: 29, name: "Beşiktaş", country: "Turkey" }
    ]
  }
}

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