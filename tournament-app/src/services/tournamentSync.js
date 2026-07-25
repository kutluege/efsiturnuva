import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

// Ambiguous characters (0/O, 1/I/L) excluded so codes are easy to read/type aloud.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 6) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

export async function joinCodeExists(code) {
  if (!isFirebaseConfigured || !code) return false
  const snap = await getDoc(doc(db, 'tournaments', code))
  return snap.exists()
}

// Tries a handful of freshly-generated codes until it finds one that isn't already taken.
export async function createRemoteTournament(data) {
  if (!isFirebaseConfigured) return null

  let code = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateJoinCode()
    if (!(await joinCodeExists(candidate))) {
      code = candidate
      break
    }
  }
  if (!code) return null

  await setDoc(doc(db, 'tournaments', code), {
    ...data,
    joinCode: code,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return code
}

export async function updateRemoteTournament(code, data) {
  if (!isFirebaseConfigured || !code) return
  await setDoc(doc(db, 'tournaments', code), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeToTournament(code, onData, onError) {
  if (!isFirebaseConfigured || !code) {
    onError?.(new Error('not-configured'))
    return () => {}
  }
  return onSnapshot(
    doc(db, 'tournaments', code),
    snap => (snap.exists() ? onData(snap.data()) : onError?.(new Error('not-found'))),
    onError
  )
}
