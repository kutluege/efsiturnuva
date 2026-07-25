// Passwordless (email-link) sign-in flow.
//
// The user types their email, Firebase emails them a one-time sign-in link,
// and opening the link on this origin completes a verified session. The email
// on the resulting auth token is what Firestore rules trust for admin checks.

import {
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  onAuthStateChanged, signOut
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'

// Stored OUTSIDE the main app-state blob: the link may be opened in a fresh
// browser session where only this key is needed to finish sign-in.
const EMAIL_KEY = 'efsiturnuva:emailForSignIn'

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

// Build the continue-URL from the current location, preserving app params
// (like ?join=CODE) but never Firebase's own action params.
function continueUrl() {
  const url = new URL(window.location.href)
  ;['mode', 'oobCode', 'apiKey', 'continueUrl', 'lang'].forEach(p => url.searchParams.delete(p))
  return url.toString()
}

export async function sendLoginLink(email) {
  if (!isFirebaseConfigured) throw new Error('not-configured')
  const normalized = normalizeEmail(email)
  await sendSignInLinkToEmail(auth, normalized, {
    url: continueUrl(),
    handleCodeInApp: true
  })
  try {
    localStorage.setItem(EMAIL_KEY, normalized)
  } catch {
    // storage disabled — the confirm-email fallback will ask for the address
  }
}

export function isCompletingSignIn() {
  if (!isFirebaseConfigured) return false
  return isSignInWithEmailLink(auth, window.location.href)
}

export function getStoredSignInEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

// The sign-in link's oobCode is single-use, and React StrictMode double-runs
// effects in dev — a module-level guard makes completion idempotent.
let completionPromise = null

export function completeSignIn(emailOverride) {
  if (!isFirebaseConfigured) return Promise.reject(new Error('not-configured'))
  if (completionPromise) return completionPromise

  const email = normalizeEmail(emailOverride || getStoredSignInEmail())
  if (!email) return Promise.reject(new Error('email-required'))

  completionPromise = signInWithEmailLink(auth, email, window.location.href)
    .then(result => {
      try {
        localStorage.removeItem(EMAIL_KEY)
      } catch {
        // noop
      }
      // Strip Firebase action params from the URL, keep app params (?join).
      const url = new URL(window.location.href)
      ;['mode', 'oobCode', 'apiKey', 'continueUrl', 'lang'].forEach(p => url.searchParams.delete(p))
      window.history.replaceState({}, '', url.toString())
      return result.user
    })
    .catch(err => {
      completionPromise = null // allow retry (e.g. wrong email on another device)
      throw err
    })

  return completionPromise
}

export function watchAuth(callback) {
  if (!isFirebaseConfigured) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

export function logout() {
  if (!isFirebaseConfigured) return Promise.resolve()
  return signOut(auth)
}
