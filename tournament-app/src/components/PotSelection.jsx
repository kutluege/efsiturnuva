import { useState } from 'react'
import { TEAM_POTS, POT_KEYS } from '../data/TeamData'
import { getCopy } from '../i18n'

function PotSelection({ onPotSelected, interactive = true, t: tProp }) {
  const t = tProp || getCopy('tr')
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
    <div>
      <div className="pot-list">
        {POT_KEYS.map((potKey) => (
          <div
            key={potKey}
            className={`pot-card ${selectedPot === potKey ? 'selected' : ''} ${!interactive ? 'readonly' : ''}`}
            onClick={() => (interactive && selectionMode === 'manual' && !selectedPot ? handleManualPotClick(potKey) : null)}
          >
            <div className="pot-card-head">
              <span className="pot-name">{TEAM_POTS[potKey].name}</span>
              <span className="pot-count">{TEAM_POTS[potKey].teams.length} {t.teamsUnit}</span>
            </div>
            <div className="pot-preview">
              {TEAM_POTS[potKey].teams.slice(0, 4).map((team) => (
                <span key={team.id} className="pot-chip">{team.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {interactive && !isSelecting && !selectedPot && (
        <button className="btn-cta sm" style={{ marginTop: 14 }} onClick={handleRandomSelection}>
          🎲 {t.randomPot}
        </button>
      )}

      {isSelecting && (
        <div style={{ marginTop: 14, textAlign: 'center', color: 'var(--ink-soft)', fontWeight: 600 }}>
          <div className="spinner" style={{ margin: '0 auto 10px' }} />
          <p>{t.randomPot}...</p>
        </div>
      )}
    </div>
  )
}

export default PotSelection
