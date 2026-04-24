import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TopStatusOverlayProps {
  enabled: boolean;
  count: number;
  loading: boolean;
  pfp?: string | null;
}

const TopStatusOverlay: React.FC<TopStatusOverlayProps> = ({ 
  enabled, 
  count, 
  loading,
  pfp 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.glassPill}>
        {/* User Account / Avatar */}
        <View style={styles.section}>
          <View style={styles.avatarWrapper}>
            {pfp ? (
              <Image source={{ uri: pfp }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={18} color="rgba(255,255,255,0.4)" />
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Status Dot + Mode */}
        <View style={styles.section}>
          <View style={[styles.dot, { backgroundColor: enabled ? '#34c759' : '#ff453a' }]} />
          <Text style={styles.statusText}>{enabled ? 'LIVE' : 'PAUSED'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Waypoint Count */}
        <View style={styles.section}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.5)" />
          <Text style={styles.countText}>{count}</Text>
          <Text style={styles.unitText}>pts</Text>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '600',
  },
  loadingWrapper: {
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  loader: {
    transform: [{ scale: 0.6 }],
  },
});

export default TopStatusOverlay;
