import { useState } from 'react'
import { TEAM_POTS, POT_KEYS } from '../data/TeamData'

function PotSelection({ onPotSelected, interactive = true }) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedPot, setSelectedPot] = useState(null)
  const [selectionMode, setSelectionMode] = useState('manual') // manual or random

  const handleManualPotClick = (potKey) => {
    if (!interactive || isSelecting) return

    setSelectedPot(potKey)
    setTimeout(() => {
      onPotSelected(potKey)
    }, 1000)
  }

  const handleRandomSelection = () => {
    if (!interactive || isSelecting) return
    
    setIsSelecting(true)
    setSelectionMode('random')
    
    // Simulate random selection with animation
    let currentIndex = 0
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % POT_KEYS.length
      setSelectedPot(POT_KEYS[currentIndex])
    }, 150)
    
    // Stop after 2 seconds and select final pot
    setTimeout(() => {
      clearInterval(interval)
      const finalPot = POT_KEYS[Math.floor(Math.random() * POT_KEYS.length)]
      setSelectedPot(finalPot)
      setIsSelecting(false)
      
      // Notify parent component after a brief delay
      setTimeout(() => {
        onPotSelected(finalPot)
      }, 1000)
    }, 2000)
  }

  return (
    <div className="pot-selection">
      <div className="pot-selection-header">
        <h2>Pot Selection</h2>
        <p>{interactive ? 'Choose a pot manually or select randomly for team draw' : 'Pot seçimi bekleniyor...'}</p>
      </div>

      <div className="pot-container">
        {POT_KEYS.map((potKey) => (
          <div
            key={potKey}
            className={`pot-card ${selectedPot === potKey ? 'selected' : ''} ${isSelecting && selectionMode === 'random' ? 'selecting' : ''} ${interactive && selectionMode === 'manual' ? 'clickable' : ''}`}
            onClick={() => interactive && selectionMode === 'manual' && !selectedPot ? handleManualPotClick(potKey) : null}
          >
            <div className="pot-header">
              <h3>{TEAM_POTS[potKey].name}</h3>
              <span className="team-count">{TEAM_POTS[potKey].teams.length} teams</span>
            </div>
            <div className="pot-teams">
              {TEAM_POTS[potKey].teams.slice(0, 3).map((team) => (
                <div key={team.id} className="team-preview">
                  {team.name}
                </div>
              ))}
              {TEAM_POTS[potKey].teams.length > 3 && (
                <div className="team-preview more">
                  +{TEAM_POTS[potKey].teams.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {interactive && !isSelecting && !selectedPot && (
        <div className="selection-buttons">
          <button className="btn-select-pot random" onClick={handleRandomSelection}>
            🎲 Random Selection
          </button>
          <p className="selection-info">Or click on any pot above to select manually</p>
        </div>
      )}

      {isSelecting && (
        <div className="selection-status">
          <div className="spinner"></div>
          <p>Randomly selecting pot...</p>
        </div>
      )}

      {selectedPot && !isSelecting && (
        <div className="selected-pot-result">
          <div className="result-icon">🎯</div>
          <h3>Selected: {TEAM_POTS[selectedPot].name}</h3>
          <p>Proceeding to team selection...</p>
        </div>
      )}
    </div>
  )
}

export default PotSelection