import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from 'react-native';
import RadarVisualizer from './RadarVisualizer';

const { width } = Dimensions.get('window');

interface InitStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface SplashScreenProps {
  steps: InitStep[];
  errorMessage?: string | null;
}

/**
 * SplashScreen — Cinematic system boot sequence.
 *
 * Shares the RadarVisualizer with LoginScreen but pairs it
 * with a terminal-style init log instead of auth buttons.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ steps, errorMessage }) => {
  const stepsOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  const doneCount = steps.filter(s => s.status === 'done').length;
  const progress = steps.length > 0 ? doneCount / steps.length : 0;

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Staggered entrance for the init log (radar animates itself)
    Animated.sequence([
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(stepsOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(footerOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Shared radar + brand */}
      <RadarVisualizer size={160} />

      {/* ─── Init Log (terminal-style) ─── */}
      <Animated.View style={[styles.initLog, { opacity: stepsOpacity }]}>
        {steps.map((step) => (
          <View key={step.id} style={styles.logRow}>
            <Text style={[
              styles.logPrefix,
              step.status === 'done' && styles.logPrefixDone,
              step.status === 'active' && styles.logPrefixActive,
              step.status === 'error' && styles.logPrefixError,
            ]}>
              {step.status === 'done' ? '  OK  ' :
               step.status === 'active' ? ' ···  ' :
               step.status === 'error' ? ' FAIL ' : ' ——   '}
            </Text>
            <Text style={[
              styles.logText,
              step.status === 'done' && styles.logTextDone,
              step.status === 'active' && styles.logTextActive,
              step.status === 'error' && styles.logTextError,
              step.status === 'pending' && styles.logTextPending,
            ]}>
              {step.label}
            </Text>
          </View>
        ))}

        {errorMessage && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        )}

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        <Text style={styles.footerText}>React Native • Expo • Firebase</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Init log ───
  initLog: {
    width: width - 64,
    backgroundColor: 'rgba(10,10,12,0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    paddingBottom: 10,
    marginTop: 10,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  logPrefix: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '800',
    color: '#333',
    width: 50,
  },
  logPrefixDone: { color: '#34c759' },
  logPrefixActive: { color: '#007AFF' },
  logPrefixError: { color: '#ff453a' },

  logText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  logTextDone: { color: 'rgba(255,255,255,0.5)' },
  logTextActive: { color: '#fff' },
  logTextError: { color: '#ff453a' },
  logTextPending: { color: '#222' },

  errorRow: {
    marginTop: 8,
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.12)',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── Progress ───
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 1,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 1,
  },

  // ─── Footer ───
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: '#1a1a1a',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
});

export default SplashScreen;
