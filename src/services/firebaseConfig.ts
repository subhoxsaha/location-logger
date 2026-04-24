import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
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

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Validates that critical Firebase config fields are present.
 */
const isConfigValid = (): boolean => {
  const { apiKey, projectId, appId } = firebaseConfig;
  return !!(apiKey && projectId && appId && !apiKey.includes('YOUR_'));
};

try {
  if (!isConfigValid()) {
    console.warn('[Firebase] Configuration incomplete. Check your .env file.');
  } else {
    // Initialize or Retrieve Firebase App
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } else {
      app = getApp();
      auth = getAuth(app);
    }
    
    // Initialize Firestore
    db = getFirestore(app);
  }
} catch (error) {
  console.error('[Firebase] Initialization failed:', error);
}

export { auth, db };
export default app;
