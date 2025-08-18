import { useState } from 'react'
import './App.css'

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
    if (participants.length === participantCount && tournamentName.trim()) {
      const shuffled = [...participants].sort(() => Math.random() - 0.5)
      const rounds = generateBracket(shuffled)
      setTournament({
        name: tournamentName,
        participants: shuffled,
        rounds: rounds,
        currentRound: 0
      })
      setCurrentView('tournament')
    }
  }

  const generateBracket = (players) => {
    const rounds = []
    let currentRound = [...players]
    
    while (currentRound.length > 1) {
      const matches = []
      for (let i = 0; i < currentRound.length; i += 2) {
        if (i + 1 < currentRound.length) {
          matches.push({
            id: `${rounds.length}-${i/2}`,
            player1: currentRound[i],
            player2: currentRound[i + 1],
            winner: null,
            completed: false,
            score: { player1: 0, player2: 0 }
          })
        } else if (currentRound.length % 2 === 1) {
          // Bye - player advances automatically
          matches.push({
            id: `${rounds.length}-${i/2}`,
            player1: currentRound[i],
            player2: { id: 'bye', name: 'BYE' },
            winner: currentRound[i],
            completed: true,
            score: { player1: 1, player2: 0 }
          })
        }
      }
      rounds.push(matches)
      currentRound = new Array(Math.ceil(currentRound.length / 2)).fill(null)
    }
    
    return rounds
  }

  const updateMatchResult = (roundIndex, matchId, winnerId, score) => {
    setTournament(prev => {
      const newTournament = { ...prev }
      const updatedRounds = [...newTournament.rounds]
      
      // Update the specific match
      const round = [...updatedRounds[roundIndex]]
      const matchIndex = round.findIndex(m => m.id === matchId)
      
      if (matchIndex >= 0) {
        round[matchIndex] = {
          ...round[matchIndex],
          winner: winnerId === round[matchIndex].player1.id ? round[matchIndex].player1 : round[matchIndex].player2,
          completed: true,
          score: score
        }
        
        updatedRounds[roundIndex] = round
        
        // Check if all matches in current round are completed
        const allCompleted = round.every(match => match.completed)
        
        if (allCompleted && roundIndex < updatedRounds.length - 1) {
          // Advance winners to next round
          const nextRound = [...updatedRounds[roundIndex + 1]]
          round.forEach((match, idx) => {
            const nextMatchIndex = Math.floor(idx / 2)
            if (nextMatchIndex < nextRound.length) {
              if (idx % 2 === 0) {
                nextRound[nextMatchIndex] = {
                  ...nextRound[nextMatchIndex],
                  player1: match.winner
                }
              } else {
                nextRound[nextMatchIndex] = {
                  ...nextRound[nextMatchIndex],
                  player2: match.winner
                }
              }
            }
          })
          updatedRounds[roundIndex + 1] = nextRound
        }
        
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
        <ParticipantManager
          participants={participants}
          participantCount={participantCount}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
          onGenerateTournament={generateTournament}
          onBack={() => setCurrentView('setup')}
        />
      )}
    </div>
  )
}

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

  const exportToExcel = () => {
    // Create CSV data
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
    // Create a simple canvas-based export
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 800
    canvas.height = 600
    
    // Set background
    ctx.fillStyle = '#f4c430'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Set text style
    ctx.fillStyle = '#333'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    
    // Tournament title
    ctx.fillText(tournament.name, canvas.width / 2, 40)
    
    // Draw rounds
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
    
    // Download the image
    const link = document.createElement('a')
    link.download = `${tournament.name}_turnuva.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="tournament-view">
      <div className="tournament-header">
        <button className="btn-back" onClick={onBack}>← Geri</button>
        <h1>{tournament.name}</h1>
        <button className="btn-settings" onClick={() => setShowSettings(true)}>⚙️</button>
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
                    <span className={`player ${match.winner?.id === match.player1.id ? 'winner' : ''}`}>
                      {match.player1.name}
                    </span>
                    <span className="vs">vs</span>
                    <span className={`player ${match.winner?.id === match.player2.id ? 'winner' : ''}`}>
                      {match.player2.name}
                    </span>
                  </div>
                  {match.completed && (
                    <div className="match-result">
                      Kazanan: {match.winner.name}
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

function MatchResultModal({ match, onResult, onClose }) {
  const [selectedWinner, setSelectedWinner] = useState('')
  const [score1, setScore1] = useState('')
  const [score2, setScore2] = useState('')

  const handleSubmit = () => {
    if (selectedWinner && score1 !== '' && score2 !== '') {
      onResult(selectedWinner, {
        player1: parseInt(score1),
        player2: parseInt(score2)
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

        <div className="winner-selection">
          <label>Kazanan</label>
          <div className="winner-options">
            <label className="radio-option">
              <input
                type="radio"
                name="winner"
                value={match.player1.id}
                checked={selectedWinner === match.player1.id}
                onChange={(e) => setSelectedWinner(e.target.value)}
              />
              {match.player1.name}
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="winner"
                value={match.player2.id}
                checked={selectedWinner === match.player2.id}
                onChange={(e) => setSelectedWinner(e.target.value)}
              />
              {match.player2.name}
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>İptal</button>
          <button 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={!selectedWinner || score1 === '' || score2 === ''}
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

export default App