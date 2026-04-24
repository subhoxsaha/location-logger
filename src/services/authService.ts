import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { UserAuth } from '../types';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('AuthService');

export class AuthService {
  static async initializeGoogleSignIn(webClientId: string): Promise<void> {
    try {
      await GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
      });
      logger.info('Google SignIn initialized');
    } catch (error) {
      logger.error('Google SignIn init error', error);
      throw error;
    }
  }

  static async signInWithGoogle(): Promise<UserAuth> {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      const user = userInfo?.data?.user || userInfo?.user || userInfo;
      const idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (idToken && auth) {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);

        const userData: UserAuth = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || 'User',
          photoURL: userCredential.user.photoURL || undefined,
        };

        logger.info('Google sign in successful', { uid: userData.uid });
        return userData;
      }

      throw new Error('No ID token from Google SignIn');
    } catch (error) {
      logger.error('Google sign in error', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      if (auth) await firebaseSignOut(auth);
      logger.info('User signed out');
    } catch (error) {
      logger.error('Sign out error', error);
      throw error;
    }
  }

  static getCurrentUser(): UserAuth | null {
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || undefined,
    };
  }
}
