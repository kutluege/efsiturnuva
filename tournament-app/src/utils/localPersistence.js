import { generateUniqueLeagueId, createDefaultDraw, createDefaultSettings } from './fixtures'

const STORAGE_KEY = 'efsiturnuva:state:v2'
const LEGACY_KEY = 'efsiturnuva:state:v1'

// v2 shape:
// {
//   version: 2,
//   lang: 'tr' | 'en',
//   currentView: 'home' | 'setup' | 'participants' | 'tournament',
//   activeLeagueId: '4821' | null,
//   setupDraft: { tournamentName, participantCount, matchType, participants },
//   leagues: { [fourDigitId]: league }
// }

export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.version === 2) return parsed
    }
    return migrateLegacyState()
  } catch {
    return null
  }
}

// Convert the old single-tournament v1 blob into a league with a fresh 4-digit ID.
function migrateLegacyState() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const v1 = JSON.parse(raw)
    if (v1?.version !== 1) return null

    const state = {
      version: 2,
      lang: v1.lang ?? 'tr',
      currentView: 'setup',
      activeLeagueId: null,
      setupDraft: {
        tournamentName: v1.tournamentName ?? '',
        participantCount: v1.participantCount ?? 4,
        matchType: v1.matchType ?? 'double',
        participants: v1.participants ?? []
      },
      leagues: {}
    }

    if (v1.tournament) {
      const id = generateUniqueLeagueId([])
      state.leagues[id] = {
        id,
        name: v1.tournament.name || 'Turnuva',
        participants: v1.tournament.participants || [],
        rounds: v1.tournament.rounds || [],
        matchType: v1.matchType ?? 'double',
        currentRound: v1.tournament.currentRound ?? 0,
        draw: v1.tournament.draw ?? createDefaultDraw(),
        settings: v1.tournament.settings ?? createDefaultSettings(),
        matchHistory: [],
        isOwner: v1.sync?.isOwner ?? true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      state.activeLeagueId = id
      state.currentView = 'tournament'
    }

    saveAppState(state)
    localStorage.removeItem(LEGACY_KEY)
    return state
  } catch {
    return null
  }
}

export function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 2 }))
  } catch {
    // quota exceeded / storage disabled (e.g. private browsing) — non-fatal
  }
}

export function clearAppState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
