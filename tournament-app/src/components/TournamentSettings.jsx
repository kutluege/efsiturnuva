import { useState } from 'react'

function TournamentSettings({ tournament, onBack }) {
  const [settings, setSettings] = useState({
    winPoints: tournament?.settings?.winPoints || 3,
    drawPoints: tournament?.settings?.drawPoints || 1,
    lossPoints: tournament?.settings?.lossPoints || 0,
    showGoalDifference: tournament?.settings?.showGoalDifference !== false,
    showAverageInTable: tournament?.settings?.showAverageInTable !== false,
    showGoalsInTable: tournament?.settings?.showGoalsInTable !== false,
    averageSystem: tournament?.settings?.averageSystem || 'individual',
    email: tournament?.settings?.email || ''
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }


  const sendEmail = () => {
    if (settings.email) {
      // Burada gerçek email gönderme işlemi olacak
      alert(`Turnuva bilgileri ${settings.email} adresine gönderildi!`)
    } else {
      alert('Lütfen email adresi girin!')
    }
  }

  return (
    <div className="tournament-settings">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={onBack} className="close-btn">×</button>
          <h2>Turnuvanın Kurallarını Girin</h2>
        </div>

        <div className="settings-content">
          <p className="settings-description">
            Turnuva kuralları burada belirledikten sonra bir daha değiştirilemez.
          </p>

          <div className="settings-grid">
            <div className="setting-group">
              <label>Galibiyet Puanı</label>
              <input
                type="number"
                value={settings.winPoints}
                onChange={(e) => handleSettingChange('winPoints', Number(e.target.value))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label>Beraberlik Puanı</label>
              <input
                type="number"
                value={settings.drawPoints}
                onChange={(e) => handleSettingChange('drawPoints', Number(e.target.value))}
                className="setting-input"
              />
            </div>

            <div className="setting-group">
              <label>Mağlubiyet Puanı</label>
              <input
                type="number"
                value={settings.lossPoints}
                onChange={(e) => handleSettingChange('lossPoints', Number(e.target.value))}
                className="setting-input"
              />
            </div>
          </div>

          <div className="checkbox-settings">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={settings.showGoalDifference}
                  onChange={() => handleSettingChange('showGoalDifference', true)}
                />
                <span className="checkbox-text">Evet</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={!settings.showGoalDifference}
                  onChange={() => handleSettingChange('showGoalDifference', false)}
                />
                <span className="checkbox-text">Hayır</span>
              </label>
              <span className="setting-title">Maçlar Berabere Bitebilir</span>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={settings.showAverageInTable}
                  onChange={() => handleSettingChange('showAverageInTable', true)}
                />
                <span className="checkbox-text">Evet</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={!settings.showAverageInTable}
                  onChange={() => handleSettingChange('showAverageInTable', false)}
                />
                <span className="checkbox-text">Hayır</span>
              </label>
              <span className="setting-title">Tabloda Averaj Farkını Göster</span>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={settings.showGoalsInTable}
                  onChange={() => handleSettingChange('showGoalsInTable', true)}
                />
                <span className="checkbox-text">Evet</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  checked={!settings.showGoalsInTable}
                  onChange={() => handleSettingChange('showGoalsInTable', false)}
                />
                <span className="checkbox-text">Hayır</span>
              </label>
              <span className="setting-title">Tabloda Atılan/Yenilen Alanlarını Göster</span>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="radio"
                  value="individual"
                  checked={settings.averageSystem === 'individual'}
                  onChange={(e) => handleSettingChange('averageSystem', e.target.value)}
                />
                <span className="checkbox-text">İkili</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  value="general"
                  checked={settings.averageSystem === 'general'}
                  onChange={(e) => handleSettingChange('averageSystem', e.target.value)}
                />
                <span className="checkbox-text">Genel</span>
              </label>
              <span className="setting-title">Puan Eşitliğinde Averaj Sistemi</span>
            </div>
          </div>

          <div className="email-section">
            <p className="email-description">
              Turnuvanın aktive edilmesi ve gerekli bilgilerin gönderilmesi için email adresi girmeniz gerekmektedir.
            </p>
            <div className="email-input-group">
              <label>Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
                placeholder="Email adresinizi girin"
                className="email-input"
              />
            </div>
          </div>

          <button onClick={sendEmail} className="send-email-btn">
            Gönder
          </button>
        </div>
      </div>
    </div>
  )
}

export default TournamentSettings