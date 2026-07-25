import { useState } from 'react'
import { normalizeEmail, isValidEmail } from '../services/authService'

// Manage the league's admin list (adminEmails). Only rendered for admins.
// Saving goes through onSave -> setAdminEmails (a dedicated write, so routine
// score write-throughs can never clobber the list).
function AdminManageModal({ t, league, myEmail, onSave, onClose }) {
  const [emails, setEmails] = useState(league.adminEmails ?? [])
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addEmail = () => {
    const email = normalizeEmail(newEmail)
    if (!isValidEmail(email) || emails.includes(email) || emails.length >= 10) return
    setEmails([...emails, email])
    setNewEmail('')
  }

  const removeEmail = (email) => {
    if (emails.length <= 1) return
    if (email === myEmail && !window.confirm(t.removeSelfWarn)) return
    setEmails(emails.filter(e => e !== email))
  }

  const changed = emails.length !== (league.adminEmails ?? []).length ||
    emails.some(e => !(league.adminEmails ?? []).includes(e))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(emails)
      onClose()
    } catch (err) {
      console.error('[firebase] failed to save admins', err)
      setError(t.adminSaveFailed)
      setSaving(false)
    }
  }

  return (
    <div className="sheet-overlay">
      <div className="sheet scrollable">
        <div className="sheet-head">
          <div className="kicker">#{league.id}</div>
          <div className="title">{t.adminsTitle}</div>
          <button className="sheet-close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>
        <div className="rules-body">
          <div className="roster-note">{t.adminsNote}</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="email"
              className="text-input plain"
              style={{ textTransform: 'none' }}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addEmail() }}
              placeholder={t.addAdminPh}
            />
            <button
              onClick={addEmail}
              disabled={!isValidEmail(newEmail) || emails.includes(normalizeEmail(newEmail)) || emails.length >= 10}
              style={{ width: 84, height: 52, border: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Anton, sans-serif', fontSize: 19, textTransform: 'uppercase', cursor: 'pointer', flex: 'none' }}
            >
              {t.addAdmin}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {emails.map(email => (
              <div key={email} className="participant-row">
                <div className="participant-avatar">{email.charAt(0).toUpperCase()}</div>
                <span className="participant-name admin-email-name">
                  {email}
                  {email === myEmail && <span className="admin-you-chip">{t.youChip}</span>}
                </span>
                <button
                  className="btn-remove-chip"
                  onClick={() => removeEmail(email)}
                  disabled={emails.length <= 1}
                  title={emails.length <= 1 ? t.lastAdminNote : t.removeAdmin}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {emails.length <= 1 && <p className="join-info" style={{ margin: 0 }}>{t.lastAdminNote}</p>}
          {error && <p className="join-error">{error}</p>}

          <div className="sheet-actions-2" style={{ padding: 0 }}>
            <button className="btn-cancel" onClick={onClose}>{t.cancel}</button>
            <button className="btn-save" onClick={handleSave} disabled={!changed || saving || emails.length === 0}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminManageModal
