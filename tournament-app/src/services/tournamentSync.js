import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp,
  collection, addDoc, query, where, orderBy, limit, writeBatch
} from 'firebase/firestore'
import { db, auth, isFirebaseConfigured } from '../firebase'

// League codes are 4-digit numbers; the code IS the Firestore document ID,
// which lets security rules allow single-doc `get` while denying open `list`.
export function isValidLeagueCode(code) {
  return /^\d{4}$/.test(code)
}

// Local-only fields that must never reach Firestore:
// - isOwner / fanNotes: per-device state
// - adminEmails: managed ONLY via setAdminEmails/claimLegacyLeague so a stale
//   device's routine write-through can't clobber the admin list
// - adminKey / adminEmail: legacy fields, never written by the new client
//   (with merge:true the stored legacy adminKey survives untouched, which is
//   exactly what the legacy-immutability rule requires)
const LOCAL_ONLY_FIELDS = ['isOwner', 'fanNotes', 'adminEmails', 'adminKey', 'adminEmail']

// Firestore rejects nested arrays, but league.rounds is match[][] — wrap each
// round in an object for storage and unwrap when reading.
function serializeLeague(league) {
  const data = {
    ...league,
    rounds: (league.rounds || []).map(round => ({ matches: round }))
  }
  LOCAL_ONLY_FIELDS.forEach(field => delete data[field])
  return data
}

// Remote docs carry Firestore Timestamps for updatedAt/createdAt while local
// state uses epoch millis — normalize so sorting/merging never sees objects.
function toMillis(value) {
  return typeof value?.toMillis === 'function' ? value.toMillis() : value
}

function deserializeLeague(data) {
  return {
    ...data,
    rounds: (data.rounds || []).map(round => (Array.isArray(round) ? round : (round.matches || []))),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt)
  }
}

export async function joinCodeExists(code) {
  if (!isFirebaseConfigured || !code) return false
  const snap = await getDoc(doc(db, 'tournaments', code))
  return snap.exists()
}

// Fetch a league once (used when joining a league on a new device).
export async function fetchRemoteLeague(code) {
  if (!isFirebaseConfigured || !code) return null
  const snap = await getDoc(doc(db, 'tournaments', code))
  return snap.exists() ? deserializeLeague(snap.data()) : null
}

export async function createRemoteLeague(id, data, adminEmail) {
  if (!isFirebaseConfigured || !id) return
  await setDoc(doc(db, 'tournaments', id), {
    ...serializeLeague(data),
    adminEmails: [adminEmail],
    joinCode: id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function updateRemoteTournament(code, data) {
  if (!isFirebaseConfigured || !code) return
  await setDoc(doc(db, 'tournaments', code), { ...serializeLeague(data), updatedAt: serverTimestamp() }, { merge: true })
}

// ---- Admin management (email-based ownership) ----

export async function setAdminEmails(code, emails) {
  if (!isFirebaseConfigured || !code) return
  await updateDoc(doc(db, 'tournaments', code), {
    adminEmails: emails,
    updatedAt: serverTimestamp()
  })
}

// One-time migration for leagues created under the old adminKey system:
// the caller verifies the key client-side, then takes ownership by email.
// Rules only accept adminEmails == [the signed-in user's email] here.
export async function claimLegacyLeague(code, email) {
  if (!isFirebaseConfigured || !code) return
  await updateDoc(doc(db, 'tournaments', code), {
    adminEmails: [email],
    updatedAt: serverTimestamp()
  })
}

// Live list of every league where `email` is an admin. Rules require exactly
// this query shape (array-contains on the caller's own token email).
export function subscribeToMyLeagues(email, onData) {
  if (!isFirebaseConfigured || !email) return () => {}
  const q = query(collection(db, 'tournaments'), where('adminEmails', 'array-contains', email))
  return onSnapshot(q, snap => {
    onData(snap.docs.map(d => ({ ...deserializeLeague(d.data()), id: d.id })))
  }, err => console.error('[firebase] my-leagues subscription failed', err))
}

// Permanently delete a league. The messages subcollection must be purged
// FIRST: its delete rule authorizes via get() on the parent doc, so once the
// parent is gone the messages would be undeletable orphans.
export async function deleteRemoteLeague(code) {
  if (!isFirebaseConfigured || !code) return
  const messagesCol = collection(db, 'tournaments', code, 'messages')
  for (;;) {
    const snap = await getDocs(query(messagesCol, limit(100)))
    if (snap.empty) break
    const batch = writeBatch(db)
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  await deleteDoc(doc(db, 'tournaments', code))
}

// ---- Viewer notes (spectators leave a named note under the scoreboard) ----
// Stored in a subcollection so viewers can append without touching the
// (admin-only) main tournament document.

export async function sendFanNote(code, { name, text }) {
  if (!isFirebaseConfigured || !code) return false
  await addDoc(collection(db, 'tournaments', code, 'messages'), {
    name: String(name).slice(0, 30),
    text: String(text).slice(0, 200),
    createdAt: serverTimestamp()
  })
  return true
}

export function subscribeToFanNotes(code, onData) {
  if (!isFirebaseConfigured || !code) return () => {}
  const q = query(
    collection(db, 'tournaments', code, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(30)
  )
  return onSnapshot(q, snap => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, err => console.error('[firebase] fan notes subscription failed', err))
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

// Is there a signed-in user right now? (used to avoid firing debounced writes
// after sign-out)
export function hasAuthUser() {
  return Boolean(auth?.currentUser)
}
