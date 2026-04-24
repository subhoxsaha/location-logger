import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

interface RadarVisualizerProps {
  /** Optional smaller size for non-splash contexts */
  size?: number;
  /** Hide the brand text underneath */
  hideBrand?: boolean;
}

/**
 * RadarVisualizer — Shared animated radar component.
 *
 * Used by both SplashScreen (boot) and LoginScreen (auth).
 * Renders concentric rings, crosshairs, a rotating sweep arm,
 * and optionally the brand name below.
 */
const RadarVisualizer: React.FC<RadarVisualizerProps> = ({
  size = 160,
  hideBrand = false,
}) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(-15)).current;
  const radarSweep = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0.3)).current;
  const ring2 = useRef(new Animated.Value(0.2)).current;
  const ring3 = useRef(new Animated.Value(0.1)).current;
  const tickPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.timing(titleSlide, {
        toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

    // Continuous radar sweep
    Animated.loop(
      Animated.timing(radarSweep, {
        toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Ring breathing
    const breathe = (anim: Animated.Value, lo: number, hi: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: hi, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: lo, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    breathe(ring1, 0.15, 0.4, 2000).start();
    breathe(ring2, 0.08, 0.25, 2500).start();
    breathe(ring3, 0.04, 0.15, 3000).start();

    // Crosshair tick
    Animated.loop(
      Animated.sequence([
        Animated.timing(tickPulse, { toValue: 0.5, duration: 500, useNativeDriver: true }),
        Animated.timing(tickPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const sweepRotation = radarSweep.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Derived sizes
  const r1 = size * 0.375;
  const r2 = size * 0.6875;
  const r3 = size;

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeIn }]}>
      {/* Radar */}
      <View style={[styles.radarArea, { width: size, height: size }]}>
        <Animated.View style={[styles.ring, { width: r3, height: r3, borderRadius: r3 / 2, opacity: ring3 }]} />
        <Animated.View style={[styles.ring, { width: r2, height: r2, borderRadius: r2 / 2, opacity: ring2 }]} />
        <Animated.View style={[styles.ring, { width: r1, height: r1, borderRadius: r1 / 2, opacity: ring1 }]} />

        <Animated.View style={[styles.crossH, { width: size + 20, opacity: tickPulse }]} />
        <Animated.View style={[styles.crossV, { height: size + 20, opacity: tickPulse }]} />

        <Animated.View
          style={[
            styles.sweepArm,
            { width: size, height: size, transform: [{ rotate: sweepRotation }] },
          ]}
        >
          <View style={[styles.sweepLine, { height: size / 2 }]} />
        </Animated.View>

        <View style={styles.centerDot} />
      </View>

      {/* Brand */}
      {!hideBrand && (
        <Animated.View style={[styles.identity, { transform: [{ translateY: titleSlide }] }]}>
          <Text style={styles.brandName}>LOCATION TRACKER</Text>
          <Text style={styles.brandTag}>TELEMETRY ENGINE v1.0</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  radarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  crossH: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  crossV: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  sweepArm: {
    position: 'absolute',
    alignItems: 'center',
  },
  sweepLine: {
    width: 1.5,
    backgroundColor: '#007AFF',
    opacity: 0.6,
    borderRadius: 1,
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  identity: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 6,
  },
  brandTag: {
    color: '#333',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 6,
  },
});

export default RadarVisualizer;
