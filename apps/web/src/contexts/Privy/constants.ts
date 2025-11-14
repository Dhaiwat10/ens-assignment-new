import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: 'pancakeswap-prod-firebase.firebaseapp.com',
  projectId: 'pancakeswap-prod-firebase',
  storageBucket: 'pancakeswap-prod-firebase.firebasestorage.app',
  messagingSenderId: '901250967709',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)

// Initialize Firebase only when configuration is present to avoid auth/invalid-api-key at runtime
export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : undefined
