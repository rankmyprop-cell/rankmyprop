import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const env = import.meta.env

const firebaseConfig = {
  apiKey: String(env.VITE_FIREBASE_API_KEY || 'AIzaSyBACBm1Yr4zf-KVy1ejRPJ1rqKFctEumuA'),
  authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN || 'rank-my-prop.firebaseapp.com'),
  projectId: String(env.VITE_FIREBASE_PROJECT_ID || 'rank-my-prop'),
  storageBucket: String(env.VITE_FIREBASE_STORAGE_BUCKET || 'rank-my-prop.firebasestorage.app'),
  messagingSenderId: String(env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1094966707382'),
  appId: String(env.VITE_FIREBASE_APP_ID || '1:1094966707382:web:c4cd641630588d6adc9217'),
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)
