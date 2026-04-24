import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapComponent, { MapTheme, MapRef } from '../components/MapComponent';
import TopStatusOverlay from '../components/TopStatusOverlay';
import locationManager from '../utils/locationManager';
import { LocationData, LocationRecord } from '../types';
import { useTracking } from '../contexts/TrackingContext';
import NetInfo from '@react-native-community/netinfo';
import { calculateDistance, formatDistance } from '../utils/geoUtils';
import { generateId } from '../utils/uuid';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('TrackScreen');

const PRIMARY_COLOR = '#007AFF'; 

const TrackScreen: React.FC<{ route: any }> = ({ route }) => {
  const mapRef = useRef<MapRef>(null);

  const { userId, config, records, addRecord, updateConfig } = useTracking();

  // Tracking state
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [mapTheme, setMapTheme] = useState<MapTheme>('light');
  const [avatarUrl, setAvatarUrl] = useState('');

  const displayRecords = React.useMemo(() => records.slice(-50), [records]);
  const totalDistance = React.useMemo(() => {
    let dist = 0;
    for (let i = 1; i < records.length; i++) {
      dist += calculateDistance(
        records[i-1].location.latitude, records[i-1].location.longitude,
        records[i].location.latitude, records[i].location.longitude
      );
    }
    return dist;
  }, [records]);

  // Ref-based polling lock — avoids stale closure issues
  const isPollingRef = useRef(false);
  const lastLocationRef = useRef<LocationData | null>(null);
  const configRef = useRef(config);
  configRef.current = config; // Always up-to-date

  // ─── Zoom Slider Animation ───
  const zoomOpacity = useRef(new Animated.Value(0.3)).current;
  const zoomTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleZoomInteraction = () => {
    Animated.timing(zoomOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => {
      Animated.timing(zoomOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }).start();
    }, 3000);
  };

  // ─── Set location from records + listen for network changes ───
  useEffect(() => {
    if (records.length > 0 && !location) {
      const last = records[records.length - 1].location;
      setLocation(last);
      lastLocationRef.current = last;
    }
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, [records, location]);

  // Load avatar on focus
  useFocusEffect(
    useCallback(() => {
      const loadAvatar = async () => {
        try {
          const style = await AsyncStorage.getItem(`@avatar_style_${userId}`) || 'lorelei';
          const seed = await AsyncStorage.getItem(`@avatar_seed_${userId}`) || userId;
          setAvatarUrl(`https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed)}&size=128`);
        } catch (e) {}
      };
      loadAvatar();
    }, [userId])
  );

  // ─── Handle map jump from History screen ───
  useEffect(() => {
    const focusLoc = route.params?.focusLocation;
    if (focusLoc && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.recenter(focusLoc);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [route.params?.focusLocation]);

  // ─── Core polling function ───
  const pollLocation = useCallback(async (trigger: 'Manual' | 'Auto' = 'Auto') => {
    // Ref-based lock: prevents overlapping calls
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      logger.info(`${trigger} registration sequence initiated...`);
      const loc = await locationManager.getLocation(configRef.current);
      if (!loc) {
        isPollingRef.current = false;
        return;
      }

      setLocation(loc);

      // Calculate distance from last known point
      let dist = 0;
      if (lastLocationRef.current) {
        dist = calculateDistance(
          lastLocationRef.current.latitude, lastLocationRef.current.longitude,
          loc.latitude, loc.longitude
        );
      }
      lastLocationRef.current = loc;

      // Create record
      const record: LocationRecord = {
        id: generateId(),
        userId,
        location: loc,
        createdAt: Date.now(),
        synced: false,
      };

      // Save to TrackingContext
      await addRecord(record);

    } catch (e) {
      console.error('Poll error:', e);
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  // ─── Polling timer & Countdown — respects config.intervalSeconds ───
  const [countdown, setCountdown] = useState(config.intervalSeconds);
  const countdownRef = useRef(config.intervalSeconds);

  useEffect(() => {
    if (!config.enabled) {
      setCountdown(config.intervalSeconds);
      countdownRef.current = config.intervalSeconds;
      return;
    }

    // Reset countdown when config changes or enabled
    setCountdown(config.intervalSeconds);
    countdownRef.current = config.intervalSeconds;

    // Initial poll
    pollLocation();

    const interval = setInterval(() => {
      countdownRef.current -= 1;
      
      if (countdownRef.current <= 0) {
        logger.info('Timer trigger: Starting auto-enrollment poll');
        pollLocation('Auto');
        countdownRef.current = config.intervalSeconds;
      }
      
      setCountdown(countdownRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [config.enabled, config.intervalSeconds, pollLocation]);

  // ─── RENDER ───
  const pointCount = records.length;
  const accuracy = location?.accuracy ? Math.round(location.accuracy) : null;
  const speed = location?.speed ? (location.speed * 3.6).toFixed(1) : null; // m/s → km/h

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <MapComponent 
        ref={mapRef}
        currentLocation={location} 
        history={displayRecords.map(r => r.location)} 
        loading={isPollingRef.current}
        theme={mapTheme}
        pathColor="#007AFF"
        avatarUrl={avatarUrl}
      />

      {/* ─── TOP BAR ─── */}
      <TopStatusOverlay 
        enabled={config.enabled}
        count={pointCount}
        loading={isPollingRef.current}
        pfp={avatarUrl}
      />

      {/* ─── THEME SELECTOR (top right, below top bar) ─── */}
      <View style={styles.themePicker}>
        {(['light', 'dark', 'satellite'] as MapTheme[]).map((t) => (
          <TouchableOpacity 
            key={t}
            style={[styles.themeBtn, mapTheme === t && styles.themeBtnActive]}
            onPress={() => setMapTheme(t)}
          >
            <Ionicons 
              name={t === 'dark' ? 'moon' : t === 'light' ? 'sunny' : 'earth'} 
              size={12} 
              color={mapTheme === t ? '#fff' : 'rgba(255,255,255,0.4)'} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── ZOOM & MAP CONTROLS SLIDER (Right edge) ─── */}
      <Animated.View style={[styles.zoomSlider, { opacity: zoomOpacity }]} onTouchStart={handleZoomInteraction}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => { handleZoomInteraction(); mapRef.current?.zoomStep(1); }}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={() => { handleZoomInteraction(); mapRef.current?.zoomStep(-1); }}>
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={() => { handleZoomInteraction(); mapRef.current?.zoomOut(); }}>
          <Ionicons name="expand-outline" size={16} color="#fff" />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={() => { handleZoomInteraction(); mapRef.current?.recenter(); }}>
          <Ionicons name="locate" size={16} color="#007AFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* ─── BOTTOM PANEL ─── */}
      <View style={styles.bottomPanel}>
        
        {/* Waypoint timeline */}
        {displayRecords.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.timeline}
            style={styles.timelineWrap}
          >
            {[...displayRecords].reverse().slice(0, 15).map((r, i) => (
              <View key={r.id} style={[styles.timeChip, i === 0 && styles.timeChipLatest]}>
                <View style={[styles.chipDot, { backgroundColor: r.synced ? '#34c759' : '#ff453a' }]} />
                <Text style={[styles.chipTime, i === 0 && styles.chipTimeLatest]}>
                  {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
                <Text style={styles.chipSource}>{r.location.source}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Telemetry card */}
        <View style={styles.telemetryCard}>
          {/* Top row: speed + accuracy + interval */}
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Ionicons name="speedometer-outline" size={13} color="rgba(255,255,255,0.4)" />
              <Text style={styles.metricValue}>{speed || '—'}</Text>
              <Text style={styles.metricUnit}>km/h</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Ionicons name="radio-outline" size={13} color="rgba(255,255,255,0.4)" />
              <Text style={styles.metricValue}>{accuracy ? `±${accuracy}` : '—'}</Text>
              <Text style={styles.metricUnit}>m</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Ionicons name="hourglass-outline" size={13} color="#007AFF" />
              <Text style={[styles.metricValue, { color: '#007AFF' }]}>{countdown}</Text>
              <Text style={styles.metricUnit}>sec</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Ionicons name="navigate-outline" size={13} color="rgba(255,255,255,0.4)" />
              <Text style={styles.metricValue}>{formatDistance(totalDistance)}</Text>
            </View>
          </View>

          {/* Coordinate display + action */}
          <View style={styles.coordRow}>
            <View style={styles.coordBlock}>
              <Text style={styles.coordLabel}>
                {location?.source === 'WiFi' ? '≈ ESTIMATED POSITION' : 'GPS POSITION'}
              </Text>
              <Text style={styles.coordText}>
                {location 
                  ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                  : 'Acquiring signal...'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => pollLocation('Manual')}
              disabled={isPollingRef.current}
              activeOpacity={0.7}
            >
              <Ionicons name="pin" size={20} color="#fff" />
              <Text style={styles.registerBtnText}>REGISTER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.powerBtn, !config.enabled && styles.powerBtnOff]}
              onPress={async () => {
                const next = { ...config, enabled: !config.enabled };
                await updateConfig(next);
              }}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={config.enabled ? 'pause' : 'play'} 
                size={22} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ─── THEME PICKER ───
  themePicker: {
    position: 'absolute',
    top: 100,
    right: 16,
    flexDirection: 'column',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 4,
    gap: 2,
    zIndex: 100,
  },
  themeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ─── ZOOM SLIDER ───
  zoomSlider: {
    position: 'absolute',
    top: 240,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingVertical: 4,
    alignItems: 'center',
    zIndex: 100,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },

  // ─── BOTTOM PANEL ───
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingHorizontal: 12,
    zIndex: 100,
  },

  // Timeline strip
  timelineWrap: {
    marginBottom: 8,
  },
  timeline: {
    gap: 6,
    paddingHorizontal: 4,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  timeChipLatest: {
    backgroundColor: 'rgba(0,122,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.3)',
  },
  chipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chipTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chipTimeLatest: {
    color: '#fff',
  },
  chipSource: {
    color: 'rgba(0,122,255,0.7)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Telemetry card
  telemetryCard: {
    backgroundColor: 'rgba(20,20,22,0.92)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Metrics row
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Coordinate display
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordBlock: {
    flex: 1,
  },
  coordLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  coordText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },

  // Power button
  powerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ff453a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#ff453a',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  powerBtnOff: {
    backgroundColor: '#34c759',
    shadowColor: '#34c759',
  },

  // Register button
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default TrackScreen;

