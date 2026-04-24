import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  onSnapshot, 
  deleteDoc, 
  setDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { LocationRecord } from '../types';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('FirebaseService');

const COLLECTIONS = {
  LOCATIONS: 'locations',
  USERS: 'users',
};

export class FirebaseService {
  /**
   * Sync location records to Firestore
   */
  static async syncLocations(userId: string, records: LocationRecord[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const locationsRef = collection(db, COLLECTIONS.LOCATIONS);

      for (const record of records) {
        const docRef = doc(locationsRef, `${userId}_${record.id}`);
        batch.set(docRef, {
          ...record,
          userId,
          syncedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      logger.info('Locations synced', { count: records.length });
    } catch (error: any) {
      const msg = error.code === 'permission-denied' 
        ? 'Sync failed: Authentication expired.' 
        : `Sync error: ${error.message}`;
      logger.error('Sync locations error', { code: error.code, message: error.message });
      throw new Error(msg);
    }
  }

  /**
   * Get user location history from Firestore
   */
  static async getUserLocationHistory(
    userId: string,
    limitCount: number = 100
  ): Promise<LocationRecord[]> {
    try {
      const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
      const q = query(
        locationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        ...doc.data(),
      } as LocationRecord));

      logger.debug('Location history retrieved', { count: records.length });
      return records;
    } catch (error) {
      logger.error('Get location history error', error);
      return [];
    }
  }

  /**
   * Save user profile
   */
  static async saveUserProfile(
    userId: string,
    profileData: { email: string; displayName: string; photoURL?: string }
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      logger.info('User profile saved', { userId });
    } catch (error) {
      logger.error('Save user profile error', error);
      throw error;
    }
  }

  /**
   * Listen to real-time location updates
   */
  static listenToLocationUpdates(
    userId: string,
    callback: (records: LocationRecord[]) => void,
    limitCount: number = 50
  ): () => void {
    const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
    const q = query(
      locationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map((doc) => ({
        ...doc.data(),
      } as LocationRecord));

      callback(records);
    });

    logger.debug('Listening to location updates');
    return unsubscribe;
  }

  /**
   * Delete location record
   */
  static async deleteLocationRecord(userId: string, recordId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.LOCATIONS, `${userId}_${recordId}`);
      await deleteDoc(docRef);
      logger.info('Location record deleted', { recordId });
    } catch (error) {
      logger.error('Delete record error', error);
      throw error;
    }
  }

  /**
   * Update location record
   */
  static async updateLocationRecord(
    userId: string, 
    recordId: string, 
    updatedData: Partial<LocationRecord>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.LOCATIONS, `${userId}_${recordId}`);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      logger.info('Location record updated', { recordId });
    } catch (error) {
      logger.error('Update record error', error);
      throw error;
    }
  }

  /**
   * Export location data for user
   */
  static async exportUserLocationData(userId: string): Promise<LocationRecord[]> {
    try {
      const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
      const q = query(
        locationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        ...doc.data(),
      } as LocationRecord));

      logger.info('Location data exported successfully', { count: records.length, userId });
      return records;
    } catch (error) {
      logger.error('Export data failed', { error, userId });
      throw error;
    }
  }

  /**
   * Delete all user location data
   */
  static async deleteAllUserData(userId: string): Promise<void> {
    try {
      const locationsRef = collection(db, COLLECTIONS.LOCATIONS);
      const q = query(locationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      logger.info('All user data deleted', { userId });
    } catch (error) {
      logger.error('Delete all user data error', error);
      throw error;
    }
  }
}
