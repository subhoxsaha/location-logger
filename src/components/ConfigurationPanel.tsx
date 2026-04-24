import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { TrackingConfig } from '../types';

interface ConfigurationPanelProps {
  config: TrackingConfig;
  onConfigChange: (config: TrackingConfig) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onConfigChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [tempInterval, setTempInterval] = useState(config.intervalSeconds.toString());
  const [tempMaxRecords, setTempMaxRecords] = useState(config.maxStorageRecords.toString());

  const handleToggleTracking = (enabled: boolean) => {
    onConfigChange({ ...config, enabled });
  };

  const handleToggleOnlineMode = (enabled: boolean) => {
    onConfigChange({ ...config, useOnlineMode: enabled });
  };

  const handleToggleOfflineMode = (enabled: boolean) => {
    onConfigChange({ ...config, useOfflineMode: enabled });
  };

  const handleUpdateInterval = () => {
    const interval = parseInt(tempInterval) || config.intervalSeconds;
    if (interval < 5) {
      Alert.alert('Invalid', 'Interval must be at least 5 seconds');
      return;
    }
    if (interval > 3600) {
      Alert.alert('Invalid', 'Interval cannot exceed 1 hour');
      return;
    }
    onConfigChange({ ...config, intervalSeconds: interval });
    setExpanded(false);
  };

  const handleUpdateMaxRecords = () => {
    const maxRecords = parseInt(tempMaxRecords) || config.maxStorageRecords;
    if (maxRecords < 10) {
      Alert.alert('Invalid', 'Minimum 10 records');
      return;
    }
    if (maxRecords > 10000) {
      Alert.alert('Invalid', 'Maximum 10000 records');
      return;
    }
    onConfigChange({ ...config, maxStorageRecords: maxRecords });
    setExpanded(false);
  };

  return (
    <View style={styles.container}>
      {/* Configuration Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.headerTitle}>⚙️ Configuration</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {/* Configuration Options */}
      {expanded && (
        <View style={styles.content}>
          {/* Enable Tracking */}
          <View style={styles.configRow}>
            <View style={styles.configLabel}>
              <Text style={styles.configTitle}>Enable Tracking</Text>
              <Text style={styles.configDesc}>Start automatic location tracking</Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleTracking}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={config.enabled ? '#4caf50' : '#f4f3f4'}
            />
          </View>

          {/* Online Mode (GPS) */}
          <View style={styles.configRow}>
            <View style={styles.configLabel}>
              <Text style={styles.configTitle}>📡 Online Mode (GPS)</Text>
              <Text style={styles.configDesc}>Use GPS when device is online</Text>
            </View>
            <Switch
              value={config.useOnlineMode}
              onValueChange={handleToggleOnlineMode}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={config.useOnlineMode ? '#4caf50' : '#f4f3f4'}
            />
          </View>

          {/* Offline Mode (WiFi) */}
          <View style={styles.configRow}>
            <View style={styles.configLabel}>
              <Text style={styles.configTitle}>📶 Offline Mode (WiFi)</Text>
              <Text style={styles.configDesc}>Use WiFi scanning when offline</Text>
            </View>
            <Switch
              value={config.useOfflineMode}
              onValueChange={handleToggleOfflineMode}
              trackColor={{ false: '#767577', true: '#81c784' }}
              thumbColor={config.useOfflineMode ? '#4caf50' : '#f4f3f4'}
            />
          </View>

          {/* Tracking Interval */}
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>⏱️ Tracking Interval</Text>
            <Text style={styles.configDesc}>Current: {config.intervalSeconds} seconds</Text>
            <View style={styles.quickButtonsRow}>
              {[10, 30, 60, 300].map((seconds) => (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.quickButton,
                    config.intervalSeconds === seconds && styles.quickButtonActive,
                  ]}
                  onPress={() => onConfigChange({ ...config, intervalSeconds: seconds })}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      config.intervalSeconds === seconds && styles.quickButtonTextActive,
                    ]}
                  >
                    {seconds}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Custom seconds"
                value={tempInterval}
                onChangeText={setTempInterval}
                keyboardType="number-pad"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.setButton} onPress={handleUpdateInterval}>
                <Text style={styles.setButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Max Storage Records */}
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>💾 Max Storage Records</Text>
            <Text style={styles.configDesc}>Current: {config.maxStorageRecords} records</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Max records"
                value={tempMaxRecords}
                onChangeText={setTempMaxRecords}
                keyboardType="number-pad"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.setButton} onPress={handleUpdateMaxRecords}>
                <Text style={styles.setButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Configuration Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Current Configuration</Text>
            <Text style={styles.summaryText}>Status: {config.enabled ? '✅ Enabled' : '❌ Disabled'}</Text>
            <Text style={styles.summaryText}>Online: {config.useOnlineMode ? '✅' : '❌'}</Text>
            <Text style={styles.summaryText}>Offline: {config.useOfflineMode ? '✅' : '❌'}</Text>
            <Text style={styles.summaryText}>Interval: {config.intervalSeconds}s</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  expandIcon: {
    fontSize: 14,
    color: '#aaa',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  configLabel: {
    flex: 1,
    marginRight: 12,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  configDesc: {
    fontSize: 12,
    color: '#aaa',
  },
  configSection: {
    backgroundColor: '#0f0f0f',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  quickButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0088ff',
  },
  quickButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  quickButtonTextActive: {
    color: '#fff',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  setButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  summaryBox: {
    backgroundColor: '#0f0f0f',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#aaa',
    marginVertical: 3,
  },
});

export default ConfigurationPanel;
