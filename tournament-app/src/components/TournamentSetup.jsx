import { useState, useEffect } from 'react'

function TournamentSetup({ onStart, onSaveTournament, onSaveParticipants, tournament, participants }) {
  const [tournamentName, setTournamentName] = useState(tournament?.name || '')
  const [participantCount, setParticipantCount] = useState(tournament?.participantCount || 4)
  const [matchType, setMatchType] = useState(tournament?.matchType || 'double')
  const [currentParticipants, setCurrentParticipants] = useState(participants || [])
  const [newParticipantName, setNewParticipantName] = useState('')

  useEffect(() => {
    if (tournament) {
      setTournamentName(tournament.name)
      setParticipantCount(tournament.participantCount)
      setMatchType(tournament.matchType)
    }
    if (participants) {
      setCurrentParticipants(participants)
    }
  }, [tournament, participants])

  const addParticipant = () => {
    if (newParticipantName.trim() && currentParticipants.length < participantCount) {
      const newParticipant = {
        id: Date.now(),
        name: newParticipantName.trim()
      }
      const updatedParticipants = [...currentParticipants, newParticipant]
      setCurrentParticipants(updatedParticipants)
      onSaveParticipants(updatedParticipants)
      setNewParticipantName('')
    }
  }

  const removeParticipant = (id) => {
    const updatedParticipants = currentParticipants.filter(p => p.id !== id)
    setCurrentParticipants(updatedParticipants)
    onSaveParticipants(updatedParticipants)
  }

  const generateBracket = () => {
    if (currentParticipants.length === participantCount) {
      const tournamentData = {
        name: tournamentName,
        participantCount,
        matchType,
        createdAt: new Date().toISOString()
      }
      onSaveTournament(tournamentData)
      onStart()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addParticipant()
    }
  }

  return (
    <div className="tournament-setup">
      <div className="setup-container">
        <h1 className="setup-title">Turnuva Kurulumu</h1>
        
        <div className="setup-form">
          <div className="form-group">
            <label htmlFor="tournament-name">Turnuva İsmi</label>
            <input
              id="tournament-name"
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Turnuva adını girin"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="participant-count">Katılımcı Sayısı</label>
            <select
              id="participant-count"
              value={participantCount}
              onChange={(e) => setParticipantCount(Number(e.target.value))}
              className="form-select"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
            </select>
          </div>

          <div className="form-group">
            <label>Maç Usulü</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="single"
                  checked={matchType === 'single'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                <span className="radio-text">Tek Maç</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="double"
                  checked={matchType === 'double'}
                  onChange={(e) => setMatchType(e.target.value)}
                />
                <span className="radio-text">Çift Maç</span>
              </label>
            </div>
          </div>

          <button 
            onClick={generateBracket}
            className="generate-btn"
            disabled={currentParticipants.length !== participantCount || !tournamentName.trim()}
          >
            Kuraları Çek
          </button>
        </div>

        <div className="participants-section">
          <h2>Katılımcılar ({currentParticipants.length}/{participantCount})</h2>
          
          <div className="add-participant">
            <div className="participant-input-group">
              <span className="participant-icon">👤</span>
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Katılımcı adı"
                className="participant-input"
                disabled={currentParticipants.length >= participantCount}
              />
              <button 
                onClick={addParticipant}
                className="add-btn"
                disabled={!newParticipantName.trim() || currentParticipants.length >= participantCount}
              >
                Ekle
              </button>
            </div>
          </div>

          <div className="participants-list">
            {currentParticipants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <span className="participant-icon">👤</span>
                <span className="participant-name">{participant.name}</span>
                <button 
                  onClick={() => removeParticipant(participant.id)}
                  className="remove-btn"
                >
                  Çıkar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TournamentSetup