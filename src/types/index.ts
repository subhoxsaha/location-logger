export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isoTimestamp: string; // Added for Insurance ML processing
  source: 'GPS' | 'WiFi';
  altitude?: number;
  speed?: number;
}

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  level: number;
  frequency?: number;
}

export interface TrackingConfig {
  enabled: boolean;
  intervalSeconds: number;
  useOnlineMode: boolean;
  useOfflineMode: boolean;
  maxStorageRecords: number;
}

export interface LocationRecord {
  id: string;
  location: LocationData;
  config?: TrackingConfig;
  userId: string;
  synced: boolean;
  createdAt: number;
}

export interface DebugLog {
  timestamp: number;
  level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN';
  message: string;
  data?: any;
}

export interface UserAuth {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface LocationSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  locations: LocationData[];
  totalDistance: number; // in meters
  config: TrackingConfig;
}

export type AuthMode = 'FIREBASE' | 'GUEST';
