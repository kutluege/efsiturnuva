import { useState, useEffect, useCallback } from 'react'

function TournamentBracket({ tournament, participants, onBack }) {
  const [bracket, setBracket] = useState(null)

  const generateInitialBracket = useCallback(() => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5)
    const rounds = Math.log2(shuffled.length)
    const newBracket = []

    // İlk tur eşleşmeleri
    for (let i = 0; i < shuffled.length; i += 2) {
      newBracket.push({
        id: `round1-match${i/2 + 1}`,
        round: 1,
        matchNumber: i/2 + 1,
        player1: shuffled[i],
        player2: shuffled[i + 1],
        winner: null,
        completed: false
      })
    }

    // Sonraki turlar için boş maçlar
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round)
      for (let match = 1; match <= matchesInRound; match++) {
        newBracket.push({
          id: `round${round}-match${match}`,
          round: round,
          matchNumber: match,
          player1: null,
          player2: null,
          winner: null,
          completed: false
        })
      }
    }

    setBracket(newBracket)
  }, [participants])

  useEffect(() => {
    if (participants && participants.length > 0) {
      generateInitialBracket()
    }
  }, [participants, generateInitialBracket])

  const setMatchWinner = (matchId, winner) => {
    const updatedBracket = bracket.map(match => {
      if (match.id === matchId) {
        return { ...match, winner, completed: true }
      }
      return match
    })

    // Kazananı bir sonraki tura aktar
    const currentMatch = bracket.find(m => m.id === matchId)
    if (currentMatch && currentMatch.round < Math.log2(participants.length)) {
      const nextRound = currentMatch.round + 1
      const nextMatchNumber = Math.ceil(currentMatch.matchNumber / 2)
      const nextMatchId = `round${nextRound}-match${nextMatchNumber}`
      
      const nextMatch = updatedBracket.find(m => m.id === nextMatchId)
      if (nextMatch) {
        if (currentMatch.matchNumber % 2 === 1) {
          nextMatch.player1 = winner
        } else {
          nextMatch.player2 = winner
        }
      }
    }

    setBracket(updatedBracket)
  }

  const getRoundMatches = (roundNumber) => {
    return bracket ? bracket.filter(match => match.round === roundNumber) : []
  }


  const exportToExcel = () => {
    alert('Excel export özelliği yakında eklenecek!')
  }

  const shareOnline = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Turnuva linki panoya kopyalandı!')
  }

  const downloadImage = () => {
    alert('Resim indirme özelliği yakında eklenecek!')
  }

  if (!bracket) {
    return <div className="loading">Turnuva kuruluyor...</div>
  }

  const totalRounds = Math.log2(participants.length)

  return (
    <div className="tournament-bracket">
      <div className="bracket-header">
        <button onClick={onBack} className="back-btn">
          ⬅ Geri
        </button>
        <h1>{tournament?.name || 'Turnuva'}</h1>
        <div className="header-actions">
          <button onClick={downloadImage} className="action-btn">
            Resim Olarak İndir
          </button>
          <button onClick={exportToExcel} className="action-btn">
            Excel Dosyasında İndir
          </button>
          <button onClick={shareOnline} className="action-btn">
            Online Turnuva Oluştur
          </button>
        </div>
      </div>

      <div className="bracket-container">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map(roundNumber => (
          <div key={roundNumber} className="round-column">
            <h3 className="round-title">{roundNumber}. HAFTA</h3>
            <div className="matches-container">
              {getRoundMatches(roundNumber).map((match) => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
                  </div>
                  <div className="match-players">
                    <div 
                      className={`player ${match.winner?.id === match.player1?.id ? 'winner' : ''}`}
                      onClick={() => match.player1 && match.player2 && !match.completed && setMatchWinner(match.id, match.player1)}
                    >
                      {match.player1?.name || 'Bekliyor'}
                    </div>
                    <div 
                      className={`player ${match.winner?.id === match.player2?.id ? 'winner' : ''}`}
                      onClick={() => match.player1 && match.player2 && !match.completed && setMatchWinner(match.id, match.player2)}
                    >
                      {match.player2?.name || 'Bekliyor'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TournamentBracket