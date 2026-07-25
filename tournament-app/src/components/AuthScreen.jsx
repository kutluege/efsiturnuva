import { useState } from 'react'
import { sendLoginLink, isValidEmail } from '../services/authService'

// Email-link sign-in gate. Three internal states:
//  - enter-email: type an address, we send the one-time link
//  - link-sent: confirmation + resend / change address
//  - confirm-email (via props.needsEmailConfirm): the sign-in link was opened
//    on a device that doesn't have the stored address — ask for it to finish.
function AuthScreen({ t, needsEmailConfirm, onConfirmEmail, confirmError, onSkip }) {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState('enter') // enter | sending | sent
  const [error, setError] = useState('')

  const canSend = isValidEmail(email) && phase !== 'sending'

  const handleSend = async () => {
    if (!canSend) return
    setPhase('sending')
    setError('')
    try {
      await sendLoginLink(email)
      setPhase('sent')
    } catch (err) {
      console.error('[auth] failed to send sign-in link', err)
      setError(t.authSendFailed)
      setPhase('enter')
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className="screen-pad">
        <div className="eyebrow">{t.authTitle}</div>
        <h1 className="screen-title sm">{t.authConfirmEmailTitle}</h1>
        <div className="rule-bar" />
        <div className="auth-card">
          <p className="auth-help">{t.authConfirmEmailHelp}</p>
          <input
            type="email"
            className="text-input"
            style={{ textTransform: 'none' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && isValidEmail(email)) onConfirmEmail(email) }}
            placeholder={t.authEmailPh}
            autoFocus
          />
          {confirmError && <p className="join-error">{confirmError}</p>}
          <button className="btn-cta sm" style={{ marginTop: 12 }} disabled={!isValidEmail(email)} onClick={() => onConfirmEmail(email)}>
            {t.signIn}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-pad">
      <div className="eyebrow">{t.authKicker}</div>
      <h1 className="screen-title sm">{t.authTitle}</h1>
      <div className="rule-bar" />

      <div className="auth-card">
        {phase !== 'sent' && (
          <>
            <p className="auth-help">{t.authHelp}</p>
            <input
              type="email"
              className="text-input"
              style={{ textTransform: 'none' }}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              placeholder={t.authEmailPh}
              autoFocus
            />
            {error && <p className="join-error">{error}</p>}
            <button className="btn-cta sm" style={{ marginTop: 12 }} disabled={!canSend} onClick={handleSend}>
              {phase === 'sending' ? t.authSending : t.authSendLink}
            </button>
          </>
        )}

        {phase === 'sent' && (
          <>
            <p className="auth-help">
              {t.authLinkSent} <strong className="auth-sent-email">{email.trim().toLowerCase()}</strong>
            </p>
            <p className="auth-help">{t.authLinkSentHelp}</p>
            <div className="join-mode-row" style={{ marginTop: 12 }}>
              <button className="btn-outline-block" onClick={handleSend}>{t.authResend}</button>
              <button className="btn-outline-block" onClick={() => setPhase('enter')}>{t.authChangeEmail}</button>
            </div>
          </>
        )}
      </div>

      {onSkip && (
        <button className="auth-skip" onClick={onSkip}>{t.authSkip} →</button>
      )}
    </div>
  )
}

export default AuthScreen
