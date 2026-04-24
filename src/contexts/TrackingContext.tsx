import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationRecord, TrackingConfig } from '../types';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { Alert } from 'react-native';

interface TrackingContextType {
  userId: string;
  config: TrackingConfig;
  records: LocationRecord[];
  isLoaded: boolean;
  updateConfig: (newConfig: TrackingConfig) => Promise<void>;
  addRecord: (record: LocationRecord) => Promise<void>;
  clearAllRecords: () => Promise<void>;
  syncRecords: () => Promise<number>;
  deleteRecord: (id: string) => Promise<void>;
}

const defaultContext: TrackingContextType = {
  userId: 'guest_user',
  config: {
    enabled: true,
    intervalSeconds: 10,
    useOnlineMode: true,
    useOfflineMode: true,
    maxStorageRecords: 1000,
  },
  records: [],
  isLoaded: false,
  updateConfig: async () => {},
  addRecord: async () => {},
  clearAllRecords: async () => {},
  syncRecords: async () => 0,
  deleteRecord: async () => {},
};

const TrackingContext = createContext<TrackingContextType>(defaultContext);

export const useTracking = () => useContext(TrackingContext);

interface ProviderProps {
  userId: string;
  children: ReactNode;
}

export const TrackingProvider: React.FC<ProviderProps> = ({ userId, children }) => {
  const [config, setConfig] = useState<TrackingConfig>(defaultContext.config);
  const [records, setRecords] = useState<LocationRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [savedConfig, savedRecords] = await Promise.all([
          storageService.getConfig(userId),
          storageService.getRecords(userId)
        ]);

        if (savedConfig) setConfig(savedConfig);
        if (savedRecords) setRecords(savedRecords);
      } catch (e) {
        console.error('Failed to load tracking state:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    setIsLoaded(false);
    initializeData();
  }, [userId]);

  const updateConfig = async (newConfig: TrackingConfig) => {
    setConfig(newConfig);
    await storageService.saveConfig(userId, newConfig);
  };

  const addRecord = async (record: LocationRecord) => {
    // Keep internal state bounded by config
    setRecords(prev => {
      const next = [...prev, record];
      if (next.length > config.maxStorageRecords) {
        return next.slice(next.length - config.maxStorageRecords);
      }
      return next;
    });
    await storageService.appendLocationRecord(record);
  };

  const clearAllRecords = async () => {
    setRecords([]);
    await storageService.clearLocationHistory(userId);
  };


  const deleteRecord = async (id: string) => {
    const filtered = records.filter(r => r.id !== id);
    setRecords(filtered);
    await storageService.setRecords(userId, filtered);
  };

  const syncRecords = async () => {
    try {
      let totalSynced = 0;
      let lastBatchCount = 0;
      
      // Loop to handle more than 500 records (batch limit in service)
      do {
        lastBatchCount = await syncService.syncUnsyncedRecords(userId);
        totalSynced += lastBatchCount;
      } while (lastBatchCount >= 500);

      if (totalSynced > 0) {
        // Re-fetch from DB to get updated 'synced' flags
        const updatedRecords = await storageService.getRecords(userId);
        setRecords(updatedRecords);
      }
      return totalSynced;
    } catch (e) {
      throw e;
    }
  };

  return (
    <TrackingContext.Provider value={{
      userId,
      config,
      records,
      isLoaded,
      updateConfig,
      addRecord,
      clearAllRecords,
      syncRecords,
      deleteRecord
    }}>
      {children}
    </TrackingContext.Provider>
  );
};
