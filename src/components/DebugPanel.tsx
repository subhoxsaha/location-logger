import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { DebugLogger } from '../utils/debugLogger';
import { StorageService } from '../services/storageService';
import wifiService from '../services/wifiLocationService';

interface DebugPanelProps {
  userId: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ userId }) => {
  const [storedRecords, setStoredRecords] = useState<number>(0);
  const [wifiNodes, setWifiNodes] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'records' | 'status'>('logs');

  useEffect(() => {
    loadDebugInfo();
    const interval = setInterval(loadDebugInfo, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadDebugInfo = async () => {
    try {
      const allLogs = DebugLogger.getLogs();
      const recentLogs = allLogs.slice(-30).map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `[${time}] ${log.level}: ${log.message}`;
      });
      setLogs(recentLogs.reverse());

      const storageService = new StorageService();
      const records = await storageService.getRecords(userId);
      setStoredRecords(records.length);
      setWifiNodes(wifiService.getDatabaseSize());
    } catch (error) {
      console.error('Error loading debug info', error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const allLogs = DebugLogger.exportLogs();
      await Share.share({
        message: allLogs,
        title: 'Location Tracker Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClearLogs = () => {
    DebugLogger.clearLogs();
    setLogs([]);
    Alert.alert('Success', 'Logs cleared');
  };

  const handleClearRecords = async () => {
    try {
      const storageService = new StorageService();
      await storageService.clearLocationHistory(userId);
      setStoredRecords(0);
      Alert.alert('Success', 'Records cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear records');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {['logs', 'records', 'status'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} nestedScrollEnabled>
        {activeTab === 'logs' && (
          <View>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No logs recorded yet.</Text>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logText}>{log}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'records' && (
          <View style={styles.center}>
            <View style={styles.statGroup}>
              <Text style={styles.statLabel}>Local Storage</Text>
              <Text style={styles.statValue}>{storedRecords}</Text>
              <Text style={styles.statSub}>Location Records</Text>
            </View>
            
            <View style={[styles.statGroup, { marginTop: 20 }]}>
              <Text style={styles.statLabel}>WiFi Intelligence</Text>
              <Text style={styles.statValue}>{wifiNodes}</Text>
              <Text style={styles.statSub}>Calibration Points</Text>
            </View>

            <TouchableOpacity 
              style={[styles.dangerBtn, { marginTop: 30 }]} 
              onPress={handleClearRecords}
            >
              <Text style={styles.dangerBtnText}>WIPE HISTORY</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'status' && (
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <Text style={styles.sLabel}>User ID</Text>
              <Text style={styles.sValue}>{userId.slice(0, 15)}...</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.sLabel}>Version</Text>
              <Text style={styles.sValue}>1.0.0 (Production)</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.sLabel}>Engine</Text>
              <Text style={styles.sValue}>Expo 51 / RN 0.74</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {activeTab === 'logs' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExportLogs}>
            <Text style={styles.actionBtnText}>SHARE LOGS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={handleClearLogs}>
            <Text style={styles.actionBtnText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0066cc',
  },
  tabText: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#0066cc',
  },
  content: {
    height: 300,
    padding: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  statGroup: {
    alignItems: 'center',
    width: '100%',
  },
  logItem: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  logText: {
    color: '#aaa',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#444',
    textAlign: 'center',
    marginTop: 100,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  statSub: {
    color: '#0066cc',
    fontSize: 12,
    marginBottom: 30,
  },
  dangerBtn: {
    backgroundColor: '#4d1a1a',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  dangerBtnText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusList: {
    gap: 15,
    paddingTop: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sLabel: {
    color: '#666',
    fontSize: 12,
  },
  sValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#0a0a0a',
  },
  actionBtn: {
    flex: 2,
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearBtn: {
    flex: 1,
    backgroundColor: '#333',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default DebugPanel;
