import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SectionList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { storageService } from '../services/storageService';
import { Theme } from '../theme';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LocationRecord } from '../types';
import { useTracking } from '../contexts/TrackingContext';
import CloudDataScreen from './CloudDataScreen';
import { DebugLogger } from '../utils/debugLogger';

const logger = new DebugLogger('HistoryScreen');

interface GroupedRecords {
  title: string;
  data: LocationRecord[];
}

/**
 * HistoryScreen — the SOLE controller for database operations.
 * 
 * Rules:
 *   - Only this screen can trigger cloud sync (Force Sync button)
 *   - Only this screen can delete records
 *   - No autonomous sync anywhere in the app
 */
const HistoryScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { records, syncRecords, clearAllRecords, deleteRecord } = useTracking();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');

  const stats = React.useMemo(() => {
    const syncedCount = records.filter(r => r.synced).length;
    return {
      total: records.length,
      synced: syncedCount,
      unsynced: records.length - syncedCount,
    };
  }, [records]);

  const groupedData = React.useMemo(() => {
    const groups: { [key: string]: LocationRecord[] } = {};
    [...records].sort((a, b) => b.createdAt - a.createdAt).forEach(record => {
      const date = moment(record.createdAt).format('MMMM Do, YYYY');
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
    });
    return Object.keys(groups).map(date => ({ title: date, data: groups[date] }));
  }, [records]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Context already handles updates, but we can fake a quick loader or force a state refresh if needed
    setTimeout(() => setRefreshing(false), 500);
  };

  // ─── DB CONTROLS (only place sync happens) ───

  const handleForceSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const count = await syncRecords();
      if (count > 0) {
        logger.info('Manual sync successful', { records: count });
        Alert.alert('Success', `Sync complete! ${count} records uploaded to cloud.`);
      } else {
        logger.info('Manual sync skipped: No records found');
        Alert.alert('Status', 'Your local database is already in sync with the cloud.');
      }
    } catch (e) {
      Alert.alert(
        'Connection Error', 
        'Failed to reach the cloud server. Check your internet connection and try again.'
      );
    } finally {
      setSyncing(false);
    }
  };


  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL local records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: clearAllRecords,
        },
      ]
    );
  };

  const handleDeleteRecord = (recordId: string) => {
    Alert.alert('Delete Entry', 'Remove this record?', [
      { text: 'Keep' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRecord(recordId),
      },
    ]);
  };

  // ─── RENDER ───

  const renderItem = ({ item }: { item: LocationRecord }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Track', { focusLocation: item.location })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusRow}>
          <View style={[styles.syncDot, { backgroundColor: item.synced ? '#34c759' : '#ff3b30' }]} />
          <Text style={styles.sourceTag}>
            {item.location.source} • {item.synced ? 'SYNCED' : 'LOCAL'}
          </Text>
        </View>
        <Text style={styles.timeText}>{moment(item.createdAt).format('HH:mm:ss')}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.coordBox}>
          <Text style={styles.label}>POSITION</Text>
          <Text style={styles.value}>
            {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
          </Text>
        </View>
        {item.location.accuracy > 0 && (
          <Text style={styles.accuracyText}>±{Math.round(item.location.accuracy)}m</Text>
        )}
        <TouchableOpacity
          style={styles.delBtn}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteRecord(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={14} color="#ccc" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>DB Archive</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleForceSync} style={styles.hBtn} disabled={syncing}>
            <View>
              <Ionicons
                name="cloud-upload-outline"
                size={22}
                color={syncing ? '#555' : '#34c759'}
              />
              {stats.unsynced > 0 && !syncing && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.unsynced}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={styles.hBtn}>
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'local' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('local')}
        >
          <Text style={[styles.tabText, activeTab === 'local' && styles.tabTextActive]}>Local Archive</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'cloud' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('cloud')}
        >
          <Text style={[styles.tabText, activeTab === 'cloud' && styles.tabTextActive]}>Cloud Storage</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'local' ? (
        <View style={{ flex: 1 }}>
          {/* Stats banner */}
          <View style={styles.statBanner}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statSub}>TOTAL</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#34c759' }]}>{stats.synced}</Text>
              <Text style={styles.statSub}>SYNCED</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#ff3b30' }]}>{stats.unsynced}</Text>
              <Text style={styles.statSub}>PENDING</Text>
            </View>
          </View>

          {stats.unsynced > 0 && (
            <TouchableOpacity 
              style={[styles.syncNowBtn, syncing && { opacity: 0.7 }]} 
              onPress={handleForceSync}
              disabled={syncing}
            >
              <Ionicons name="cloud-upload" size={16} color="#fff" />
              <Text style={styles.syncNowText}>
                {syncing ? 'SYNCING...' : `SYNC ${stats.unsynced} RECORDS TO CLOUD`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Record list grouped by date */}
          <SectionList
            sections={groupedData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title, data } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
                <Text style={styles.sectionCount}>{data.length} pts</Text>
                <View style={styles.sectionLine} />
              </View>
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
            }
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={40} color="#444" />
                <Text style={styles.emptyText}>
                  Archive is empty.{'\n'}Start tracking to record GPS history.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <CloudDataScreen navigation={navigation} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    paddingTop: Theme.spacing.xl,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 15 },
  hBtn: { paddingHorizontal: 5 },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#222',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: Theme.colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionCount: {
    color: '#555',
    fontSize: 9,
    fontWeight: '600',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1a1a1a',
  },
  statBanner: {
    flexDirection: 'row',
    backgroundColor: '#111',
    padding: 15,
    margin: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statSub: { color: '#555', fontSize: 8, fontWeight: 'bold', marginTop: 2 },
  divider: { width: 1, height: 20, backgroundColor: '#222', alignSelf: 'center' },
  list: { padding: 15, paddingTop: 0, gap: 10 },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceTag: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 9,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncDot: { width: 5, height: 5, borderRadius: 2.5 },
  timeText: { color: '#666', fontSize: 9 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordBox: { flex: 1 },
  label: {
    color: '#444',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  accuracyText: {
    color: '#666',
    fontSize: 9,
    marginRight: 8,
  },
  delBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,59,48,0.05)',
    borderRadius: 8,
  },
  emptyContainer: { marginTop: 100, alignItems: 'center', gap: 12 },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  syncNowBtn: {
    flexDirection: 'row',
    backgroundColor: '#34c759',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#34c759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  syncNowText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default HistoryScreen;
