import * as Location from 'expo-location';
import { DebugLogger } from '../utils/debugLogger';
import { LocationData } from '../types';

const logger = new DebugLogger('GPSLocationService');

export class GPSLocationService {
  private subscription: Location.LocationSubscription | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  /**
   * Request permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      logger.error('Foreground location permission denied');
      return false;
    }
    return true;
  }

  /**
   * Get current GPS location (one-time read)
   */
  async getCurrentLocation(): Promise<LocationData> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    try {
      logger.debug('Requesting current GPS location...');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp,
        isoTimestamp: new Date(position.timestamp).toISOString(),
        source: 'GPS',
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
      };

      logger.info('GPS location obtained', {
        lat: locationData.latitude,
        lng: locationData.longitude,
        accuracy: locationData.accuracy,
      });

      return locationData;
    } catch (error) {
      logger.error('Failed to get GPS location', error);
      throw error;
    }
  }

  /**
   * Start watching GPS location changes
   */
  async watchLocation(
    onLocationChange: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      if (onError) onError(new Error('Location permission denied'));
      return () => {};
    }

    logger.debug('Starting GPS location watch...');

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5, // Update only if position changes by 5 meters
      },
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
          isoTimestamp: new Date(position.timestamp).toISOString(),
          source: 'GPS',
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined,
        };

        logger.debug('GPS location updated', {
          lat: locationData.latitude,
          lng: locationData.longitude,
          accuracy: locationData.accuracy,
        });

        onLocationChange(locationData);
      }
    );

    return () => this.stopWatching();
  }

  /**
   * Stop watching GPS location changes
   */
  stopWatching(): void {
    if (this.subscription) {
      logger.debug('Stopping GPS location watch...');
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Get location with retry logic
   */
  async getLocationWithRetry(): Promise<LocationData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`GPS location attempt ${attempt}/${this.maxRetries}`);
        return await this.getCurrentLocation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`GPS location attempt ${attempt} failed`, { message: lastError.message });

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    logger.error('Failed to get GPS location after retries', lastError);
    throw lastError || new Error('Failed to get GPS location');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new GPSLocationService();
