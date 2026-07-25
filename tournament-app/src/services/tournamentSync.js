import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

// League codes are 4-digit numbers; the code IS the Firestore document ID,
// which lets security rules allow single-doc `get` while denying `list`.
export function isValidLeagueCode(code) {
  return /^\d{4}$/.test(code)
}

// Firestore rejects nested arrays, but league.rounds is match[][] — wrap each
// round in an object for storage and unwrap when reading.
function serializeLeague(league) {
  return {
    ...league,
    rounds: (league.rounds || []).map(round => ({ matches: round }))
  }
}

function deserializeLeague(data) {
  return {
    ...data,
    rounds: (data.rounds || []).map(round => (Array.isArray(round) ? round : (round.matches || [])))
  }
}

export async function joinCodeExists(code) {
  if (!isFirebaseConfigured || !code) return false
  const snap = await getDoc(doc(db, 'tournaments', code))
  return snap.exists()
}

// Fetch a league once (used when resuming a league on a new device).
export async function fetchRemoteLeague(code) {
  if (!isFirebaseConfigured || !code) return null
  const snap = await getDoc(doc(db, 'tournaments', code))
  return snap.exists() ? deserializeLeague(snap.data()) : null
}

export async function createRemoteLeague(id, data) {
  if (!isFirebaseConfigured || !id) return
  await setDoc(doc(db, 'tournaments', id), {
    ...serializeLeague(data),
    joinCode: id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function updateRemoteTournament(code, data) {
  if (!isFirebaseConfigured || !code) return
  await setDoc(doc(db, 'tournaments', code), { ...serializeLeague(data), updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeToTournament(code, onData, onError) {
  if (!isFirebaseConfigured || !code) {
    onError?.(new Error('not-configured'))
    return () => {}
  }
  return onSnapshot(
    doc(db, 'tournaments', code),
    snap => (snap.exists() ? onData(deserializeLeague(snap.data())) : onError?.(new Error('not-found'))),
    onError
  )
}
