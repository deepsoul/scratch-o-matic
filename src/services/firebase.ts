import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

export function isFirebaseEnabled(): boolean {
  return import.meta.env.VITE_USE_FIREBASE === 'true'
}

export function isFirebaseConfigured(): boolean {
  const e = import.meta.env
  return Boolean(
    e.VITE_FIREBASE_API_KEY &&
    e.VITE_FIREBASE_AUTH_DOMAIN &&
    e.VITE_FIREBASE_PROJECT_ID &&
    e.VITE_FIREBASE_STORAGE_BUCKET &&
    e.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    e.VITE_FIREBASE_APP_ID,
  )
}

export function getFirebaseOrNull(): {
  app: FirebaseApp
  auth: Auth
  db: Firestore
  storage: FirebaseStorage
} | null {
  if (!isFirebaseEnabled() || !isFirebaseConfigured()) return null
  if (app && auth && db && storage) return { app, auth, db, storage }

  const e = import.meta.env
  app = initializeApp({
    apiKey: e.VITE_FIREBASE_API_KEY,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: e.VITE_FIREBASE_APP_ID,
  })
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  return { app, auth, db, storage }
}

export async function signInWithGoogle(): Promise<void> {
  const fb = getFirebaseOrNull()
  if (!fb) throw new Error('Firebase not configured')
  await signInWithPopup(fb.auth, new GoogleAuthProvider())
}

export function subscribeAuth(
  cb: (user: { uid: string; email: string | null; displayName: string | null } | null) => void,
): () => void {
  const fb = getFirebaseOrNull()
  if (!fb) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(fb.auth, (u) => {
    if (!u) {
      cb(null)
      return
    }
    cb({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
    })
  })
}
