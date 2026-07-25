import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'
import TeamDrawTab from './components/TeamDrawTab'
import { calculateLeaderboard } from './utils/leaderboard'
import { loadAppState } from './utils/localPersistence'
import { useAppPersistence } from './hooks/useTournamentPersistence'
import { generateRounds, createDefaultDraw, createDefaultSettings, generateUniqueLeagueId, generateAdminKey } from './utils/fixtures'
import { isFirebaseConfigured } from './firebase'
import {
  createRemoteLeague, updateRemoteTournament, subscribeToTournament,
  fetchRemoteLeague, joinCodeExists, isValidLeagueCode,
  sendFanNote, subscribeToFanNotes
} from './services/tournamentSync'
import { isEmailConfigured, sendAdminKeyEmail, openAdminKeyMailto } from './services/adminEmail'
import { getCopy } from './i18n'

function SoccerBall({ dark }) {
  return (
    <div className={`soccer-ball ${dark ? 'dark' : ''}`}>
      <div className="p p1" />
      <div className="p p2" />
      <div className="p p3" />
    </div>
  )
}

function Header({ lang, t, onSetLang }) {
  return (
    <div className="app-header">
      <div className="logo-badge">EF</div>
      <div className="brand-block">
        <div className="brand-title">EFSİ <span className="accent">LİG</span></div>
        <div className="brand-tagline">{t.tagline}</div>
      </div>
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

function AdminKeyModal({ t, adminKey, emailStatus, onClose }) {
  const [copied, setCopied] = useState(false)

  const copyKey = () => {
    navigator.clipboard.writeText(adminKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="sheet-overlay center">
      <div className="champion-card">
        <div className="kicker">{t.adminIdTitle}</div>
        <div className="admin-key-value">{adminKey}</div>
        <div className="note">{t.adminKeyModalNote}</div>
        {emailStatus === 'sent' && <div className="admin-email-status ok">✓ {t.adminEmailSent}</div>}
        {emailStatus === 'failed' && <div className="admin-email-status err">{t.adminEmailFailed}</div>}
        {emailStatus === 'mailto' && <div className="admin-email-status">{t.adminEmailMailto}</div>}
        <button className="btn-outline-block" style={{ marginBottom: 10 }} onClick={copyKey}>
          {copied ? t.copied : t.copyKey}
        </button>
        <button onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}

function HomeScreen({ t, leagues, onOpenLeague, onNewLeague, joinCodeInput, onJoinInput, adminKeyInput, onAdminKeyInput, joinError, isJoining, onJoin }) {
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
        {list.map(l => (
          <div key={l.id} className="league-row" onClick={() => onOpenLeague(l.id)}>
            <div className="league-id-badge">#{l.id}</div>
            <div className="league-info">
              <div className="league-name">{l.name}</div>
              <div className="league-meta">
                {l.participants.length} {t.playersUnit} • {l.isOwner ? t.managerChip : t.viewerChip}
              </div>
            </div>
            <span className="league-open">→</span>
          </div>
        ))}
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
        </div>
        <div className="join-form" style={{ marginTop: 8 }}>
          <input
            type="text"
            value={adminKeyInput}
            onChange={(e) => onAdminKeyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder={t.adminKeyPh}
            maxLength={8}
          />
        </div>
        <div className="join-mode-row">
          <button className="btn-outline-block" disabled={!canJoin} onClick={() => onJoin(joinCodeInput, 'resume', adminKeyInput)}>
            {isJoining ? t.joining : t.resume}
          </button>
          <button className="btn-outline-block" disabled={!canJoin} onClick={() => onJoin(joinCodeInput, 'watch', adminKeyInput)}>
            {t.watch}
          </button>
        </div>
        {joinError && <p className="join-error">{joinError}</p>}
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

          <div className="email-box">
            <div className="title">{t.emailTitle}</div>
            <div className="note">{t.emailNote}</div>
            <input type="email" placeholder={t.emailPh} />
          </div>

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
  const [creatorEmail, setCreatorEmail] = useState(() => boot?.setupDraft?.creatorEmail ?? '')

  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [adminKeyInput, setAdminKeyInput] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const hasAutoJoined = useRef(false)

  // Freshly created league: show the admin key once, with email delivery status.
  const [adminKeyReveal, setAdminKeyReveal] = useState(null) // { adminKey, emailStatus }

  // Viewer notes (feature: spectator name + note shown under the scoreboard)
  const [fanName, setFanName] = useState(() => boot?.fanName ?? '')
  const [fanNotes, setFanNotes] = useState([])

  const [activeTab, setActiveTab] = useState('tournament') // 'tournament' | 'team-draw'
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [championDismissed, setChampionDismissed] = useState(false)
  const [toasts, setToasts] = useState([])
  const [fanDraft, setFanDraft] = useState('')
  const fanTimerRef = useRef(null)

  const t = getCopy(lang)
  const activeLeague = activeLeagueId ? leagues[activeLeagueId] : null
  const isOwner = activeLeague?.isOwner ?? true

  const persistSnapshot = useMemo(() => ({
    version: 2,
    lang,
    currentView: view,
    activeLeagueId,
    fanName,
    setupDraft: { tournamentName, participantCount, matchType, participants: draftParticipants, creatorEmail },
    leagues
  }), [lang, view, activeLeagueId, fanName, tournamentName, participantCount, matchType, draftParticipants, creatorEmail, leagues])

  useAppPersistence(persistSnapshot)

  const mutateActiveLeague = (updater) => {
    if (!activeLeagueId) return
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

  const createLeague = async () => {
    if (draftParticipants.length !== participantCount) return

    const shuffled = [...draftParticipants].sort(() => Math.random() - 0.5)
    const rounds = generateRounds(shuffled, matchType)

    let id = generateUniqueLeagueId(Object.keys(leagues))
    if (isFirebaseConfigured) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const taken = await joinCodeExists(id).catch(() => false)
        if (!taken) break
        id = generateUniqueLeagueId([...Object.keys(leagues), id])
      }
    }

    const adminKey = generateAdminKey()
    const email = creatorEmail.trim()

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
      adminKey,
      adminEmail: email,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    setLeagues(prev => ({ ...prev, [id]: league }))
    setActiveLeagueId(id)
    setView('tournament')
    setActiveTab('tournament')
    setChampionDismissed(false)
    setDraftParticipants([])

    if (isFirebaseConfigured) {
      createRemoteLeague(id, league)
        .catch(err => console.error('[firebase] failed to create remote league', err))
    }

    // Deliver the admin key to the creator's email; always reveal it once in the UI too.
    const emailPayload = { toEmail: email, leagueName: league.name, leagueId: id, adminKey }
    if (email && isEmailConfigured) {
      setAdminKeyReveal({ adminKey, emailStatus: 'pending' })
      sendAdminKeyEmail(emailPayload)
        .then(ok => setAdminKeyReveal({ adminKey, emailStatus: ok ? 'sent' : 'failed' }))
        .catch(() => setAdminKeyReveal({ adminKey, emailStatus: 'failed' }))
    } else if (email) {
      openAdminKeyMailto(emailPayload)
      setAdminKeyReveal({ adminKey, emailStatus: 'mailto' })
    } else {
      setAdminKeyReveal({ adminKey, emailStatus: null })
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

  // Owner write-through: push every league change to Firestore.
  useEffect(() => {
    if (!isFirebaseConfigured || !activeLeague || !activeLeague.isOwner) return
    const timer = setTimeout(() => {
      updateRemoteTournament(activeLeague.id, activeLeague)
        .catch(err => console.error('[firebase] failed to sync league', err))
    }, 400)
    return () => clearTimeout(timer)
  }, [activeLeague])

  // Follower subscription: keep watched leagues live.
  useEffect(() => {
    if (!activeLeagueId || !activeLeague || activeLeague.isOwner) return
    const unsubscribe = subscribeToTournament(
      activeLeagueId,
      data => setLeagues(prev => {
        const current = prev[activeLeagueId]
        if (!current) return prev
        return { ...prev, [activeLeagueId]: { ...current, ...data, id: activeLeagueId, isOwner: false, updatedAt: Date.now() } }
      }),
      () => setJoinError(t.joinNotFound)
    )
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeagueId, activeLeague?.isOwner])

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

  const joinLeague = async (rawCode, mode, adminKeyAttempt = '') => {
    const code = rawCode.trim()
    const keyAttempt = adminKeyAttempt.trim().toUpperCase()

    if (!isValidLeagueCode(code)) {
      setJoinError(t.joinNotFound)
      return
    }

    // Saved on this device → reopen. Resuming a league saved as viewer still
    // requires the admin key (which upgrades it to owner).
    const saved = leagues[code]
    if (saved && (mode === 'watch' || saved.isOwner)) {
      openLeague(code)
      return
    }
    if (saved && mode === 'resume' && saved.adminKey) {
      if (keyAttempt === saved.adminKey) {
        setLeagues(prev => ({ ...prev, [code]: { ...prev[code], isOwner: true } }))
        openLeague(code)
      } else {
        setJoinError(keyAttempt ? t.adminKeyWrong : t.adminKeyRequired)
      }
      return
    }

    if (!isFirebaseConfigured) {
      setJoinError(t.joinDisabled)
      return
    }

    if (mode === 'resume' && !keyAttempt) {
      setJoinError(t.adminKeyRequired)
      return
    }

    setIsJoining(true)
    setJoinError('')
    const data = await fetchRemoteLeague(code).catch(() => null)
    setIsJoining(false)

    if (!data) {
      setJoinError(t.joinNotFound)
      return
    }

    // Resuming as manager: the entered admin key must match the one the league
    // was created with. (Legacy leagues without a stored key stay open.)
    if (mode === 'resume' && data.adminKey && data.adminKey !== keyAttempt) {
      setJoinError(t.adminKeyWrong)
      return
    }

    const league = {
      matchHistory: [],
      draw: createDefaultDraw(),
      settings: createDefaultSettings(),
      matchType: 'double',
      ...data,
      id: code,
      isOwner: mode === 'resume',
      updatedAt: Date.now()
    }

    setLeagues(prev => ({ ...prev, [code]: league }))
    setAdminKeyInput('')
    openLeague(code)
  }

  // Auto-join if the page was opened via a shared ?join=CODE link (watch mode).
  useEffect(() => {
    if (hasAutoJoined.current) return
    hasAutoJoined.current = true
    const codeFromUrl = new URLSearchParams(window.location.search).get('join')
    if (codeFromUrl && isValidLeagueCode(codeFromUrl)) {
      setJoinCodeInput(codeFromUrl)
      setView('home')
      joinLeague(codeFromUrl, 'watch')
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
      winPct: played ? Math.round((p.wins / played) * 100) : 0,
      form: p.matches.slice(-5).map(m => (m.result === 'win' ? 'W' : m.result === 'draw' ? 'D' : 'L'))
    }
  })

  const isChampionTime = tournamentCompleted && !championDismissed && leaderboard.length > 0

  const goHome = () => {
    setView('home')
    setJoinError('')
  }

  return (
    <div className="page-bg">
      <div className="decor">
        <div className="decor-ball b1"><SoccerBall /></div>
        <div className="decor-ball b2"><SoccerBall /></div>
        <div className="decor-ball b3"><SoccerBall /></div>
        <div className="decor-ball b4"><SoccerBall dark /></div>
      </div>

      <div className="app-frame">
        <Header lang={lang} t={t} onSetLang={setLang} />
        <Ticker t={t} />

        <div className={`app-content ${showNav ? 'has-nav' : ''}`}>

          {view === 'home' && (
            <HomeScreen
              t={t}
              leagues={leagues}
              onOpenLeague={openLeague}
              onNewLeague={() => setView('setup')}
              joinCodeInput={joinCodeInput}
              onJoinInput={(v) => { setJoinCodeInput(v); setJoinError('') }}
              adminKeyInput={adminKeyInput}
              onAdminKeyInput={(v) => { setAdminKeyInput(v); setJoinError('') }}
              joinError={joinError}
              isJoining={isJoining}
              onJoin={joinLeague}
            />
          )}

          {view === 'setup' && (
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
                  <label className="field-label">{t.creatorEmail}</label>
                  <input
                    type="email"
                    className="text-input"
                    value={creatorEmail}
                    onChange={(e) => setCreatorEmail(e.target.value)}
                    placeholder={t.creatorEmailPh}
                    style={{ textTransform: 'none' }}
                  />
                  <div className="field-note">{t.creatorEmailNote}</div>
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

          {view === 'participants' && (
            <ParticipantManager
              t={t}
              participants={draftParticipants}
              participantCount={participantCount}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              onGenerateTournament={createLeague}
              onBack={() => setView('setup')}
            />
          )}

          {view === 'tournament' && activeLeague && activeTab === 'tournament' && (
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
              onCopyLink={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?join=${activeLeague.id}`)}
              onExportCsv={exportToExcel}
              onShareEmail={shareViaEmail}
              onSaveImage={downloadAsImage}
            />
          )}

          {view === 'tournament' && activeLeague && activeTab === 'team-draw' && (
            <TeamDrawTab
              t={t}
              tournament={activeLeague}
              draw={activeLeague.draw}
              onDrawChange={updateDraw}
              isOwner={isOwner}
              onBack={() => setActiveTab('tournament')}
            />
          )}

          {view === 'tournament' && !activeLeague && (
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

      {adminKeyReveal && (
        <AdminKeyModal
          t={t}
          adminKey={adminKeyReveal.adminKey}
          emailStatus={adminKeyReveal.emailStatus}
          onClose={() => setAdminKeyReveal(null)}
        />
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
  onMatchClick, onOpenSettings, onOpenRoster, onCopyLink,
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
          <span>
            {t.leagueId}: <strong>#{league.id}</strong>
            {league.adminKey && <> • {t.adminIdLabel}: <strong>{league.adminKey}</strong></>}
          </span>
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
            {fanNotes.map(note => (
              <div key={note.id} className="note-row">
                <span className="note-name">{note.name}</span>
                <span className="note-text">{note.text}</span>
              </div>
            ))}
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
                <div className="stat-cell"><div className="v">{s.winPct}%</div><div className="l">{t.winRate}</div></div>
              </div>
              <div className="stat-form-row">
                <span className="l">{t.form}</span>
                <div className="form-pills">
                  {s.form.map((r, idx) => (
                    <div key={idx} className={`form-pill ${r.toLowerCase()}`}>{r}</div>
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
