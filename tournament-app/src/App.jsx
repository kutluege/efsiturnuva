import { useState, useEffect, useRef } from 'react'
import './App.css'
import TeamDrawTab from './components/TeamDrawTab'
import { calculateLeaderboard } from './utils/leaderboard'
import { loadLocalState } from './utils/localPersistence'
import { useTournamentPersistence } from './hooks/useTournamentPersistence'
import { isFirebaseConfigured } from './firebase'
import { createRemoteTournament, updateRemoteTournament, subscribeToTournament, joinCodeExists } from './services/tournamentSync'

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

function TournamentView({ tournament, onBack, onUpdateMatch, onUpdateDraw, isOwner, syncCode }) {
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTab, setCurrentTab] = useState('tournament') // tournament, team-draw

  const handleMatchClick = (roundIndex, match) => {
    if (!isOwner) return
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
    const tournamentUrl = syncCode
      ? `${window.location.origin}${window.location.pathname}?join=${syncCode}`
      : window.location.href
    const subject = encodeURIComponent(`${tournament.name} Turnuva Takibi`)
    const codeLine = syncCode ? `\nTakip Kodu: ${syncCode}\n` : ''
    const body = encodeURIComponent(`Merhaba,

${tournament.name} turnuvasını canlı olarak takip edebilirsiniz:
${tournamentUrl}
${codeLine}
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

  const leaderboard = calculateLeaderboard(tournament)
  const tournamentCompleted = isTournamentCompleted()

  if (currentTab === 'team-draw') {
    return (
      <TeamDrawTab
        tournament={tournament}
        draw={tournament.draw}
        onDrawChange={onUpdateDraw}
        isOwner={isOwner}
        onBack={() => setCurrentTab('tournament')}
      />
    )
  }

  return (
    <div className="tournament-view">
      <div className="tournament-header">
        <button className="btn-back" onClick={onBack}>← Geri</button>
        <h1>{tournament.name}</h1>
        <div className="header-actions">
          <button className="btn-tab" onClick={() => setCurrentTab('team-draw')}>🎯 Team Draw</button>
          {isOwner && (
            <button className="btn-settings" onClick={() => setShowSettings(true)}>⚙️</button>
          )}
        </div>
      </div>

      {isOwner && syncCode && (
        <div className="sync-code-banner">
          <span>Takip Kodu: <strong>{syncCode}</strong></span>
          <button
            className="btn-copy-code"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?join=${syncCode}`)}
          >
            Bağlantıyı Kopyala
          </button>
        </div>
      )}

      {!isOwner && (
        <div className="read-only-banner">Bu turnuvayı canlı takip ediyorsunuz (salt okunur)</div>
      )}

      {/* Leaderboard */}
      <div className="leaderboard">
        <div className="leaderboard-title">
          <img 
            src="https://assets.stickpng.com/images/5842fe06a6515b1e0ad75b3b.png" 
            alt="UCL Logo" 
            className="ucl-logo"
            onError={(e) => {
              e.target.src = "https://brandslogos.com/wp-content/uploads/images/large/uefa-champions-league-logo-1.png"
            }}
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
                  className={`match ${match.completed ? 'completed' : 'pending'} ${isOwner && match.player1.id !== 'bye' && match.player2.id !== 'bye' && !match.completed ? 'clickable' : ''}`}
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
  const [stored] = useState(() => loadLocalState())

  const [tournamentName, setTournamentName] = useState(() => stored?.tournamentName ?? '')
  const [participantCount, setParticipantCount] = useState(() => stored?.participantCount ?? 4)
  const [matchType, setMatchType] = useState(() => stored?.matchType ?? 'double')
  const [participants, setParticipants] = useState(() => stored?.participants ?? [])
  const [currentView, setCurrentView] = useState(() => stored?.tournament ? 'tournament' : (stored?.currentView ?? 'setup'))
  const [tournament, setTournament] = useState(() => stored?.tournament ?? null)
  const [syncState, setSyncState] = useState(() => stored?.sync ?? { tournamentCode: null, isOwner: true })
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const hasAutoJoined = useRef(false)

  useTournamentPersistence({ tournamentName, participantCount, matchType, participants, currentView, tournament, sync: syncState })

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
        const secondRounds = rounds.map((round) => {
          return round.map((match) => {
            // Swap player1 and player2 for the second leg
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
          })
        })
        rounds = [...rounds, ...secondRounds]
      }
      
      const newTournament = {
        name: tournamentName.trim() || 'Turnuva',
        participants: shuffled,
        rounds: rounds,
        currentRound: 0,
        draw: {
          currentStep: 'pot-selection',
          selectedPot: null,
          availableTeams: [],
          selectedTeams: [],
          revealedBalls: [],
          drawCount: 0,
          stirWheelResult: null
        },
        settings: {
          winPoints: 3,
          drawPoints: 1,
          losePoints: 0,
          allowDraws: false,
          showGoalDiff: true,
          showGoalsForAgainst: true,
          tiebreaker: 'two'
        }
      }

      setTournament(newTournament)
      setSyncState({ tournamentCode: null, isOwner: true })
      setCurrentView('tournament')

      if (isFirebaseConfigured) {
        createRemoteTournament(newTournament)
          .then(code => {
            if (code) setSyncState({ tournamentCode: code, isOwner: true })
          })
          .catch(err => console.error('[firebase] failed to create remote tournament', err))
      }
    }
  }

  const generateBracket = (players) => {
    const rounds = []
    const numPlayers = players.length
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
    if (!syncState.isOwner) return
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

  const updateDraw = (partialDraw) => {
    if (!syncState.isOwner) return
    setTournament(prev => prev ? { ...prev, draw: { ...prev.draw, ...partialDraw } } : prev)
  }

  // Owner write-through: push every tournament change (match results, draw progress,
  // settings) to Firestore so followers watching the join code see it live.
  useEffect(() => {
    if (!isFirebaseConfigured || !syncState.isOwner || !syncState.tournamentCode || !tournament) return
    const timer = setTimeout(() => {
      updateRemoteTournament(syncState.tournamentCode, tournament)
        .catch(err => console.error('[firebase] failed to sync tournament', err))
    }, 400)
    return () => clearTimeout(timer)
  }, [tournament, syncState.isOwner, syncState.tournamentCode])

  // Follower subscription: replace local tournament state with whatever the owner last wrote.
  useEffect(() => {
    if (!syncState.tournamentCode || syncState.isOwner) return
    const unsubscribe = subscribeToTournament(
      syncState.tournamentCode,
      data => setTournament(data),
      () => setJoinError('Kod bulunamadı veya bağlantı kurulamadı.')
    )
    return unsubscribe
  }, [syncState.tournamentCode, syncState.isOwner])

  const joinTournament = async (rawCode) => {
    const code = rawCode.trim().toUpperCase()
    if (!code) return
    if (!isFirebaseConfigured) {
      setJoinError('Canlı takip şu anda yapılandırılmamış.')
      return
    }
    setIsJoining(true)
    setJoinError('')
    const exists = await joinCodeExists(code)
    setIsJoining(false)
    if (!exists) {
      setJoinError('Kod bulunamadı.')
      return
    }
    setSyncState({ tournamentCode: code, isOwner: false })
    setCurrentView('tournament')
  }

  // Auto-join if the page was opened via a shared ?join=CODE link.
  useEffect(() => {
    if (hasAutoJoined.current || tournament) return
    hasAutoJoined.current = true
    const codeFromUrl = new URLSearchParams(window.location.search).get('join')
    if (codeFromUrl) {
      setJoinCodeInput(codeFromUrl)
      joinTournament(codeFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (currentView === 'tournament' && tournament) {
    return (
      <TournamentView
        tournament={tournament}
        onBack={() => setCurrentView('setup')}
        onUpdateMatch={updateMatchResult}
        onUpdateDraw={updateDraw}
        isOwner={syncState.isOwner}
        syncCode={syncState.tournamentCode}
      />
    )
  }

  if (currentView === 'tournament' && !tournament && !syncState.isOwner) {
    return (
      <div className="tournament-connecting">
        <div className="spinner"></div>
        <p>Turnuvaya bağlanılıyor...</p>
      </div>
    )
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

      <div className="join-tournament">
        <h2>Bir Turnuvayı Takip Et</h2>
        <p>Takip kodunuz varsa buraya girerek turnuvayı canlı izleyebilirsiniz.</p>
        <div className="join-form">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => { setJoinCodeInput(e.target.value.toUpperCase()); setJoinError('') }}
            placeholder="Takip Kodu (örn. AB3XQ9)"
            maxLength={6}
          />
          <button
            className="btn-primary"
            onClick={() => joinTournament(joinCodeInput)}
            disabled={!joinCodeInput.trim() || isJoining}
          >
            {isJoining ? 'Bağlanılıyor...' : 'Katıl'}
          </button>
        </div>
        {joinError && <p className="join-error">{joinError}</p>}
        {!isFirebaseConfigured && (
          <p className="join-info">Canlı takip özelliği bu ortamda yapılandırılmamış.</p>
        )}
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