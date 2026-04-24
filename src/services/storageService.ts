import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationRecord, TrackingConfig, LocationSession } from '../types';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('StorageService');

const STORAGE_KEYS = {
  LOCATIONS: 'location_records',
  CONFIG: 'tracking_config',
  SESSIONS: 'location_sessions',
};

export class StorageService {
  /**
   * Saves a location record locally with a 'synced' flag
   */
  async appendLocationRecord(record: LocationRecord): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.LOCATIONS}_${record.userId}`;
      const existing = await AsyncStorage.getItem(key);
      const records: LocationRecord[] = existing ? JSON.parse(existing) : [];
      
      // Add new record (default synced: false)
      records.push(record);

      // Keep a buffer of last 2000 points
      if (records.length > 2000) records.shift();

      await AsyncStorage.setItem(key, JSON.stringify(records));
    } catch (error) {
      logger.error('Append record error', error);
    }
  }

  async getRecords(userId: string): Promise<LocationRecord[]> {
    try {
      const key = `${STORAGE_KEYS.LOCATIONS}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async setRecords(userId: string, records: LocationRecord[]): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.LOCATIONS}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(records));
    } catch (error) {
      logger.error('Set records error', error);
    }
  }

  /**
   * Marks a batch of local records as synced in a single disk write
   */
  async markBatchAsSynced(userId: string, recordIds: string[]): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.LOCATIONS}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      if (!data) return;
      
      const records: LocationRecord[] = JSON.parse(data);
      const idSet = new Set(recordIds);
      let modified = false;

      for (let i = 0; i < records.length; i++) {
        if (idSet.has(records[i].id) && !records[i].synced) {
          records[i].synced = true;
          modified = true;
        }
      }

      if (modified) {
        await AsyncStorage.setItem(key, JSON.stringify(records));
      }
    } catch (error) {
      logger.error('Batch sync update error', error);
    }
  }

  /**
   * Marks a specific local record as synced after successful DB update
   */
  async markAsSynced(userId: string, recordId: string): Promise<void> {
    return this.markBatchAsSynced(userId, [recordId]);
  }

  async saveSession(session: LocationSession): Promise<void> {
    try {
      const key = `${STORAGE_KEYS.SESSIONS}_${session.userId}`;
      const existing = await AsyncStorage.getItem(key);
      const sessions: LocationSession[] = existing ? JSON.parse(existing) : [];
      sessions.push(session);
      await AsyncStorage.setItem(key, JSON.stringify(sessions));
    } catch (error) {}
  }

  async getSessions(userId: string): Promise<LocationSession[]> {
    try {
      const key = `${STORAGE_KEYS.SESSIONS}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async saveConfig(userId: string, config: TrackingConfig): Promise<void> {
    const key = `${STORAGE_KEYS.CONFIG}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(config));
  }

  async getConfig(userId: string): Promise<TrackingConfig | null> {
    const key = `${STORAGE_KEYS.CONFIG}_${userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // --- BACKWARD COMPATIBILITY ALIASES ---
  // These ensure legacy components don't crash after the architecture upgrade
  async saveLocation(record: LocationRecord): Promise<void> {
    return this.appendLocationRecord(record);
  }

  async getLocations(userId: string): Promise<LocationRecord[]> {
    return this.getRecords(userId);
  }

  async clearLocationHistory(userId: string): Promise<void> {
    const key = `${STORAGE_KEYS.LOCATIONS}_${userId}`;
    await AsyncStorage.removeItem(key);
  }
}

export const storageService = new StorageService();
