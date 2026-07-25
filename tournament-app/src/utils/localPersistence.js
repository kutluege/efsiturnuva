const STORAGE_KEY = 'efsiturnuva:state:v1'

export function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }))
  } catch {
    // quota exceeded / storage disabled (e.g. private browsing) — non-fatal
  }
}

export function clearLocalState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // noop
  }
}
