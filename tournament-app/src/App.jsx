import { useState } from 'react'
import './App.css'

function ParticipantManager({ participants, participantCount, onAddParticipant, onRemoveParticipant, onGenerateTournament, onBack }) {
  const [newParticipantName, setNewParticipantName] = useState('')

  const handleAddParticipant = () => {
    onAddParticipant(newParticipantName)
    setNewParticipantName('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddParticipant()
    }
  }

  return (
    <div className="participant-manager">
      <button className="btn-back" onClick={onBack}>← Geri</button>
      
      <h2>Katılımcıları Ekle</h2>
      
      <div className="add-participant">
        <input
          type="text"
          value={newParticipantName}
          onChange={(e) => setNewParticipantName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Katılımcı adı girin"
          maxLength={20}
        />
        <button 
          onClick={handleAddParticipant}
          disabled={!newParticipantName.trim() || participants.length >= participantCount}
          className="btn-add"
        >
          Ekle
        </button>
      </div>

      <div className="participants-list">
        {participants.map(participant => (
          <div key={participant.id} className="participant-item">
            <span className="participant-icon">👤</span>
            <span className="participant-name">{participant.name}</span>
            <button 
              onClick={() => onRemoveParticipant(participant.id)}
              className="btn-remove"
            >
              Çıkar
            </button>
          </div>
        ))}
      </div>

      <div className="participant-status">
        {participants.length}/{participantCount} katılımcı eklendi
      </div>

      <button 
        className="btn-generate"
        onClick={onGenerateTournament}
        disabled={participants.length !== participantCount}
      >
        Kuraları Çek
      </button>
    </div>
  )
}

function MatchResultModal({ match, onResult, onClose }) {
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')

  const handleSubmit = () => {
    if (score1 !== '' && score2 !== '') {
      const s1 = parseInt(score1)
      const s2 = parseInt(score2)
      
      // Automatically determine winner based on scores
      let winner = null
      if (s1 > s2) {
        winner = match.player1.id
      } else if (s2 > s1) {
        winner = match.player2.id
      } else {
        winner = 'draw' // It's a draw
      }
      
      onResult(winner, {
        player1: s1,
        player2: s2
      })
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Maç Sonucu</h3>
        <div className="match-info">
          <div className="players">
            <span>{match.player1.name}</span>
            <span>vs</span>
            <span>{match.player2.name}</span>
          </div>
        </div>

        <div className="score-inputs">
          <div className="score-group">
            <label>{match.player1.name} Skoru</label>
            <input
              type="number"
              min="0"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
            />
          </div>
          <div className="score-group">
            <label>{match.player2.name} Skoru</label>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
            />
          </div>
        </div>


        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>İptal</button>
          <button 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={score1 === '' || score2 === ''}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

function TournamentSettingsModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal settings-modal">
        <h3>Turnuva Kuralları</h3>
        
        <div className="settings-content">
          <div className="setting-item">
            <label>Galibiyet Puanı</label>
            <input type="number" defaultValue="3" readOnly />
          </div>
          <div className="setting-item">
            <label>Beraberlik Puanı</label>
            <input type="number" defaultValue="1" readOnly />
          </div>
          <div className="setting-item">
            <label>Mağlubiyet Puanı</label>
            <input type="number" defaultValue="0" readOnly />
          </div>
          
          <div className="setting-item">
            <label>Maçlar Berabere Bitebilir</label>
            <div className="toggle-group">
              <label className="radio-option">
                <input type="radio" name="tie" value="yes" />
                Evet
              </label>
              <label className="radio-option">
                <input type="radio" name="tie" value="no" defaultChecked />
                Hayır
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label>Tabloda Averaj Farkını Göster</label>
            <div className="toggle-group">
              <label className="radio-option">
                <input type="radio" name="averaj" value="yes" defaultChecked />
                Evet
              </label>
              <label className="radio-option">
                <input type="radio" name="averaj" value="no" />
                Hayır
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label>Tabloda Atılan/Yenilen Alanlarını Göster</label>
            <div className="toggle-group">
              <label className="radio-option">
                <input type="radio" name="goals" value="yes" defaultChecked />
                Evet
              </label>
              <label className="radio-option">
                <input type="radio" name="goals" value="no" />
                Hayır
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label>Puan Eşitliğinde Averaj Sistemi</label>
            <div className="toggle-group">
              <label className="radio-option">
                <input type="radio" name="tiebreaker" value="two" defaultChecked />
                İkili
              </label>
              <label className="radio-option">
                <input type="radio" name="tiebreaker" value="general" />
                Genel
              </label>
            </div>
          </div>

          <div className="email-section">
            <h4>Email Bildirimi</h4>
            <p>Turnuvanın aktif edilmesi ve gerekli bilgilerin gönderilmesi için email adresinizi girmeniz gerekmektedir.</p>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Email adresinizi girin" />
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-confirm" onClick={onClose}>Gönder</button>
        </div>
      </div>
    </div>
  )
}

function TournamentView({ tournament, onBack, onUpdateMatch }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  const handleMatchClick = (roundIndex, match) => {
    if (!match.completed && match.player1.id !== 'bye' && match.player2.id !== 'bye') {
      setSelectedMatch({ roundIndex, match })
    }
  }

  const handleMatchResult = (winnerId, score) => {
    if (selectedMatch) {
      onUpdateMatch(selectedMatch.roundIndex, selectedMatch.match.id, winnerId, score)
      setSelectedMatch(null)
    }
  }

  // Calculate leaderboard
  const calculateLeaderboard = () => {
    const standings = {}
    
    // Initialize standings
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

    // Calculate points from all matches
    tournament.rounds.forEach(round => {
      round.forEach(match => {
        if (match.completed && match.player2.id !== 'bye') {
          const player1Stats = standings[match.player1.id]
          const player2Stats = standings[match.player2.id]
          
          player1Stats.goalsFor += match.score.player1
          player1Stats.goalsAgainst += match.score.player2
          player2Stats.goalsFor += match.score.player2
          player2Stats.goalsAgainst += match.score.player1
          
          player1Stats.matches.push({
            opponent: match.player2,
            goalsFor: match.score.player1,
            goalsAgainst: match.score.player2,
            result: match.winner === 'draw' ? 'draw' : (match.winner?.id === match.player1.id ? 'win' : 'loss')
          })
          
          player2Stats.matches.push({
            opponent: match.player1,
            goalsFor: match.score.player2,
            goalsAgainst: match.score.player1,
            result: match.winner === 'draw' ? 'draw' : (match.winner?.id === match.player2.id ? 'win' : 'loss')
          })

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

    // Calculate goal difference
    Object.values(standings).forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst
    })

    // Sort standings with head-to-head tiebreaker
    const sortedStandings = Object.values(standings).sort((a, b) => {
      // First by points
      if (a.points !== b.points) return b.points - a.points
      
      // Head-to-head record if points are tied
      const headToHead = getHeadToHeadRecord(a, b)
      if (headToHead.aPoints !== headToHead.bPoints) {
        return headToHead.bPoints - headToHead.aPoints
      }
      
      // Goal difference
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference
      
      // Goals scored
      return b.goalsFor - a.goalsFor
    })

    return sortedStandings
  }

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

  // Check if tournament is completed
  const isTournamentCompleted = () => {
    return tournament.rounds.every(round => 
      round.every(match => match.completed)
    )
  }

  const exportToExcel = () => {
    let csvContent = "Turnuva: " + tournament.name + "\n\n"
    
    tournament.rounds.forEach((round, roundIndex) => {
      csvContent += `${roundIndex + 1}. HAFTA\n`
      round.forEach(match => {
        if (match.player2.id === 'bye') {
          csvContent += `${match.player1.name} - BYE\n`
        } else {
          csvContent += `${match.player1.name} vs ${match.player2.name}`
          if (match.completed) {
            csvContent += ` - Kazanan: ${match.winner.name}`
          }
          csvContent += "\n"
        }
      })
      csvContent += "\n"
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${tournament.name}_turnuva.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareViaEmail = () => {
    const tournamentUrl = window.location.href
    const subject = encodeURIComponent(`${tournament.name} Turnuva Takibi`)
    const body = encodeURIComponent(`Merhaba,

${tournament.name} turnuvasını canlı olarak takip edebilirsiniz:
${tournamentUrl}

Turnuva detayları:
- Katılımcı Sayısı: ${tournament.participants.length}
- Toplam Hafta: ${tournament.rounds.length}

İyi maçlar!`)

    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const downloadAsImage = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 800
    canvas.height = 600
    
    ctx.fillStyle = '#f4c430'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#333'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    
    ctx.fillText(tournament.name, canvas.width / 2, 40)
    
    let yPos = 80
    tournament.rounds.forEach((round, roundIndex) => {
      ctx.font = 'bold 18px Arial'
      ctx.fillText(`${roundIndex + 1}. HAFTA`, canvas.width / 2, yPos)
      yPos += 30
      
      ctx.font = '14px Arial'
      round.forEach(match => {
        const matchText = match.player2.id === 'bye' ? 
          `${match.player1.name} - BYE` : 
          `${match.player1.name} vs ${match.player2.name}${match.completed ? ` (Kazanan: ${match.winner.name})` : ''}`
        
        ctx.fillText(matchText, canvas.width / 2, yPos)
        yPos += 25
      })
      yPos += 20
    })
    
    const link = document.createElement('a')
    link.download = `${tournament.name}_turnuva.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const leaderboard = calculateLeaderboard()
  const tournamentCompleted = isTournamentCompleted()

  return (
    <div className="tournament-view">
      <div className="tournament-header">
        <button className="btn-back" onClick={onBack}>← Geri</button>
        <h1>{tournament.name}</h1>
        <button className="btn-settings" onClick={() => setShowSettings(true)}>⚙️</button>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard">
        <div className="leaderboard-title">
          <img 
            src="https://logos-world.net/wp-content/uploads/2020/06/UEFA-Champions-League-Logo.png" 
            alt="UCL Logo" 
            className="ucl-logo"
          />
          <h2>PUAN TABLOSU</h2>
        </div>
        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <span>Sıra</span>
            <span>Oyuncu</span>
            <span>Puan</span>
            <span>G</span>
            <span>B</span>
            <span>M</span>
            <span>AG</span>
            <span>YG</span>
            <span>AV</span>
          </div>
          {leaderboard.map((player, index) => (
            <div 
              key={player.player.id} 
              className={`leaderboard-row ${index === 0 && tournamentCompleted ? 'champion' : ''}`}
            >
              <span className="position">{index + 1}</span>
              <span className="player-name">{player.player.name}</span>
              <span className="points">{player.points}</span>
              <span className="wins">{player.wins}</span>
              <span className="draws">{player.draws}</span>
              <span className="losses">{player.losses}</span>
              <span className="goals-for">{player.goalsFor}</span>
              <span className="goals-against">{player.goalsAgainst}</span>
              <span className="goal-diff">{player.goalDifference > 0 ? '+' : ''}{player.goalDifference}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tournament-rounds">
        {tournament.rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="round">
            <h3>{roundIndex + 1}. HAFTA</h3>
            <div className="matches">
              {round.map(match => (
                <div 
                  key={match.id} 
                  className={`match ${match.completed ? 'completed' : 'pending'} ${match.player1.id !== 'bye' && match.player2.id !== 'bye' && !match.completed ? 'clickable' : ''}`}
                  onClick={() => handleMatchClick(roundIndex, match)}
                >
                  <div className="match-players">
                    <span className={`player ${match.winner?.id === match.player1.id ? 'winner' : match.winner === 'draw' ? 'draw' : ''}`}>
                      {match.player1.name}
                      {match.completed && <span className="score">{match.score.player1}</span>}
                    </span>
                    <span className="vs">vs</span>
                    <span className={`player ${match.winner?.id === match.player2.id ? 'winner' : match.winner === 'draw' ? 'draw' : ''}`}>
                      {match.player2.name}
                      {match.completed && <span className="score">{match.score.player2}</span>}
                    </span>
                  </div>
                  {match.completed && (
                    <div className="match-result">
                      {match.winner === 'draw' ? 'Berabere' : `Kazanan: ${match.winner.name}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="tournament-actions">
        <button className="btn-action" onClick={exportToExcel}>Excel Dosyasında İndir</button>
        <button className="btn-action" onClick={shareViaEmail}>Email ile Paylaş</button>
        <button className="btn-action" onClick={downloadAsImage}>Resim Olarak İndir</button>
      </div>

      {selectedMatch && (
        <MatchResultModal
          match={selectedMatch.match}
          onResult={handleMatchResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {showSettings && (
        <TournamentSettingsModal
          tournament={tournament}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

function App() {
  const [tournamentName, setTournamentName] = useState('')
  const [participantCount, setParticipantCount] = useState(4)
  const [matchType, setMatchType] = useState('double')
  const [participants, setParticipants] = useState([])
  const [currentView, setCurrentView] = useState('setup')
  const [tournament, setTournament] = useState(null)

  const addParticipant = (name) => {
    if (name.trim() && participants.length < participantCount) {
      setParticipants([...participants, { id: Date.now(), name: name.trim() }])
    }
  }

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  const generateTournament = () => {
    if (participants.length === participantCount) {
      const shuffled = [...participants].sort(() => Math.random() - 0.5)
      let rounds = generateBracket(shuffled)
      
      // If double match is selected, duplicate the rounds
      if (matchType === 'double') {
        const secondRounds = rounds.map((round, roundIndex) => {
          return round.map((match, matchIndex) => {
            // Swap player1 and player2 for the second leg
            return {
              ...match,
              id: `second-${match.id}`,
              player1: match.player2,
              player2: match.player1,
              winner: match.id.includes('bye') ? match.player2 : null,
              completed: match.id.includes('bye'),
              score: match.id.includes('bye') ? { player1: 3, player2: 0 } : { player1: 0, player2: 0 }
            }
          })
        })
        rounds = [...rounds, ...secondRounds]
      }
      
      setTournament({
        name: tournamentName.trim() || 'Turnuva',
        participants: shuffled,
        rounds: rounds,
        currentRound: 0
      })
      setCurrentView('tournament')
    }
  }

  const generateBracket = (players) => {
    const rounds = []
    const numPlayers = players.length
    
    // Create proper round-robin schedule
    let schedule = []
    let playersList = [...players]
    
    // If odd number of players, add a dummy "BYE" player
    if (numPlayers % 2 === 1) {
      playersList.push({ id: 'bye', name: 'BYE' })
    }
    
    const totalPlayers = playersList.length
    const numRounds = totalPlayers - 1
    
    // Round-robin algorithm
    for (let round = 0; round < numRounds; round++) {
      const roundMatches = []
      
      for (let i = 0; i < totalPlayers / 2; i++) {
        const player1Index = i
        const player2Index = totalPlayers - 1 - i
        
        const player1 = playersList[player1Index]
        const player2 = playersList[player2Index]
        
        // Skip if one player is bye and the other is a real player
        if (player1.id === 'bye' || player2.id === 'bye') {
          if (player1.id !== 'bye') {
            roundMatches.push({
              id: `round-${round}-bye-${player1.id}`,
              player1: player1,
              player2: { id: 'bye', name: 'BYE' },
              winner: player1,
              completed: true,
              score: { player1: 3, player2: 0 }
            })
          } else if (player2.id !== 'bye') {
            roundMatches.push({
              id: `round-${round}-bye-${player2.id}`,
              player1: player2,
              player2: { id: 'bye', name: 'BYE' },
              winner: player2,
              completed: true,
              score: { player1: 3, player2: 0 }
            })
          }
        } else {
          roundMatches.push({
            id: `round-${round}-match-${i}`,
            player1: player1,
            player2: player2,
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
    
    return rounds
  }

  const updateMatchResult = (roundIndex, matchId, winnerId, score) => {
    setTournament(prev => {
      const newTournament = { ...prev }
      const updatedRounds = [...newTournament.rounds]
      
      const round = [...updatedRounds[roundIndex]]
      const matchIndex = round.findIndex(m => m.id === matchId)
      
      if (matchIndex >= 0) {
        const match = round[matchIndex]
        let winner = null
        
        if (winnerId === 'draw') {
          winner = 'draw'
        } else if (winnerId === match.player1.id) {
          winner = match.player1
        } else {
          winner = match.player2
        }
        
        round[matchIndex] = {
          ...match,
          winner: winner,
          completed: true,
          score: score
        }
        
        updatedRounds[roundIndex] = round
        newTournament.rounds = updatedRounds
      }
      
      return newTournament
    })
  }

  if (currentView === 'tournament' && tournament) {
    return <TournamentView tournament={tournament} onBack={() => setCurrentView('setup')} onUpdateMatch={updateMatchResult} />
  }

  return (
    <div className="tournament-app">
      <div className="tournament-setup">
        <h1>Turnuva Oluştur</h1>
        
        <div className="setup-form">
          <div className="form-group">
            <label>Turnuva İsmi</label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="deneme"
            />
          </div>

          <div className="form-group">
            <label>Katılımcı Sayısı</label>
            <input
              type="number"
              value={participantCount}
              onChange={(e) => setParticipantCount(Math.max(2, parseInt(e.target.value) || 2))}
              min="2"
              max="16"
            />
          </div>

          <div className="form-group">
            <label>Maç Usulü</label>
            <div className="match-type-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="matchType"
                  value="single"
                  checked={matchType === 'single'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                Tek Maç
              </label>
              <label className="radio-option selected">
                <input
                  type="radio"
                  name="matchType"
                  value="double"
                  checked={matchType === 'double'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                Çift Maç
              </label>
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={() => setCurrentView('participants')}
          >
            Katılımcı Ekle
          </button>
        </div>
      </div>

      {currentView === 'participants' && (
        <div className="modal-overlay">
          <ParticipantManager
            participants={participants}
            participantCount={participantCount}
            onAddParticipant={addParticipant}
            onRemoveParticipant={removeParticipant}
            onGenerateTournament={generateTournament}
            onBack={() => setCurrentView('setup')}
          />
        </div>
      )}
    </div>
  )
}

export default App