import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('AuthContext');

// ─── Types ───
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  /** Boot sequence phase (used by SplashScreen) */
  bootPhase: BootPhase;
  bootDone: boolean;
  configError: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

type BootPhase = 'core' | 'firebase' | 'auth' | 'done';

type AuthContextType = AuthState & AuthActions;

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  bootPhase: 'core',
  bootDone: false,
  configError: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

/**
 * Hook to access auth state and actions from any component.
 */
export const useAuth = () => useContext(AuthContext);

// ─── Helpers ───
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Validates email format.
 */
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Invalid email format';
  return null;
};

/**
 * Validates password strength.
 */
export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

/**
 * Maps Firebase auth error codes to user-friendly messages.
 */
const getFirebaseErrorMessage = (code: string): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection';
    default:
      return 'Authentication failed. Please try again';
  }
};

// ─── Provider ───
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bootPhase, setBootPhase] = useState<BootPhase>('core');
  const [bootDone, setBootDone] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // ── Boot sequence ──
  useEffect(() => {
    const boot = async () => {
      try {
        // Phase 1: Core
        setBootPhase('core');
        logger.info('Boot sequence started');
        await DebugLogger.loadPersistedLogs();
        await delay(500);

        // Phase 2: Firebase
        setBootPhase('firebase');
        logger.debug('Validating Firebase configuration...');
        if (!auth) {
          logger.warn('Firebase Auth not configured');
        }
        await delay(400);

        // Phase 3: Auth session restore
        setBootPhase('auth');
        logger.debug('Attempting session restoration...');

        if (auth) {
          await new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth!, (fbUser) => {
              if (fbUser) {
                setUser({
                  uid: fbUser.uid,
                  email: fbUser.email,
                  displayName: fbUser.displayName,
                });
                logger.info('Session restored', { uid: fbUser.uid });
              } else {
                setUser(null);
                logger.info('No active session');
              }
              unsubscribe();
              resolve();
            });
            // Safety timeout
            setTimeout(() => { unsubscribe(); resolve(); }, 5000);
          });
        }
        await delay(300);

        // Phase 4: Done
        setBootPhase('done');
        logger.info('Boot sequence complete');
        await delay(600);
        setBootDone(true);
      } catch (e) {
        logger.error('Boot failed', e);
        setConfigError('Initialization failed. Please restart the app.');
      }
    };

    boot();
  }, []);

  // ── Keep user state synced after boot ──
  useEffect(() => {
    if (!auth || !bootDone) return;
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [bootDone]);

  // ── Actions ──
  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      logger.info('Login successful', { uid: cred.user.uid });
    } catch (error: any) {
      const msg = getFirebaseErrorMessage(error?.code || '');
      logger.error('Login failed', { code: error?.code });
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized');
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      logger.info('Signup successful', { uid: cred.user.uid });
    } catch (error: any) {
      const msg = getFirebaseErrorMessage(error?.code || '');
      logger.error('Signup failed', { code: error?.code });
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (auth) await signOut(auth);
      setUser(null);
      logger.info('User signed out');
    } catch (error) {
      logger.error('Logout error', error);
      throw new Error('Failed to sign out');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        bootPhase,
        bootDone,
        configError,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
