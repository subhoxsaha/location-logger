import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RadarVisualizer from '../components/RadarVisualizer';
import { useAuth, validateEmail, validatePassword } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  // ─── State ───
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { login, signup, isLoading } = useAuth();

  // ─── Refs ───
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // ─── Animations ───
  const [contentAnim] = useState(new Animated.Value(0));
  const [formAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.stagger(200, [
      Animated.spring(contentAnim, {
        toValue: 1, friction: 8, tension: 50, useNativeDriver: true,
      }),
      Animated.spring(formAnim, {
        toValue: 1, friction: 8, tension: 50, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Clear errors when switching mode ───
  useEffect(() => {
    setErrors({});
    setFormError(null);
    setConfirmPassword('');
  }, [mode]);

  // ─── Validation ───
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;

    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error: any) {
      setFormError(error.message || 'Something went wrong');
    }
  };

  // ─── Animation helpers ───
  const slideUp = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
      }),
    }],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Radar ─── */}
          <View style={styles.radarWrap}>
            <RadarVisualizer size={130} />
          </View>

          {/* ─── Feature Chips ─── */}
          <Animated.View style={[styles.chipRow, slideUp(contentAnim)]}>
            <FeatureChip icon="radio-outline" label="GPS" color="#34c759" />
            <FeatureChip icon="wifi-outline" label="WiFi" color="#007AFF" />
            <FeatureChip icon="cloud-outline" label="Cloud" color="#ff9f0a" />
            <FeatureChip icon="shield-checkmark-outline" label="Secure" color="#bf5af2" />
          </Animated.View>

          {/* ─── Auth Form ─── */}
          <Animated.View style={[styles.formCard, slideUp(formAnim)]}>
            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                onPress={() => setMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                onPress={() => setMode('signup')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Global form error */}
            {formError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color="#ff453a" />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputWrapError]}>
                <Ionicons name="mail-outline" size={16} color="#444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#333"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                />
              </View>
              {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={[styles.inputWrap, errors.password && styles.inputWrapError]}>
                <Ionicons name="lock-closed-outline" size={16} color="#444" style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#333"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  returnKeyType={mode === 'signup' ? 'next' : 'go'}
                  onSubmitEditing={() => {
                    if (mode === 'signup') confirmRef.current?.focus();
                    else handleSubmit();
                  }}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={16}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
            </View>

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrap, errors.confirm && styles.inputWrapError]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#444" style={styles.inputIcon} />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#333"
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirm: undefined })); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                    editable={!isLoading}
                  />
                </View>
                {errors.confirm && <Text style={styles.fieldError}>{errors.confirm}</Text>}
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, isLoading && styles.disabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                    <Ionicons name="sync-outline" size={18} color="#fff" />
                  </Animated.View>
                  <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Mode switch hint */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.switchLink}>
                  {mode === 'login' ? ' Sign Up' : ' Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ─── Privacy ─── */}
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={10} color="#222" />
            <Text style={styles.privacyText}>
              Encrypted in transit • Manual sync • No tracking without consent
            </Text>
          </View>

          <Text style={styles.version}>v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Feature chip ───
const FeatureChip = ({ icon, label, color }: { icon: string; label: string; color: string }) => (
  <View style={[chipStyles.chip, { borderColor: color + '25' }]}>
    <Ionicons name={icon as any} size={13} color={color} />
    <Text style={[chipStyles.label, { color }]}>{label}</Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 40,
    alignItems: 'center',
  },

  radarWrap: {
    marginBottom: 6,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 28,
  },

  // ─── Form card ───
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(12,12,14,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },

  // ─── Mode toggle ───
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#007AFF',
  },
  modeTabText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#fff',
  },

  // ─── Error banner ───
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,69,58,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.12)',
  },
  errorBannerText: {
    color: '#ff453a',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  // ─── Fields ───
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#444',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
  },
  inputWrapError: {
    borderColor: 'rgba(255,69,58,0.4)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 4,
  },
  fieldError: {
    color: '#ff453a',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },

  // ─── Submit ───
  submitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },

  // ─── Switch row ───
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: '#444',
    fontSize: 12,
  },
  switchLink: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Privacy + footer ───
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  privacyText: {
    color: '#222',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  version: {
    color: '#1a1a1a',
    fontSize: 9,
    fontWeight: '600',
  },
});

export default LoginScreen;
