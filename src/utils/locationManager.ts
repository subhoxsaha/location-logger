import { LocationData, TrackingConfig } from '../types';
import gpsService from '../services/gpsLocationService';
import wifiService from '../services/wifiLocationService';
import NetInfo from '@react-native-community/netinfo';
import { DebugLogger } from './debugLogger';

const logger = new DebugLogger('LocationManager');

/**
 * LocationManager — single entry point for obtaining a location fix.
 * 
 * Rules:
 *   1. If online AND useOnlineMode → try GPS first
 *   2. If GPS fails OR offline → if useOfflineMode → try WiFi triangulation
 *   3. If GPS succeeded → teach WiFi DB the current networks for future offline use
 *   4. Returns LocationData with source='GPS' or source='WiFi', or null if both fail
 */
export class LocationManager {

  /**
   * Capture a single location fix using the best available method.
   * Does NOT save to storage — that's the caller's responsibility.
   */
  async getLocation(config: TrackingConfig): Promise<LocationData | null> {
    let location: LocationData | null = null;
    const netState = await NetInfo.fetch();
    const isOnline = !!netState.isConnected;

    // Step 1: Try GPS if online mode is enabled
    if (config.useOnlineMode) {
      try {
        logger.debug('Attempting GPS fix...');
        location = await gpsService.getCurrentLocation();
        logger.info('GPS fix obtained', {
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
          source: location.source,
        });

        // Teach WiFi DB from this good GPS fix
        if (config.useOfflineMode) {
          try {
            const networks = await wifiService.scanWiFiNetworks();
            await wifiService.learnWiFiLocation(location, networks);
          } catch (e) {
            // Learning failure is non-critical
          }
        }

        return location;
      } catch (e) {
        logger.warn('GPS fix failed', { error: String(e) });
      }
    }

    // Step 2: Fallback to WiFi triangulation if offline mode is enabled
    if (!location && config.useOfflineMode) {
      try {
        logger.debug('Attempting WiFi triangulation...');
        location = await wifiService.estimateLocationFromWiFi();
        if (location) {
          logger.info('WiFi fix obtained', {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            source: location.source,
          });
          return location;
        }
      } catch (e) {
        logger.warn('WiFi estimation failed', { error: String(e) });
      }
    }

    logger.error('All location methods failed');
    return null;
  }
}

export default new LocationManager();
