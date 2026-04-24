import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, storageService } from '../services/storageService';
import { FirebaseService } from '../services/firebaseService';
import { TrackingConfig } from '../types';
import ConfigurationPanel from '../components/ConfigurationPanel';
import DebugPanel from '../components/DebugPanel';
import { Theme } from '../theme';
import { useTracking } from '../contexts/TrackingContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
  const { user, logout } = useAuth();
  const userId = user?.uid || route.params?.userId || 'guest_user';
  const { config, updateConfig, syncRecords } = useTracking();
  const [loading, setLoading] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState(user?.email || userId);
  const [avatarStyle, setAvatarStyle] = useState('lorelei');
  const [modalVisible, setModalVisible] = useState(false);

  const avatarStyles = ['lorelei', 'adventurer', 'bottts', 'fun-emoji', 'avataaars', 'micah', 'notionists', 'pixel-art'];
  const predefinedSeeds = ['Felix', 'Aneka', 'Peanut', 'Lucky', 'Mittens', 'Buster', 'Socks', 'Simba', 'Oliver', 'Luna', 'Cleo', 'Milo', 'Bella', 'Chloe', 'Leo', 'Shadow', 'Max', 'Charlie', 'Angel', 'Lily', 'Nova', 'Oscar', 'Jasper', 'Loki'];

  useEffect(() => {
    const loadAvatarPref = async () => {
      try {
        const savedStyle = await AsyncStorage.getItem(`@avatar_style_${userId}`);
        const savedSeed = await AsyncStorage.getItem(`@avatar_seed_${userId}`);
        if (savedStyle) setAvatarStyle(savedStyle);
        if (savedSeed) setAvatarSeed(savedSeed);
      } catch (e) {}
    };
    loadAvatarPref();
  }, [userId]);

  const saveAvatarPref = async (newStyle: string, newSeed: string) => {
    try {
      setAvatarStyle(newStyle);
      setAvatarSeed(newSeed);
      await AsyncStorage.setItem(`@avatar_style_${userId}`, newStyle);
      await AsyncStorage.setItem(`@avatar_seed_${userId}`, newSeed);
      
      if (user?.email) {
        const newUrl = `https://api.dicebear.com/9.x/${newStyle}/png?seed=${encodeURIComponent(newSeed)}&size=128`;
        await FirebaseService.saveUserProfile(userId, { 
          email: user.email, 
          displayName: user.displayName || 'User',
          photoURL: newUrl 
        });
      }
    } catch (e) {}
  };

  const randomizeAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    saveAvatarPref(avatarStyle, newSeed);
  };
  
  const selectAvatarStyle = (style: string) => {
    saveAvatarPref(style, avatarSeed);
  };

  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/png?seed=${encodeURIComponent(avatarSeed)}&size=128`;

  const handleSync = async () => {
    setLoading(true);
    try {
      const syncedCount = await syncRecords();
      
      if (syncedCount === 0) {
        Alert.alert('Status', 'No unsynced data found.');
      } else {
        Alert.alert('Success', `Successfully synced ${syncedCount} records to cloud.`);
      }
    } catch (e) {
      Alert.alert('Sync Error', 'Verify your internet connection and Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
      try {
          await logout();
      } catch (e) {
          Alert.alert('Error', 'Logout failed');
      }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.accountCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrapper}>
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.avatar} 
                />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountEmail}>{user?.email || 'Guest User'}</Text>
                <Text style={styles.accountId}>ID: {userId}</Text>
                <View style={styles.avatarControls}>
                  <TouchableOpacity style={styles.avatarBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.avatarBtnText}>✏️ Edit Avatar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYNC & CLOUD</Text>
          <TouchableOpacity 
            style={[styles.syncButton, loading && { opacity: 0.7 }]} 
            onPress={handleSync}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncText}>☁️ SYNC LOCAL DATA TO FIREBASE</Text>}
          </TouchableOpacity>
        </View>

        <ConfigurationPanel
           config={config}
           onConfigChange={updateConfig}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVELOPER TOOLS</Text>
          <DebugPanel userId={userId} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out of System</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Avatar Style Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Avatar</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalPreviewSection}>
              <View style={styles.modalAvatarWrapper}>
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.modalAvatar} 
                />
              </View>
              <TouchableOpacity style={styles.modalRandomizeBtn} onPress={randomizeAvatar}>
                <Text style={styles.modalRandomizeBtnText}>🎲 Randomize Seed</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.styleSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleList}>
                {avatarStyles.map(style => (
                  <TouchableOpacity 
                    key={style} 
                    style={[styles.styleChip, avatarStyle === style && styles.styleChipActive]}
                    onPress={() => selectAvatarStyle(style)}
                  >
                    <Text style={[styles.styleChipText, avatarStyle === style && styles.styleChipTextActive]}>
                      {style.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView contentContainerStyle={styles.gridContainer}>
              {predefinedSeeds.map(seed => (
                <TouchableOpacity 
                  key={seed} 
                  style={[styles.gridItem, avatarSeed === seed && styles.gridItemActive]}
                  onPress={() => saveAvatarPref(avatarStyle, seed)}
                >
                  <Image 
                    source={{ uri: `https://api.dicebear.com/9.x/${avatarStyle}/png?seed=${encodeURIComponent(seed)}&size=80` }} 
                    style={styles.gridImage} 
                  />
                  <Text style={[styles.gridItemText, avatarSeed === seed && styles.gridItemTextActive]}>
                    {seed}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    paddingTop: Theme.spacing.xl,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.lg },
  section: { gap: Theme.spacing.sm },
  sectionTitle: { color: Theme.colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  syncButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
  },
  syncText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  logoutBtn: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#222',
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333',
  },
  logoutText: { color: Theme.colors.danger, fontWeight: 'bold' },
  accountCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  accountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountEmail: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountId: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginBottom: 12,
  },
  avatarControls: {
    flexDirection: 'row',
    gap: 8,
  },
  avatarBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  avatarBtnText: {
    color: '#ddd',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.lg,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalPreviewSection: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalAvatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 3,
    borderColor: Theme.colors.primary,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
  },
  modalRandomizeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
  },
  modalRandomizeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  styleSelector: {
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  styleList: {
    paddingHorizontal: Theme.spacing.md,
    gap: 8,
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  styleChipActive: {
    backgroundColor: 'rgba(100,255,218,0.1)',
    borderColor: Theme.colors.primary,
  },
  styleChipText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  styleChipTextActive: {
    color: Theme.colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Theme.spacing.md,
    gap: 12,
    justifyContent: 'center',
  },
  gridItem: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Theme.roundness.md,
    padding: Theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  gridImage: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  gridItemText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridItemTextActive: {
    color: Theme.colors.primary,
  }
});

export default SettingsScreen;
