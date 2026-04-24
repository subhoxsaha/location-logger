import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { storageService } from './storageService';
import { LocationRecord } from '../types';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('SyncService');

export class SyncService {
  /**
   * Scans local storage for unsynced records and pushes them to Firestore
   */
  async syncUnsyncedRecords(userId: string): Promise<number> {
    if (!db) return 0;

    try {
      const records = await storageService.getRecords(userId);
      const unsynced = records.filter(r => !r.synced);
      
      if (unsynced.length === 0) return 0;

      const recordsToProcess = unsynced.slice(0, 500);
      logger.info(`Warp-Sync active: Bundling ${recordsToProcess.length} records...`);

      // Use FirebaseService to ensure correct data schema and collection paths
      const { FirebaseService } = require('./firebaseService');
      await FirebaseService.syncLocations(userId, recordsToProcess);

      // High-Speed Bulk Update of Local DB Status
      const syncedIds = recordsToProcess.map(r => r.id);
      await storageService.markBatchAsSynced(userId, syncedIds);

      logger.info(`Batch Sync SUCCESS: ${recordsToProcess.length} points updated.`);
      return recordsToProcess.length;
    } catch (error) {
      logger.error('Optimized sync failed', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();
