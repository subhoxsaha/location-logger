import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { DebugLogger } from '../utils/debugLogger';
import { LocationData, TrackingConfig } from '../types';
import gpsService from '../services/gpsLocationService';
import wifiService from '../services/wifiLocationService';
import { StorageService } from '../services/storageService';
import { FirebaseService } from '../services/firebaseService';
import LocationDisplayCard from '../components/LocationDisplayCard';
import ConfigurationPanel from '../components/ConfigurationPanel';
import DebugPanel from '../components/DebugPanel';
import MapComponent from '../components/MapComponent';

const logger = new DebugLogger('HomeScreen');
const { width } = Dimensions.get('window');

interface HomeScreenProps {
  route: {
    params: {
      userId: string;
    };
  };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ route }) => {
  const { userId } = route.params;
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [config, setConfig] = useState<TrackingConfig>({
    enabled: false,
    intervalSeconds: 30,
    useOnlineMode: true,
    useOfflineMode: true,
    maxStorageRecords: 1000,
  });
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Check network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);
      logger.debug(`Network status changed: ${online ? 'Online' : 'Offline'}`);
    });

    return () => unsubscribe();
  }, []);

  // Load configuration and history
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const loadInitialData = async () => {
    try {
      const storageService = new StorageService();

      // Load config
      const savedConfig = await storageService.getConfig(userId);
      if (savedConfig) {
        setConfig(savedConfig);
      }

      // Load history
      const history = await storageService.getRecords(userId);
      if (history.length > 0) {
        const historyData = history.map(h => h.location);
        setLocationHistory(historyData);
        setLocation(historyData[historyData.length - 1]);
      }
    } catch (error) {
      logger.error('Failed to load initial data', error);
    }
  };

  // Get current location
  const handleGetLocation = useCallback(async () => {
    setLoading(true);
    try {
      let locationData: LocationData | null = null;

      // Online logic: Try GPS first if enabled
      if (isOnline && config.useOnlineMode) {
        logger.debug('Mode: Online (GPS)');
        locationData = await gpsService.getCurrentLocation();
      }
      // Offline logic: Try WiFi triangulation if enabled
      else if (!isOnline && config.useOfflineMode) {
        logger.debug('Mode: Offline (WiFi)');
        locationData = await wifiService.estimateLocationFromWiFi();
      }
      // Fallback
      if (!locationData && config.useOnlineMode) {
        logger.debug('Mode: Fallback (GPS)');
        locationData = await gpsService.getCurrentLocation();
      }

      if (locationData) {
        setLocation(locationData);
        setError(null); // Clear previous errors
        setLocationHistory((prev) => [...prev, locationData!].slice(-50));

        // If we have a GPS fix, let the WiFi service "learn" the current networks
        if (locationData.source === 'GPS' && locationData.accuracy < 30) {
          const networks = await wifiService.scanWiFiNetworks();
          await wifiService.learnWiFiLocation(locationData, networks);
        }

        // Save to storage
        const storageService = new StorageService();
        const record = {
          id: `${Date.now()}_${Math.random()}`,
          location: locationData,
          config,
          userId,
          synced: false,
          createdAt: Date.now(),
        };
        await storageService.appendLocationRecord(record);

        // Center map
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }

        logger.info('Location captured', locationData);
      } else {
        setError('Location unavailable. Check GPS/WiFi permissions.');
        logger.warn('Location capture failed - no data');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected tracking error occurred.');
      logger.error('Failed to get location', err);
    } finally {
      setLoading(false);
    }
  }, [isOnline, config, userId]);

  // Tracking effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTracking) {
      handleGetLocation(); // Immediate first fetch
      interval = setInterval(() => {
        handleGetLocation();
      }, config.intervalSeconds * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, config.intervalSeconds, handleGetLocation]);

  const handleToggleTracking = () => {
    setIsTracking(!isTracking);
    logger.info(`Tracking ${!isTracking ? 'started' : 'stopped'}`);
  };

  const handleSyncLocations = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline.');
      return;
    }

    setLoading(true);
    try {
      const storageService = new StorageService();
      const records = await storageService.getRecords(userId);
      const unsynced = records.filter(r => !r.synced);

      if (unsynced.length === 0) {
        Alert.alert('Status', 'All locations are already synced.');
        return;
      }

      await FirebaseService.syncLocations(userId, unsynced);

      for (const record of unsynced) {
        await storageService.markAsSynced(userId, record.id);
      }

      Alert.alert('Success', `Synced ${unsynced.length} records to cloud.`);
    } catch (error) {
      logger.error('Sync failed', error);
      Alert.alert('Sync Error', 'Failed to upload data.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    handleGetLocation().finally(() => setRefreshing(false));
  }, [handleGetLocation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Location Tracker</Text>
          <View style={styles.statusIndicators}>
            <View style={[styles.statusBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.statusText}>{isOnline ? '● Online' : '● Offline'}</Text>
            </View>
            {isTracking && (
              <View style={[styles.statusBadge, styles.trackingBadge]}>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.statusText}>Live</Text>
              </View>
            )}
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.errorClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Map View */}
        <MapComponent 
          currentLocation={location} 
          history={locationHistory} 
        />

        {/* Location Info Card */}
        {location && <LocationDisplayCard location={location} />}

        {/* Primary Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.mainButton, isTracking ? styles.stopButton : styles.startButton]}
            onPress={handleToggleTracking}
          >
            <Text style={styles.buttonText}>
              {isTracking ? 'Stop Auto Tracking' : 'Start Auto Tracking'}
            </Text>
          </TouchableOpacity>

          <View style={styles.secondaryControls}>
            <TouchableOpacity
              style={[styles.subButton, loading && styles.disabledButton]}
              onPress={handleGetLocation}
              disabled={loading}
            >
              <Text style={styles.subButtonText}>📍 Manual Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subButton, (!isOnline || loading) && styles.disabledButton]}
              onPress={handleSyncLocations}
              disabled={!isOnline || loading}
            >
              <Text style={styles.subButtonText}>☁️ Cloud Sync</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuration */}
        <ConfigurationPanel
          config={config}
          onConfigChange={(newConfig) => {
            setConfig(newConfig);
            new StorageService().saveConfig(userId, newConfig);
          }}
        />

        {/* Debug Controls */}
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.debugToggleText}>
            {showDebug ? 'Hide Developer Tools' : 'Show Developer Tools'}
          </Text>
        </TouchableOpacity>

        {showDebug && <DebugPanel userId={userId} />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineBadge: {
    backgroundColor: '#1a4d2e',
  },
  offlineBadge: {
    backgroundColor: '#4d1a1a',
  },
  trackingBadge: {
    backgroundColor: '#0066cc',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 300,
    width: width,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    padding: 16,
    gap: 12,
  },
  mainButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  startButton: {
    backgroundColor: '#00aa00',
  },
  stopButton: {
    backgroundColor: '#cc0000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 12,
  },
  subButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  subButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.4,
  },
  debugToggle: {
    padding: 16,
    alignItems: 'center',
  },
  debugToggleText: {
    color: '#666',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  errorBanner: {
    backgroundColor: '#4d1a1a',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  errorClose: {
    color: '#666',
    paddingHorizontal: 8,
    fontSize: 16,
  },
});

export default HomeScreen;
