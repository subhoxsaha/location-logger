import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available at runtime in RN but sometimes missing from TS definitions in Firebase 10+
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { 
  FIREBASE_API_KEY, 
  FIREBASE_AUTH_DOMAIN, 
  FIREBASE_PROJECT_ID, 
  FIREBASE_STORAGE_BUCKET, 
  FIREBASE_MESSAGING_SENDER_ID, 
  FIREBASE_APP_ID 
} from '@env';

// ─── Firebase Configuration ───
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};



/**
 * Validates that critical Firebase config fields are present.
 */
const isConfigValid = (): boolean => {
  const { apiKey, projectId, appId } = firebaseConfig;
  return !!(apiKey && projectId && appId && !apiKey.includes('YOUR_'));
};

// Initialize or Retrieve Firebase App
let app: FirebaseApp;
if (getApps().length === 0) {
  if (!isConfigValid()) {
    throw new Error('[Firebase] Configuration incomplete. Check your .env file.');
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
