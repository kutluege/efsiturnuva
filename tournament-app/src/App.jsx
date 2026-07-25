import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import TeamDrawTab from './components/TeamDrawTab'
import { calculateLeaderboard } from './utils/leaderboard'
import { loadAppState } from './utils/localPersistence'
import { useAppPersistence } from './hooks/useTournamentPersistence'
import { generateRounds, createDefaultDraw, createDefaultSettings, generateUniqueLeagueId } from './utils/fixtures'
import { isFirebaseConfigured } from './firebase'
import {
  createRemoteLeague, updateRemoteTournament, subscribeToTournament,
  fetchRemoteLeague, joinCodeExists, isValidLeagueCode,
  sendFanNote, subscribeToFanNotes,
  setAdminEmails, claimLegacyLeague, subscribeToMyLeagues, deleteRemoteLeague, hasAuthUser
} from './services/tournamentSync'
import { isCompletingSignIn, completeSignIn, getStoredSignInEmail, watchAuth, logout, normalizeEmail } from './services/authService'
import AuthScreen from './components/AuthScreen'
import AdminManageModal from './components/AdminManageModal'
import ConfirmModal from './components/ConfirmModal'
import { getCopy } from './i18n'

// Ownership is derived, never trusted from storage, whenever the league lives
// in Firestore: you are an admin iff your verified email is on the admin list.
// Legacy leagues (pre-auth, no adminEmails) and local-only mode keep the old
// per-device isOwner flag.
function deriveIsOwner(league, authEmail) {
  if (!league) return false
  if (!isFirebaseConfigured) return league.isOwner ?? true
  if (Array.isArray(league.adminEmails) && league.adminEmails.length > 0) {
    return !!authEmail && league.adminEmails.includes(authEmail)
  }
  return league.isOwner ?? false
}

function SoccerBall({ dark }) {
  return (
    <div className={`soccer-ball ${dark ? 'dark' : ''}`}>
      <div className="p p1" />
      <div className="p p2" />
      <div className="p p3" />
    </div>
  )
}

function Header({ lang, t, onSetLang, authEmail, onSignOut, onSignIn }) {
  return (
    <div className="app-header">
      <div className="logo-badge">EF</div>
      <div className="brand-block">
        <div className="brand-title">EFSİ <span className="accent">LİG</span></div>
        <div className="brand-tagline">{t.tagline}</div>
      </div>
      {isFirebaseConfigured && authEmail && (
        <button className="auth-chip" onClick={onSignOut} title={t.signOut}>
          <span className="auth-chip-email">{authEmail}</span>
          <span className="auth-chip-action">{t.signOut}</span>
        </button>
      )}
      {isFirebaseConfigured && !authEmail && onSignIn && (
        <button className="auth-chip" onClick={onSignIn}>
          <span className="auth-chip-action">{t.signIn}</span>
        </button>
      )}
      <div className="lang-toggle">
        <button className={`lang-btn ${lang === 'tr' ? 'active' : ''}`} onClick={() => onSetLang('tr')}>TR</button>
        <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => onSetLang('en')}>EN</button>
      </div>
    </div>
  )
}

function Ticker({ t }) {
  const group = (
    <div className="ticker-group">
      <span>{t.ticker}</span><span>★</span><span>{t.ticker}</span><span>★</span>
    </div>
  )
  return (
    <div className="ticker">
      <div className="ticker-track">
        {group}
        {group}
      </div>
    </div>
  )
}

function BottomNav({ t, activeScreen, onGoTournament, onGoDraw, onGoHome }) {
  return (
    <div className="bottom-nav">
      <button className={`nav-btn ${activeScreen === 'tournament' ? 'active' : ''}`} onClick={onGoTournament}>{t.navTable}</button>
      <button className={`nav-btn ${activeScreen === 'team-draw' ? 'active' : ''}`} onClick={onGoDraw}>{t.navDraw}</button>
      <button className="nav-btn" onClick={onGoHome}>{t.navHome}</button>
    </div>
  )
}

function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.out ? 'out' : ''}`}>
          <div className="toast-head">
            <div className="toast-avatar" />
            <span className="toast-from">{toast.from}</span>
          </div>
          <div className="toast-text">{toast.text}</div>
        </div>
      ))}
    </div>
  )
}

function ChampionModal({ t, name, onClose }) {
  return (
    <div className="sheet-overlay center">
      <div className="champion-card">
        <div className="kicker">{t.championKicker}</div>
        <div className="name">{name}</div>
        <div className="note">{t.championNote}</div>
        <button onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}

function HomeScreen({
  t, leagues, authEmail, onOpenLeague, onNewLeague,
  joinCodeInput, onJoinInput, joinError, isJoining, onJoin,
  legacyClaim, claimKeyInput, onClaimKeyInput, onClaim, claimError,
  onRequestRemove, onRequestDelete
}) {
  const list = Object.values(leagues).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  const canJoin = isValidLeagueCode(joinCodeInput) && !isJoining

  return (
    <>
      <div className="screen-pad">
        <div className="eyebrow">{t.homeKicker}</div>
        <h1 className="screen-title">{t.myLeagues}</h1>
        <div className="rule-bar" />
      </div>

      <div className="league-list">
        {list.length === 0 && <p className="join-info">{t.noLeagues}</p>}
        {list.map(l => {
          const owns = deriveIsOwner(l, authEmail)
          return (
            <div key={l.id} className="league-row" onClick={() => onOpenLeague(l.id)}>
              <div className="league-id-badge">#{l.id}</div>
              <div className="league-info">
                <div className="league-name">{l.name}</div>
                <div className="league-meta">
                  {l.participants.length} {t.playersUnit} • {owns ? t.managerChip : t.viewerChip}
                </div>
              </div>
              <div className="league-actions" onClick={(e) => e.stopPropagation()}>
                {owns && isFirebaseConfigured && Array.isArray(l.adminEmails) && l.adminEmails.length > 0 && (
                  <button className="league-action-btn danger" title={t.deleteLeague} onClick={() => onRequestDelete(l.id)}>🗑</button>
                )}
                <button className="league-action-btn" title={t.removeFromList} onClick={() => onRequestRemove(l.id)}>✕</button>
              </div>
              <span className="league-open">→</span>
            </div>
          )
        })}
        <button className="btn-cta" onClick={onNewLeague}>+ {t.newLeague}</button>
      </div>

      <div className="join-card">
        <h2>{t.joinTitle}</h2>
        <p>{t.joinHelp}</p>
        <div className="join-form">
          <input
            type="text"
            inputMode="numeric"
            value={joinCodeInput}
            onChange={(e) => onJoinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder={t.joinCodePh}
            maxLength={4}
          />
          <button className="join-btn" disabled={!canJoin} onClick={() => onJoin(joinCodeInput)}>
            {isJoining ? t.joining : t.joinBtn}
          </button>
        </div>
        {joinError && <p className="join-error">{joinError}</p>}

        {legacyClaim && (
          <div className="legacy-claim">
            <p className="join-info">{t.legacyLeagueNote}</p>
            <div className="join-form">
              <input
                type="text"
                value={claimKeyInput}
                onChange={(e) => onClaimKeyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder={t.adminKeyPh}
                maxLength={8}
              />
              <button className="join-btn" disabled={claimKeyInput.length !== 8} onClick={onClaim}>
                {t.claimBtn}
              </button>
            </div>
            {claimError && <p className="join-error">{claimError}</p>}
          </div>
        )}

        {!isFirebaseConfigured && <p className="join-info">{t.joinLocalNote}</p>}
      </div>
    </>
  )
}

function RosterModal({ t, league, onApply, onClose }) {
  const [players, setPlayers] = useState(league.participants)
  const [newName, setNewName] = useState('')

  const addPlayer = () => {
    const name = newName.trim()
    if (!name) return
    setPlayers([...players, { id: Date.now(), name }])
    setNewName('')
  }

  const removePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  const changed = players.length !== league.participants.length ||
    players.some((p, i) => p.id !== league.participants[i]?.id)

  return (
    <div className="sheet-overlay">
      <div className="sheet scrollable">
        <div className="sheet-head">
          <div className="kicker">#{league.id}</div>
          <div className="title">{t.rosterTitle}</div>
        </div>
        <div className="rules-body">
          <div className="roster-note">{t.rosterNote}</div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="text-input plain"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addPlayer() }}
              placeholder={t.partPh}
              maxLength={20}
            />
            <button
              onClick={addPlayer}
              disabled={!newName.trim()}
              style={{ width: 84, height: 52, border: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Anton, sans-serif', fontSize: 19, textTransform: 'uppercase', cursor: 'pointer', flex: 'none' }}
            >
              {t.add}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map(player => (
              <div key={player.id} className="participant-row">
                <div className="participant-avatar">{player.name.charAt(0).toUpperCase()}</div>
                <span className="participant-name">{player.name}</span>
                <button className="btn-remove-chip" onClick={() => removePlayer(player.id)}>✕</button>
              </div>
            ))}
          </div>

          <div className="sheet-actions-2" style={{ padding: 0 }}>
            <button className="btn-cancel" onClick={onClose}>{t.cancel}</button>
            <button className="btn-save" onClick={() => onApply(players)} disabled={players.length < 2 || !changed}>
              {t.applyRoster}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ParticipantManager({ t, participants, participantCount, onAddParticipant, onRemoveParticipant, onGenerateTournament, onBack }) {
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

  const fillPct = Math.min(100, Math.round((participants.length / Math.max(1, participantCount)) * 100))
  const canGenerate = participants.length === participantCount

  return (
    <>
      <div className="screen-pad">
        <button className="btn-outline" style={{ marginBottom: 14 }} onClick={onBack}>← {t.back}</button>
        <div className="eyebrow">{t.step2}</div>
        <h1 className="screen-title sm">{t.partTitle}</h1>
      </div>

      <div style={{ padding: '12px 18px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="text-input plain"
            value={newParticipantName}
            onChange={(e) => setNewParticipantName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t.partPh}
            maxLength={20}
          />
          <button
            onClick={handleAddParticipant}
            disabled={!newParticipantName.trim() || participants.length >= participantCount}
            style={{ width: 84, height: 54, border: '3px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Anton, sans-serif', fontSize: 19, textTransform: 'uppercase', cursor: 'pointer', flex: 'none' }}
          >
            {t.add}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {participants.map(participant => (
            <div key={participant.id} className="participant-row">
              <div className="participant-avatar">{participant.name.charAt(0).toUpperCase()}</div>
              <span className="participant-name">{participant.name}</span>
              <button className="btn-remove-chip" onClick={() => onRemoveParticipant(participant.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${fillPct}%` }} />
          </div>
          <div className="progress-label">{participants.length}/{participantCount}</div>
        </div>

        <button className="btn-cta" style={{ marginTop: 16 }} onClick={onGenerateTournament} disabled={!canGenerate}>
          🏆 {t.drawLots}
        </button>
      </div>
    </>
  )
}

function MatchResultModal({ t, weekLabel, match, onResult, onClose }) {
  const [score1, setScore1] = useState(match.completed ? String(match.score.player1) : '')
  const [score2, setScore2] = useState(match.completed ? String(match.score.player2) : '')

  const handleSubmit = () => {
    if (score1 !== '' && score2 !== '') {
      const s1 = parseInt(score1)
      const s2 = parseInt(score2)

      let winner = null
      if (s1 > s2) {
        winner = match.player1.id
      } else if (s2 > s1) {
        winner = match.player2.id
      } else {
        winner = 'draw'
      }

      onResult(winner, {
        player1: s1,
        player2: s2
      })
    }
  }

  return (
    <div className="sheet-overlay">
      <div className="sheet">
        <div className="sheet-head">
          <div className="kicker">{weekLabel}</div>
          <div className="title">{match.completed ? t.editScore : t.matchResult}</div>
        </div>
        <div className="score-grid">
          <div className="score-col">
            <div className="p-name">{match.player1.name}</div>
            <input type="number" min="0" value={score1} onChange={(e) => setScore1(e.target.value)} />
          </div>
          <div className="score-colon">:</div>
          <div className="score-col">
            <div className="p-name">{match.player2.name}</div>
            <input type="number" min="0" value={score2} onChange={(e) => setScore2(e.target.value)} />
          </div>
        </div>
        <div className="sheet-actions-2">
          <button className="btn-cancel" onClick={onClose}>{t.cancel}</button>
          <button className="btn-save" onClick={handleSubmit} disabled={score1 === '' || score2 === ''}>{t.save}</button>
        </div>
      </div>
    </div>
  )
}

function TournamentSettingsModal({ t, onClose }) {
  const [rules, setRules] = useState({ tie: 'no', avg: 'yes', goals: 'yes', tiebreak: 'duo' })

  const toggles = [
    { key: 'tie', label: t.ruleTie, a: 'yes', b: 'no', aLabel: t.yes, bLabel: t.no },
    { key: 'avg', label: t.ruleAvg, a: 'yes', b: 'no', aLabel: t.yes, bLabel: t.no },
    { key: 'goals', label: t.ruleGoals, a: 'yes', b: 'no', aLabel: t.yes, bLabel: t.no },
    { key: 'tiebreak', label: t.ruleTiebreak, a: 'duo', b: 'general', aLabel: t.duo, bLabel: t.general }
  ]

  return (
    <div className="sheet-overlay">
      <div className="sheet scrollable">
        <div className="sheet-head">
          <div className="title">{t.rules}</div>
          <button className="sheet-close" onClick={onClose} aria-label={t.close}>✕</button>
        </div>
        <div className="rules-body">
          <div className="points-grid">
            <div className="point-box"><div className="v">3</div><div className="l">{t.winPts}</div></div>
            <div className="point-box"><div className="v">1</div><div className="l">{t.drawPts}</div></div>
            <div className="point-box"><div className="v">0</div><div className="l">{t.lossPts}</div></div>
          </div>

          {toggles.map(r => (
            <div key={r.key} className="rule-card">
              <div className="label">{r.label}</div>
              <div className="segmented">
                <button
                  className={`segment-btn ${rules[r.key] === r.a ? 'active' : ''}`}
                  onClick={() => setRules(prev => ({ ...prev, [r.key]: r.a }))}
                >
                  {r.aLabel}
                </button>
                <button
                  className={`segment-btn ${rules[r.key] === r.b ? 'active' : ''}`}
                  onClick={() => setRules(prev => ({ ...prev, [r.key]: r.b }))}
                >
                  {r.bLabel}
                </button>
              </div>
            </div>
          ))}

          <button className="btn-cta sm" onClick={onClose}>{t.saveRules}</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [boot] = useState(() => loadAppState())

  const [lang, setLang] = useState(() => boot?.lang ?? 'tr')
  const [leagues, setLeagues] = useState(() => boot?.leagues ?? {})
  const [activeLeagueId, setActiveLeagueId] = useState(() => boot?.activeLeagueId ?? null)
  const [view, setView] = useState(() => {
    const stored = boot?.currentView
    if (stored === 'tournament' && boot?.activeLeagueId && boot?.leagues?.[boot.activeLeagueId]) return 'tournament'
    if (stored && stored !== 'tournament') return stored
    return 'home'
  })

  const [tournamentName, setTournamentName] = useState(() => boot?.setupDraft?.tournamentName ?? '')
  const [participantCount, setParticipantCount] = useState(() => boot?.setupDraft?.participantCount ?? 4)
  const [matchType, setMatchType] = useState(() => boot?.setupDraft?.matchType ?? 'double')
  const [draftParticipants, setDraftParticipants] = useState(() => boot?.setupDraft?.participants ?? [])

  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const hasAutoJoined = useRef(false)
  const [urlHasJoin, setUrlHasJoin] = useState(() => new URLSearchParams(window.location.search).has('join'))

  // Sign-in choice shown when an unsigned user finishes the setup wizard.
  const [showCreateAuthChoice, setShowCreateAuthChoice] = useState(false)

  // Legacy (adminKey-era) league claim flow on the home screen.
  const [legacyClaim, setLegacyClaim] = useState(null) // { code }
  const [claimKeyInput, setClaimKeyInput] = useState('')
  const [claimError, setClaimError] = useState('')

  // Remove-from-list / permanent-delete confirmations.
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'remove'|'delete', id }
  const [isDeleting, setIsDeleting] = useState(false)

  // ---- Auth (email-link sign-in) ----
  const [authUser, setAuthUser] = useState(undefined) // undefined = resolving, null = signed out
  const [authSkipped, setAuthSkipped] = useState(() => boot?.authSkipped ?? false)
  const [signInPending, setSignInPending] = useState(() => isCompletingSignIn())
  const [signInNeedsEmail, setSignInNeedsEmail] = useState(false)
  const [signInError, setSignInError] = useState('')

  // Viewer notes (feature: spectator name + note shown under the scoreboard)
  const [fanName, setFanName] = useState(() => boot?.fanName ?? '')
  const [fanNotes, setFanNotes] = useState([])

  const [activeTab, setActiveTab] = useState('tournament') // 'tournament' | 'team-draw'
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [showAdmins, setShowAdmins] = useState(false)
  const [championDismissed, setChampionDismissed] = useState(false)
  const [toasts, setToasts] = useState([])
  const [fanDraft, setFanDraft] = useState('')
  const fanTimerRef = useRef(null)

  // True while a local edit hasn't been flushed to Firestore yet — blocks the
  // admin snapshot handler from clobbering it, and gates the write-through so
  // remote snapshots don't echo back into new writes (feedback loop).
  const pendingLocalWrite = useRef(false)

  const t = getCopy(lang)
  const authEmail = authUser?.email ? normalizeEmail(authUser.email) : null
  const activeLeague = activeLeagueId ? leagues[activeLeagueId] : null
  const isOwner = deriveIsOwner(activeLeague, authEmail)

  // Complete a sign-in link on load; watch auth state.
  useEffect(() => {
    if (signInPending) {
      const stored = getStoredSignInEmail()
      if (!stored) {
        setSignInNeedsEmail(true)
      } else {
        completeSignIn()
          .then(() => { setSignInPending(false); setAuthSkipped(false) })
          .catch(err => {
            console.error('[auth] sign-in completion failed', err)
            setSignInError(t.authInvalidLink)
            setSignInPending(false)
          })
      }
    }
    return watchAuth(setAuthUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmSignInEmail = (email) => {
    setSignInError('')
    completeSignIn(email)
      .then(() => { setSignInPending(false); setSignInNeedsEmail(false); setAuthSkipped(false) })
      .catch(err => {
        console.error('[auth] sign-in completion failed', err)
        setSignInError(t.authInvalidLink)
      })
  }

  const handleSignOut = () => {
    pendingLocalWrite.current = false
    logout().catch(err => console.error('[auth] sign-out failed', err))
  }

  const persistSnapshot = useMemo(() => ({
    version: 2,
    lang,
    currentView: view,
    activeLeagueId,
    fanName,
    authSkipped,
    setupDraft: { tournamentName, participantCount, matchType, participants: draftParticipants },
    leagues
  }), [lang, view, activeLeagueId, fanName, authSkipped, tournamentName, participantCount, matchType, draftParticipants, leagues])

  useAppPersistence(persistSnapshot)

  const mutateActiveLeague = (updater) => {
    if (!activeLeagueId) return
    pendingLocalWrite.current = true
    setLeagues(prev => {
      const current = prev[activeLeagueId]
      if (!current) return prev
      return { ...prev, [activeLeagueId]: { ...updater(current), updatedAt: Date.now() } }
    })
  }

  // ---- Setup draft handlers ----

  const addParticipant = (name) => {
    if (name.trim() && draftParticipants.length < participantCount) {
      setDraftParticipants([...draftParticipants, { id: Date.now(), name: name.trim() }])
    }
  }

  const removeParticipant = (id) => {
    setDraftParticipants(draftParticipants.filter(p => p.id !== id))
  }

  // ---- League creation ----

  // localOnly: escape hatch when the user refuses to sign in — the league
  // lives only on this device (no Firestore doc, rules would reject it anyway).
  const createLeague = async (localOnly = false) => {
    if (draftParticipants.length !== participantCount) return

    const remote = isFirebaseConfigured && !localOnly && !!authEmail

    const shuffled = [...draftParticipants].sort(() => Math.random() - 0.5)
    const rounds = generateRounds(shuffled, matchType)

    let id = generateUniqueLeagueId(Object.keys(leagues))
    if (remote) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const taken = await joinCodeExists(id).catch(() => false)
        if (!taken) break
        id = generateUniqueLeagueId([...Object.keys(leagues), id])
      }
    }

    const league = {
      id,
      name: tournamentName.trim() || 'Turnuva',
      participants: shuffled,
      rounds,
      matchType,
      currentRound: 0,
      draw: createDefaultDraw(),
      settings: createDefaultSettings(),
      matchHistory: [],
      isOwner: true,
      ...(remote ? { adminEmails: [authEmail] } : {}),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    setLeagues(prev => ({ ...prev, [id]: league }))
    setActiveLeagueId(id)
    setView('tournament')
    setActiveTab('tournament')
    setChampionDismissed(false)
    setDraftParticipants([])

    if (remote) {
      createRemoteLeague(id, league, authEmail)
        .catch(err => console.error('[firebase] failed to create remote league', err))
    }
  }

  // ---- Match / draw updates (owner-only, funnel through the leagues map) ----

  const updateMatchResult = (roundIndex, matchId, winnerId, score) => {
    if (!isOwner) return
    mutateActiveLeague(league => {
      const updatedRounds = [...league.rounds]
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

        round[matchIndex] = { ...match, winner, completed: true, score }
        updatedRounds[roundIndex] = round
      }

      return { ...league, rounds: updatedRounds }
    })
  }

  const updateDraw = (partialDraw) => {
    if (!isOwner) return
    mutateActiveLeague(league => ({ ...league, draw: { ...league.draw, ...partialDraw } }))
  }

  // ---- Squad changes: archive played matches, rebuild fixtures ----

  const applyRosterChange = (newPlayers) => {
    if (!isOwner) return
    mutateActiveLeague(league => {
      const archived = []
      league.rounds.forEach((round, roundIndex) => round.forEach(match => {
        if (match.completed && match.player1.id !== 'bye' && match.player2.id !== 'bye') {
          archived.push({
            ...match,
            id: `h-${(league.matchHistory?.length ?? 0) + archived.length}-${match.id}`,
            week: roundIndex + 1,
            archivedAt: Date.now()
          })
        }
      }))

      const shuffled = [...newPlayers].sort(() => Math.random() - 0.5)

      return {
        ...league,
        participants: shuffled,
        rounds: generateRounds(shuffled, league.matchType || 'double'),
        matchHistory: [...(league.matchHistory ?? []), ...archived],
        draw: createDefaultDraw()
      }
    })
    setShowRoster(false)
    setChampionDismissed(false)
  }

  // ---- Firebase sync ----

  // Ref mirror so long-lived snapshot handlers see the current active id
  // without resubscribing on every navigation.
  const activeLeagueIdRef = useRef(activeLeagueId)
  useEffect(() => {
    activeLeagueIdRef.current = activeLeagueId
  }, [activeLeagueId])

  // Is the active league backed by a Firestore doc? (local-only leagues have
  // no adminEmails and were never pushed)
  const activeLeagueIsRemote = !!activeLeague &&
    (Array.isArray(activeLeague.adminEmails) ? activeLeague.adminEmails.length > 0 : !activeLeague.isOwner)

  // Admin write-through: flush local edits to Firestore. Only fires for edits
  // made on this device (pendingLocalWrite), never for echoed snapshots.
  useEffect(() => {
    if (!isFirebaseConfigured || !activeLeague || !isOwner || !activeLeagueIsRemote) return
    if (!pendingLocalWrite.current) return
    const timer = setTimeout(() => {
      if (!hasAuthUser()) return // signed out while the debounce was pending
      pendingLocalWrite.current = false
      updateRemoteTournament(activeLeague.id, activeLeague)
        .catch(err => console.error('[firebase] failed to sync league', err))
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeague, authEmail])

  // Live subscription for every remote-backed active league — viewers AND
  // admins (so co-admins see each other's edits). Admins skip applying remote
  // data while their own local edit is still unflushed.
  useEffect(() => {
    if (!activeLeagueId || !activeLeague || !isFirebaseConfigured || !activeLeagueIsRemote) return
    const unsubscribe = subscribeToTournament(
      activeLeagueId,
      data => setLeagues(prev => {
        const current = prev[activeLeagueId]
        if (!current) return prev
        if (deriveIsOwner(current, authEmail) && pendingLocalWrite.current) return prev
        return { ...prev, [activeLeagueId]: { ...current, ...data, id: activeLeagueId, updatedAt: Date.now() } }
      }),
      err => {
        if (err?.message === 'not-found') {
          // League was permanently deleted elsewhere.
          setLeagues(prev => {
            const next = { ...prev }
            delete next[activeLeagueId]
            return next
          })
          setActiveLeagueId(null)
          setView('home')
          setJoinError(t.leagueGone)
        }
      }
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeagueId, activeLeagueIsRemote, authEmail])

  // "My leagues": every league where my email is an admin, live across devices.
  useEffect(() => {
    if (!isFirebaseConfigured || !authEmail) return
    return subscribeToMyLeagues(authEmail, remoteLeagues => {
      setLeagues(prev => {
        const next = { ...prev }
        remoteLeagues.forEach(remote => {
          // The active league is owned by its own doc subscription; skip it
          // here (and never while a local edit is pending).
          if (remote.id === activeLeagueIdRef.current) return
          const current = next[remote.id]
          next[remote.id] = {
            matchHistory: [],
            draw: createDefaultDraw(),
            settings: createDefaultSettings(),
            matchType: 'double',
            ...(current ?? {}),
            ...remote,
            updatedAt: remote.updatedAt ?? current?.updatedAt ?? Date.now()
          }
        })
        return next
      })
    })
  }, [authEmail])

  // Viewer notes: live from Firestore when configured, otherwise from the local league blob.
  useEffect(() => {
    if (!activeLeagueId) {
      setFanNotes([])
      return
    }
    if (isFirebaseConfigured) {
      return subscribeToFanNotes(activeLeagueId, setFanNotes)
    }
    setFanNotes([...(leagues[activeLeagueId]?.fanNotes ?? [])].reverse())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeagueId, isFirebaseConfigured ? null : leagues[activeLeagueId]?.fanNotes])

  // ---- Opening / joining leagues ----

  const openLeague = (id) => {
    setActiveLeagueId(id)
    setView('tournament')
    setActiveTab('tournament')
    setJoinError('')
  }

  // Join by code. Ownership is derived from the signed-in email vs the doc's
  // adminEmails — a single action covers both "manager" and "watch" cases.
  const joinLeague = async (rawCode) => {
    const code = rawCode.trim()

    if (!isValidLeagueCode(code)) {
      setJoinError(t.joinNotFound)
      return
    }

    // Saved on this device → reopen. Exception: a saved legacy league I don't
    // own gets the claim panel instead, so its manager can link it by key
    // (the league row itself still opens it directly).
    const saved = leagues[code]
    if (saved) {
      const savedIsLegacy = !Array.isArray(saved.adminEmails) || saved.adminEmails.length === 0
      if (isFirebaseConfigured && savedIsLegacy && saved.adminKey && !deriveIsOwner(saved, authEmail)) {
        setLegacyClaim({ code })
        setClaimKeyInput('')
        setClaimError('')
        return
      }
      openLeague(code)
      return
    }

    if (!isFirebaseConfigured) {
      setJoinError(t.joinDisabled)
      return
    }

    setIsJoining(true)
    setJoinError('')
    setLegacyClaim(null)
    setClaimError('')
    const data = await fetchRemoteLeague(code).catch(() => null)
    setIsJoining(false)

    if (!data) {
      setJoinError(t.joinNotFound)
      return
    }

    const league = {
      matchHistory: [],
      draw: createDefaultDraw(),
      settings: createDefaultSettings(),
      matchType: 'double',
      ...data,
      id: code,
      isOwner: false,
      updatedAt: Date.now()
    }

    setLeagues(prev => ({ ...prev, [code]: league }))

    // Legacy league (created under the old adminKey system, not yet claimed):
    // offer the claim panel so its manager can link it to their account.
    const isLegacy = !Array.isArray(data.adminEmails) || data.adminEmails.length === 0
    if (isLegacy && data.adminKey) {
      setLegacyClaim({ code })
      setClaimKeyInput('')
      return
    }

    openLeague(code)
  }

  // Claim a legacy league: verify its adminKey client-side, then take email
  // ownership (rules only accept adminEmails == [my own email] here).
  const claimLegacy = async () => {
    if (!legacyClaim) return
    const { code } = legacyClaim
    const league = leagues[code]
    if (!league) return

    if (!authEmail) {
      setClaimError(t.claimNeedSignIn)
      return
    }
    if (claimKeyInput !== league.adminKey) {
      setClaimError(t.adminKeyWrong)
      return
    }

    try {
      await claimLegacyLeague(code, authEmail)
      setLeagues(prev => ({
        ...prev,
        [code]: { ...prev[code], adminEmails: [authEmail], updatedAt: Date.now() }
      }))
      setLegacyClaim(null)
      setClaimKeyInput('')
      setClaimError('')
      openLeague(code)
    } catch (err) {
      console.error('[firebase] failed to claim legacy league', err)
      setClaimError(t.claimFailed)
    }
  }

  // ---- Remove from list / permanent delete ----

  const removeLeagueLocally = (id) => {
    setLeagues(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeLeagueId === id) {
      setActiveLeagueId(null)
      setView('home')
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, id } = confirmAction

    if (type === 'remove') {
      removeLeagueLocally(id)
      setConfirmAction(null)
      return
    }

    // Permanent delete (admin only; rules enforce it too).
    setIsDeleting(true)
    try {
      await deleteRemoteLeague(id)
      removeLeagueLocally(id)
      setConfirmAction(null)
    } catch (err) {
      console.error('[firebase] failed to delete league', err)
      setJoinError(t.deleteFailed)
      setConfirmAction(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // ---- Admin management ----

  const saveAdmins = async (emails) => {
    if (!activeLeagueId || !isOwner) return
    await setAdminEmails(activeLeagueId, emails)
    setLeagues(prev => {
      const current = prev[activeLeagueId]
      if (!current) return prev
      return { ...prev, [activeLeagueId]: { ...current, adminEmails: emails, updatedAt: Date.now() } }
    })
  }

  // Auto-join if the page was opened via a shared ?join=CODE link (watch mode).
  useEffect(() => {
    if (hasAutoJoined.current) return
    hasAutoJoined.current = true
    const codeFromUrl = new URLSearchParams(window.location.search).get('join')
    if (codeFromUrl && isValidLeagueCode(codeFromUrl)) {
      setJoinCodeInput(codeFromUrl)
      setView('home')
      joinLeague(codeFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setChampionDismissed(false)
  }, [activeLeagueId])

  // ---- Fan message toasts (decorative, per-browser only — not synced) ----

  const pushToast = (from, text) => {
    const id = `t${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, from, text, out: false }])
    setTimeout(() => setToasts(prev => prev.map(x => (x.id === id ? { ...x, out: true } : x))), 3400)
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000)
  }

  // While on the draw tab, cycle the REAL viewer notes as side pop-ups.
  useEffect(() => {
    if (activeTab !== 'team-draw' || view !== 'tournament' || fanNotes.length === 0) {
      if (fanTimerRef.current) {
        clearInterval(fanTimerRef.current)
        fanTimerRef.current = null
      }
      return
    }
    let i = 0
    const tick = () => {
      const note = fanNotes[i % fanNotes.length]
      i++
      pushToast(note.name, note.text)
    }
    const startTimer = setTimeout(tick, 900)
    fanTimerRef.current = setInterval(tick, 4200)
    return () => {
      clearTimeout(startTimer)
      if (fanTimerRef.current) {
        clearInterval(fanTimerRef.current)
        fanTimerRef.current = null
      }
    }
  }, [activeTab, view, fanNotes])

  const sendFanMsg = () => {
    const text = fanDraft.trim()
    const name = fanName.trim()
    if (!text || !name) return
    setFanDraft('')
    pushToast(name, text)

    if (isFirebaseConfigured && activeLeagueId) {
      sendFanNote(activeLeagueId, { name, text })
        .catch(err => console.error('[firebase] failed to send fan note', err))
    } else if (activeLeagueId) {
      // Local-only fallback: keep notes inside the league blob on this device.
      const note = { id: `n${Date.now()}`, name, text, createdAt: Date.now() }
      setLeagues(prev => {
        const current = prev[activeLeagueId]
        if (!current) return prev
        return {
          ...prev,
          [activeLeagueId]: { ...current, fanNotes: [...(current.fanNotes ?? []), note].slice(-30) }
        }
      })
    }
  }

  // ---- Match result handling (score modal) ----

  // Uncompleted matches can be scored by the admin; completed matches can also be
  // RE-opened and corrected — but only by the admin (isOwner gate).
  const handleMatchClick = (roundIndex, match) => {
    if (!isOwner) return
    if (match.player1.id !== 'bye' && match.player2.id !== 'bye') {
      setSelectedMatch({ roundIndex, match })
    }
  }

  const handleMatchResult = (winnerId, score) => {
    if (selectedMatch) {
      updateMatchResult(selectedMatch.roundIndex, selectedMatch.match.id, winnerId, score)
      setSelectedMatch(null)
    }
  }

  // ---- Export / share helpers ----

  const exportToExcel = () => {
    let csvContent = 'Turnuva: ' + activeLeague.name + '\n\n'

    activeLeague.rounds.forEach((round, roundIndex) => {
      csvContent += `${roundIndex + 1}. HAFTA\n`
      round.forEach(match => {
        if (match.player2.id === 'bye') {
          csvContent += `${match.player1.name} - BYE\n`
        } else {
          csvContent += `${match.player1.name} vs ${match.player2.name}`
          if (match.completed) {
            csvContent += ` - Kazanan: ${match.winner.name}`
          }
          csvContent += '\n'
        }
      })
      csvContent += '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${activeLeague.name}_turnuva.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareViaEmail = () => {
    const leagueUrl = `${window.location.origin}${window.location.pathname}?join=${activeLeague.id}`
    const subject = encodeURIComponent(`${activeLeague.name} Turnuva Takibi`)
    const body = encodeURIComponent(`Merhaba,

${activeLeague.name} ligini canlı olarak takip edebilirsiniz:
${leagueUrl}

Lig Kodu: ${activeLeague.id}

Lig detayları:
- Katılımcı Sayısı: ${activeLeague.participants.length}
- Toplam Hafta: ${activeLeague.rounds.length}

İyi maçlar!`)

    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const downloadAsImage = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = 800
    canvas.height = 600

    ctx.fillStyle = '#F3EDE1'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#12100F'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'

    ctx.fillText(activeLeague.name, canvas.width / 2, 40)

    let yPos = 80
    activeLeague.rounds.forEach((round, roundIndex) => {
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
    link.download = `${activeLeague.name}_turnuva.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  // ---- Derived view data ----

  const leaderboard = activeLeague ? calculateLeaderboard(activeLeague) : []
  const tournamentCompleted = activeLeague ? activeLeague.rounds.every(round => round.every(match => match.completed)) : false
  const showNav = view === 'tournament' && !!activeLeague

  const currentWeek = activeLeague
    ? (() => {
        let completedRounds = 0
        for (const round of activeLeague.rounds) {
          if (round.every(m => m.completed)) completedRounds++
          else break
        }
        return Math.min(completedRounds + 1, activeLeague.rounds.length)
      })()
    : 1

  let nextMatch = null
  let nextMatchRound = -1
  if (activeLeague) {
    activeLeague.rounds.forEach((round, ri) => {
      round.forEach(m => {
        if (!nextMatch && !m.completed) {
          nextMatch = m
          nextMatchRound = ri
        }
      })
    })
  }

  const playedCount = activeLeague ? activeLeague.rounds.reduce((n, r) => n + r.filter(m => m.completed).length, 0) : 0
  const totalCount = activeLeague ? activeLeague.rounds.reduce((n, r) => n + r.length, 0) : 0

  const statCards = leaderboard.map((p, i) => {
    const played = p.wins + p.draws + p.losses
    return {
      id: p.player.id,
      name: p.player.name,
      initial: p.player.name.charAt(0).toUpperCase(),
      rank: i + 1,
      points: p.points,
      played,
      gpg: played ? (p.goalsFor / played).toFixed(1) : '0.0',
      cpg: played ? (p.goalsAgainst / played).toFixed(1) : '0.0',
      winPct: played ? Math.round((p.wins / played) * 100) : 0,
      form: p.matches.slice(-5).map(m => (m.result === 'win' ? 'W' : m.result === 'draw' ? 'D' : 'L'))
    }
  })

  const isChampionTime = tournamentCompleted && !championDismissed && leaderboard.length > 0

  const goHome = () => {
    setView('home')
    setJoinError('')
  }

  // First-visit auth gate: skipped for ?join=CODE visitors (watching stays
  // frictionless) and for local-only mode. `authUser === undefined` means the
  // auth state is still resolving — render nothing gate-related yet.
  const showAuthGate = isFirebaseConfigured && authUser === null && !authSkipped && !urlHasJoin && !signInPending

  return (
    <div className="page-bg">
      <div className="decor">
        <div className="decor-ball b1"><SoccerBall /></div>
        <div className="decor-ball b2"><SoccerBall /></div>
        <div className="decor-ball b3"><SoccerBall /></div>
        <div className="decor-ball b4"><SoccerBall dark /></div>
      </div>

      <div className="app-frame">
        <Header
          lang={lang}
          t={t}
          onSetLang={setLang}
          authEmail={authEmail}
          onSignOut={handleSignOut}
          onSignIn={authUser === null ? () => { setAuthSkipped(false); setUrlHasJoin(false) } : null}
        />
        <Ticker t={t} />

        <div className={`app-content ${showNav ? 'has-nav' : ''}`}>

          {signInPending && signInNeedsEmail && (
            <AuthScreen
              t={t}
              needsEmailConfirm
              onConfirmEmail={confirmSignInEmail}
              confirmError={signInError}
            />
          )}

          {signInPending && !signInNeedsEmail && (
            <div className="connecting-screen">
              <div className="spinner" />
              <p>{t.authCompleting}</p>
            </div>
          )}

          {!signInPending && showAuthGate && (
            <>
              {signInError && <p className="join-error" style={{ padding: '14px 18px 0' }}>{signInError}</p>}
              <AuthScreen t={t} onSkip={() => setAuthSkipped(true)} />
            </>
          )}

          {!signInPending && !showAuthGate && view === 'home' && (
            <HomeScreen
              t={t}
              leagues={leagues}
              authEmail={authEmail}
              onOpenLeague={openLeague}
              onNewLeague={() => setView('setup')}
              joinCodeInput={joinCodeInput}
              onJoinInput={(v) => { setJoinCodeInput(v); setJoinError(''); setLegacyClaim(null) }}
              joinError={joinError}
              isJoining={isJoining}
              onJoin={joinLeague}
              legacyClaim={legacyClaim}
              claimKeyInput={claimKeyInput}
              onClaimKeyInput={(v) => { setClaimKeyInput(v); setClaimError('') }}
              onClaim={claimLegacy}
              claimError={claimError}
              onRequestRemove={(id) => setConfirmAction({ type: 'remove', id })}
              onRequestDelete={(id) => setConfirmAction({ type: 'delete', id })}
            />
          )}

          {!signInPending && !showAuthGate && view === 'setup' && (
            <>
              <div className="screen-pad">
                {Object.keys(leagues).length > 0 && (
                  <button className="btn-outline" style={{ marginBottom: 14 }} onClick={goHome}>← {t.myLeagues}</button>
                )}
                <div className="eyebrow">{t.step1}</div>
                <h1 className="screen-title">{t.setupTitle}</h1>
                <div className="rule-bar" />
              </div>

              <div className="form-stack">
                <div className="field-card">
                  <label className="field-label">{t.tName}</label>
                  <input
                    type="text"
                    className="text-input"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder={t.tNamePh}
                  />
                </div>

                <div className="field-card">
                  <label className="field-label">{t.tCount}</label>
                  <div className="stepper">
                    <button className="stepper-btn" onClick={() => setParticipantCount(Math.max(2, participantCount - 1))}>–</button>
                    <div className="stepper-value"><span>{participantCount}</span></div>
                    <button className="stepper-btn" onClick={() => setParticipantCount(Math.min(16, participantCount + 1))}>+</button>
                  </div>
                </div>

                <div className="field-card">
                  <label className="field-label">{t.tMode}</label>
                  <div className="segmented">
                    <button className={`segment-btn ${matchType === 'single' ? 'active' : ''}`} onClick={() => setMatchType('single')}>{t.single}</button>
                    <button className={`segment-btn ${matchType === 'double' ? 'active' : ''}`} onClick={() => setMatchType('double')}>{t.double}</button>
                  </div>
                </div>

                <button className="btn-cta" onClick={() => setView('participants')}>
                  {t.next} <span style={{ fontSize: 20 }}>→</span>
                </button>
              </div>
            </>
          )}

          {!signInPending && !showAuthGate && view === 'participants' && (
            <ParticipantManager
              t={t}
              participants={draftParticipants}
              participantCount={participantCount}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              onGenerateTournament={() => {
                if (isFirebaseConfigured && !authEmail) {
                  setShowCreateAuthChoice(true)
                } else {
                  createLeague()
                }
              }}
              onBack={() => setView('setup')}
            />
          )}

          {!signInPending && !showAuthGate && view === 'tournament' && activeLeague && activeTab === 'tournament' && (
            <TournamentScreen
              t={t}
              league={activeLeague}
              leaderboard={leaderboard}
              tournamentCompleted={tournamentCompleted}
              isOwner={isOwner}
              currentWeek={currentWeek}
              playedCount={playedCount}
              totalCount={totalCount}
              nextMatch={nextMatch}
              nextMatchRound={nextMatchRound}
              statCards={statCards}
              fanDraft={fanDraft}
              onFanDraft={setFanDraft}
              fanName={fanName}
              onFanName={setFanName}
              fanNotes={fanNotes}
              onSendFan={sendFanMsg}
              onMatchClick={handleMatchClick}
              onOpenSettings={() => setShowSettings(true)}
              onOpenRoster={() => setShowRoster(true)}
              onOpenAdmins={() => setShowAdmins(true)}
              onCopyLink={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?join=${activeLeague.id}`)}
              onExportCsv={exportToExcel}
              onShareEmail={shareViaEmail}
              onSaveImage={downloadAsImage}
            />
          )}

          {!signInPending && !showAuthGate && view === 'tournament' && activeLeague && activeTab === 'team-draw' && (
            <TeamDrawTab
              t={t}
              tournament={activeLeague}
              draw={activeLeague.draw}
              onDrawChange={updateDraw}
              isOwner={isOwner}
              onBack={() => setActiveTab('tournament')}
            />
          )}

          {!signInPending && !showAuthGate && view === 'tournament' && !activeLeague && (
            <div className="connecting-screen">
              <div className="spinner" />
              <p>{t.connecting}</p>
            </div>
          )}
        </div>

        {showNav && (
          <BottomNav
            t={t}
            activeScreen={activeTab}
            onGoTournament={() => setActiveTab('tournament')}
            onGoDraw={() => setActiveTab('team-draw')}
            onGoHome={goHome}
          />
        )}
      </div>

      {selectedMatch && (
        <MatchResultModal
          t={t}
          weekLabel={`${selectedMatch.roundIndex + 1}. ${lang === 'tr' ? 'HAFTA' : 'WEEK'}`}
          match={selectedMatch.match}
          onResult={handleMatchResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {showSettings && (
        <TournamentSettingsModal t={t} onClose={() => setShowSettings(false)} />
      )}

      {showRoster && activeLeague && isOwner && (
        <RosterModal
          t={t}
          league={activeLeague}
          onApply={applyRosterChange}
          onClose={() => setShowRoster(false)}
        />
      )}

      {showAdmins && activeLeague && isOwner && (
        <AdminManageModal
          t={t}
          league={activeLeague}
          myEmail={authEmail}
          onSave={saveAdmins}
          onClose={() => setShowAdmins(false)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          t={t}
          title={confirmAction.type === 'delete' ? t.deleteConfirmTitle : t.removeConfirmTitle}
          body={`#${confirmAction.id} — ${confirmAction.type === 'delete' ? t.deleteConfirmBody : t.removeConfirmBody}`}
          confirmLabel={confirmAction.type === 'delete' ? t.deleteLeague : t.removeFromList}
          danger={confirmAction.type === 'delete'}
          busy={isDeleting}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {showCreateAuthChoice && (
        <div className="sheet-overlay center">
          <div className="champion-card confirm-card">
            <div className="kicker">{t.authTitle}</div>
            <div className="note" style={{ marginTop: 10 }}>{t.signInToCreate}</div>
            <button
              className="btn-cta sm"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => { setShowCreateAuthChoice(false); setAuthSkipped(false) }}
            >
              {t.signIn}
            </button>
            <button
              className="btn-outline-block"
              style={{ marginTop: 10 }}
              onClick={() => { setShowCreateAuthChoice(false); createLeague(true) }}
            >
              {t.createLocalOnly}
            </button>
            <button onClick={() => setShowCreateAuthChoice(false)}>{t.close}</button>
          </div>
        </div>
      )}

      {isChampionTime && (
        <ChampionModal t={t} name={leaderboard[0].player.name} onClose={() => setChampionDismissed(true)} />
      )}

      <ToastStack toasts={toasts} />
    </div>
  )
}

function TournamentScreen({
  t, league, leaderboard, tournamentCompleted, isOwner,
  currentWeek, playedCount, totalCount, nextMatch, nextMatchRound, statCards,
  fanDraft, onFanDraft, fanName, onFanName, fanNotes, onSendFan,
  onMatchClick, onOpenSettings, onOpenRoster, onOpenAdmins, onCopyLink,
  onExportCsv, onShareEmail, onSaveImage
}) {
  const [tab, setTab] = useState('table') // table | fixtures | stats
  const history = league.matchHistory ?? []
  const weekWord = t.week === 'Hafta' ? 'HAFTA' : 'WEEK'

  return (
    <>
      <div className="screen-pad tight">
        <div className="tv-header-row">
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">{t.liveNow}</div>
            <h1 className="tv-title">{league.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
            {isOwner && <button className="btn-icon" onClick={onOpenRoster}>👥</button>}
            {isOwner && isFirebaseConfigured && Array.isArray(league.adminEmails) && league.adminEmails.length > 0 && (
              <button className="btn-icon" title={t.adminsTitle} onClick={onOpenAdmins}>👑</button>
            )}
            {isOwner && <button className="btn-icon" onClick={onOpenSettings}>⚙</button>}
          </div>
        </div>
        <div className="chip-row">
          <div className="chip dark">{t.week} {currentWeek}</div>
          <div className="chip">{playedCount}/{totalCount} {t.played2}</div>
          <div className="chip live">{t.live}</div>
        </div>
      </div>

      {isOwner && (
        <div className="sync-banner">
          <span>{t.leagueId}: <strong>#{league.id}</strong></span>
          {isFirebaseConfigured && <button onClick={onCopyLink}>{t.copyLink}</button>}
        </div>
      )}
      {!isOwner && (
        <div className="readonly-banner">{t.readOnlyBanner}</div>
      )}

      <div className="tabs-row">
        <button className={`tab-btn ${tab === 'table' ? 'active' : ''}`} onClick={() => setTab('table')}>{t.standings}</button>
        <button className={`tab-btn ${tab === 'fixtures' ? 'active' : ''}`} onClick={() => setTab('fixtures')}>{t.fixtures}</button>
        <button className={`tab-btn ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>{t.stats}</button>
      </div>

      {tab === 'table' && (
        <>
          <div className="table-card">
            <div className="table-card-head">
              <div className="table-logo"><SoccerBall /></div>
              <h2>{t.standings}</h2>
            </div>
            <div className="table-head-row">
              <span>#</span><span className="name-col">{t.player}</span><span>{t.pts}</span><span>{t.w}</span><span>{t.d}</span><span>{t.l}</span><span>{t.gf}</span><span>{t.ga}</span><span>{t.gd}</span>
            </div>
            <div className="table-body">
              {leaderboard.map((p, i) => (
                <div key={p.player.id} className={`table-row ${i === 0 && tournamentCompleted ? 'champion' : ''}`} onClick={() => setTab('stats')}>
                  <span className={`pos ${i === 0 ? 'leader' : ''}`}>{i + 1}</span>
                  <span className="name">{p.player.name}</span>
                  <span className="pts">{p.points}</span>
                  <span className="stat">{p.wins}</span>
                  <span className="stat">{p.draws}</span>
                  <span className="stat">{p.losses}</span>
                  <span className="stat">{p.goalsFor}</span>
                  <span className="stat">{p.goalsAgainst}</span>
                  <span className="stat gd">{p.goalDifference > 0 ? '+' : ''}{p.goalDifference}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="notes-card">
            <div className="section-label">{t.notesTitle}</div>
            {fanNotes.length === 0 && <p className="notes-empty">{t.noNotes}</p>}
            {fanNotes.length > 0 && (
              <div className="notes-scroll">
                {fanNotes.map(note => (
                  <div key={note.id} className="note-row">
                    <span className="note-name">{note.name}</span>
                    <span className="note-text">{note.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="next-card">
            <div className="section-label">{t.nextUp}</div>
            {nextMatch ? (
              <>
                <div className="next-match-row" onClick={() => onMatchClick(nextMatchRound, nextMatch)}>
                  <span className="p-name right">{nextMatch.player1.name}</span>
                  <span className="vs-mark">VS</span>
                  <span className="p-name">{nextMatch.player2.name}</span>
                </div>
                {isOwner && <div className="next-hint">{t.tapToScore}</div>}
              </>
            ) : (
              <div className="next-hint">{t.done}</div>
            )}
          </div>

          <div className="fan-card">
            <div className="section-label on-dark">{t.fanMsgTitle}</div>
            <div className="fan-form name">
              <input
                type="text"
                value={fanName}
                onChange={(e) => onFanName(e.target.value)}
                placeholder={t.yourNamePh}
                maxLength={30}
              />
            </div>
            <div className="fan-form">
              <input
                type="text"
                value={fanDraft}
                onChange={(e) => onFanDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSendFan() }}
                placeholder={t.fanPh}
                maxLength={200}
              />
              <button onClick={onSendFan} disabled={!fanName.trim() || !fanDraft.trim()}>{t.send}</button>
            </div>
          </div>
        </>
      )}

      {tab === 'fixtures' && (
        <div className="fixtures-wrap">
          {league.rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="round-block">
              <div className="round-head">
                <div className="label">{roundIndex + 1}. {weekWord}</div>
                <div className="rule" />
                <div className="status">{round.every(m => m.completed) ? t.done : t.open}</div>
              </div>
              <div className="match-list">
                {round.map(match => {
                  const isBye = match.player2.id === 'bye'
                  const clickable = isOwner && !isBye
                  return (
                    <div
                      key={match.id}
                      className={`match-card ${match.completed ? 'completed' : ''} ${!clickable ? 'readonly' : ''}`}
                      onClick={() => (clickable ? onMatchClick(roundIndex, match) : null)}
                    >
                      <div className="match-grid">
                        <span className="m-name right">{match.player1.name}</span>
                        <div className="match-score-box">
                          <span>{match.completed ? match.score.player1 : '–'}</span>
                          <span className="sep">:</span>
                          <span>{match.completed ? match.score.player2 : '–'}</span>
                        </div>
                        <span className="m-name">{match.player2.name}</span>
                      </div>
                      <div className="match-result-text" style={{ color: match.completed ? 'var(--ink-soft)' : 'var(--red)' }}>
                        {isBye
                          ? 'BYE'
                          : match.completed
                            ? (
                              <>
                                {match.winner === 'draw' ? t.drawnMatch : `${t.winnerPre}: ${match.winner.name}`}
                                {isOwner && <span className="edit-hint"> • ✎ {t.editScoreHint}</span>}
                              </>
                            )
                            : t.tapToScore}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {history.length > 0 && (
            <div className="round-block">
              <div className="round-head">
                <div className="label">{t.history}</div>
                <div className="rule" />
                <div className="status">{history.length}</div>
              </div>
              <div className="match-list">
                {history.map(match => (
                  <div key={match.id} className="match-card completed readonly">
                    <div className="match-grid">
                      <span className="m-name right">{match.player1.name}</span>
                      <div className="match-score-box">
                        <span>{match.score.player1}</span>
                        <span className="sep">:</span>
                        <span>{match.score.player2}</span>
                      </div>
                      <span className="m-name">{match.player2.name}</span>
                    </div>
                    <div className="match-result-text" style={{ color: 'var(--ink-soft)' }}>
                      {match.week ? <span className="history-week-chip">{match.week}. {weekWord}</span> : null}
                      {match.winner === 'draw' ? t.drawnMatch : `${t.winnerPre}: ${match.winner?.name ?? ''}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="stats-wrap">
          {statCards.map(s => (
            <div key={s.id} className="stat-card">
              <div className="stat-card-head">
                <div className="stat-avatar">{s.initial}</div>
                <span className="stat-name">{s.name}</span>
                <span className="stat-rank">{s.rank}.</span>
              </div>
              <div className="stat-grid">
                <div className="stat-cell pts"><div className="v">{s.points}</div><div className="l">{t.pts}</div></div>
                <div className="stat-cell"><div className="v">{s.played}</div><div className="l">{t.played}</div></div>
                <div className="stat-cell"><div className="v">{s.gpg}</div><div className="l">{t.gpg}</div></div>
                <div className="stat-cell"><div className="v">{s.cpg}</div><div className="l">{t.cpg}</div></div>
                <div className="stat-cell"><div className="v">{s.winPct}%</div><div className="l">{t.winRate}</div></div>
              </div>
              <div className="stat-form-row">
                <span className="l">{t.form}</span>
                <div className="form-pills">
                  {s.form.map((r, idx) => (
                    // Localized letter (TR: G/B/M, EN: W/D/L); CSS class stays w/d/l.
                    <div key={idx} className={`form-pill ${r.toLowerCase()}`}>{t[r.toLowerCase()]}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-list">
        <button className="btn-outline-block" onClick={onExportCsv}>{t.exportCsv}</button>
        <button className="btn-outline-block" onClick={onShareEmail}>{t.shareEmail}</button>
        <button className="btn-outline-block" onClick={onSaveImage}>{t.saveImage}</button>
      </div>
    </>
  )
}

export default App
