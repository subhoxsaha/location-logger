import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData, WiFiNetwork } from '../types';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('WiFiLocationService');
const WIFI_DB_KEY = 'WIFI_LOCATION_DATABASE';

interface WiFiLocation {
  bssid: string;
  ssid: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  lastSeen: number;
}

export class WiFiLocationService {
  private wifiDatabase: Map<string, WiFiLocation> = new Map();
  private isLoaded: boolean = false;

  constructor() {
    this.loadDatabase();
  }

  private async loadDatabase() {
    try {
      const stored = await AsyncStorage.getItem(WIFI_DB_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.wifiDatabase = new Map(Object.entries(data));
          logger.info('WiFi database loaded', { size: this.wifiDatabase.size });
        } catch (parseError) {
          logger.error('WiFi database corrupted. Resetting.', parseError);
          await AsyncStorage.removeItem(WIFI_DB_KEY);
        }
      }
      this.isLoaded = true;
    } catch (error) {
      logger.error('Failed to access storage for WiFi database', error);
      this.isLoaded = true;
    }
  }

  private async saveDatabase() {
    try {
      const data = Object.fromEntries(this.wifiDatabase);
      await AsyncStorage.setItem(WIFI_DB_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save WiFi database', error);
    }
  }

  /**
   * Scan for nearby WiFi networks
   * Note: In pure Expo, this is limited. This is a placeholder for native implementation.
   */
  async scanWiFiNetworks(): Promise<WiFiNetwork[]> {
    // In a real implementation, we would use react-native-wifi-reborn here.
    // Since we are in Expo, we'll simulate finding the "connected" network or mock data.
    logger.debug('Scanning WiFi networks (Simulated for Expo)...');

    // Simulation: Return 1-3 networks if we have any in DB, or mock ones
    const mockNetworks: WiFiNetwork[] = [
      { ssid: 'Home_WiFi', bssid: '00:11:22:33:44:55', level: -60 },
      { ssid: 'Office_Guest', bssid: 'AA:BB:CC:DD:EE:FF', level: -80 },
    ];

    return mockNetworks;
  }

  /**
   * Estimate location based on WiFi network triangulation
   */
  async estimateLocationFromWiFi(): Promise<LocationData | null> {
    if (!this.isLoaded) await this.loadDatabase();

    try {
      const networks = await this.scanWiFiNetworks();

      if (networks.length === 0) {
        logger.warn('No WiFi networks found');
        return null;
      }

      let totalWeight = 0;
      let weightedLat = 0;
      let weightedLng = 0;
      let count = 0;

      for (const network of networks) {
        const known = this.wifiDatabase.get(network.bssid);
        if (known) {
          // Weight by signal strength (RSSI)
          // RSSI usually -30 to -100. Let's normalize to a weight.
          const weight = Math.max(1, 100 + network.level);
          weightedLat += known.latitude * weight;
          weightedLng += known.longitude * weight;
          totalWeight += weight;
          count++;
        }
      }

      if (count === 0) {
        logger.warn('No matching WiFi networks in database');
        return null;
      }

      const estimated: LocationData = {
        latitude: weightedLat / totalWeight,
        longitude: weightedLng / totalWeight,
        accuracy: 50 / count, // More networks = more accuracy
        timestamp: Date.now(),
        isoTimestamp: new Date().toISOString(),
        source: 'WiFi',
      };

      logger.info('Location estimated from WiFi', estimated);
      return estimated;
    } catch (error) {
      logger.error('WiFi estimation error', error);
      return null;
    }
  }

  /**
   * Learn from current location
   * Whenever we have a high-accuracy GPS fix, we should map the current WiFi BSSID to it.
   */
  async learnWiFiLocation(location: LocationData, networks: WiFiNetwork[]) {
    if (location.source !== 'GPS' || location.accuracy > 20) return;

    let updated = false;
    for (const network of networks) {
      // Only learn if the signal is strong (likely close to the AP)
      if (network.level > -70) {
        this.wifiDatabase.set(network.bssid, {
          bssid: network.bssid,
          ssid: network.ssid,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          lastSeen: Date.now(),
        });
        updated = true;
      }
    }

    if (updated) {
      await this.saveDatabase();
      logger.debug('WiFi database updated from GPS fix');
    }
  }

  async clearDatabase() {
    this.wifiDatabase.clear();
    await AsyncStorage.removeItem(WIFI_DB_KEY);
    logger.info('WiFi database cleared');
  }

  getDatabaseSize(): number {
    return this.wifiDatabase.size;
  }
}

export default new WiFiLocationService();
