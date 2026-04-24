import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationData } from '../types';
import { Theme } from '../theme';

interface LocationDisplayCardProps {
  location: LocationData;
}

const LocationDisplayCard: React.FC<LocationDisplayCardProps> = ({ location }) => {
  const formatCoord = (n: number) => n.toFixed(6);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Ionicons name="navigate-outline" size={14} color="#8e8e93" />
          <View style={styles.textStack}>
            <Text style={styles.label}>LATITUDE</Text>
            <Text style={styles.value}>{formatCoord(location.latitude)}</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Ionicons name="compass-outline" size={14} color="#8e8e93" />
          <View style={styles.textStack}>
            <Text style={styles.label}>LONGITUDE</Text>
            <Text style={styles.value}>{formatCoord(location.longitude)}</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#8e8e93" />
          <View style={styles.textStack}>
            <Text style={styles.label}>ACCURACY</Text>
            <Text style={styles.value}>{Math.round(location.accuracy)}m</Text>
          </View>
        </View>

        <View style={styles.item}>
          <Ionicons name="flash-outline" size={14} color="#8e8e93" />
          <View style={styles.textStack}>
            <Text style={styles.label}>PROVIDER</Text>
            <Text style={[styles.value, { color: location.source === 'GPS' ? '#34c759' : '#007aff' }]}>
              {location.source}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  item: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textStack: {
    flex: 1,
  },
  label: {
    color: '#48484a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});

export default LocationDisplayCard;
