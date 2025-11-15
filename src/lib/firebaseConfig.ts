// This file is gitignored. Create a firebaseConfig.ts file in your project.
// For local development, you can use environment variables.
// In a production environment, you should use a secure way to manage these keys.

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Validate that all required environment variables are present
if (typeof window !== 'undefined') {
  // Only log on client side
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    console.error('Firebase Config Error: Missing environment variables');
    console.error('apiKey:', apiKey ? '✓' : '✗');
    console.error('authDomain:', authDomain ? '✓' : '✗');
    console.error('projectId:', projectId ? '✓' : '✗');
    console.error('storageBucket:', storageBucket ? '✓' : '✗');
    console.error('messagingSenderId:', messagingSenderId ? '✓' : '✗');
    console.error('appId:', appId ? '✓' : '✗');
  } else {
    console.log('Firebase Config: All environment variables loaded successfully');
  }
}

export const firebaseConfig = {
  apiKey: apiKey || '',
  authDomain: authDomain || '',
  projectId: projectId || '',
  storageBucket: storageBucket || '',
  messagingSenderId: messagingSenderId || '',
  appId: appId || '',
};
