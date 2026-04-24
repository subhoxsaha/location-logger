import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '../theme';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LocationRecord } from '../types';
import { FirebaseService } from '../services/firebaseService';
import { useTracking } from '../contexts/TrackingContext';

const CloudDataScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userId } = useTracking();
  const [records, setRecords] = useState<LocationRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LocationRecord | null>(null);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCloudData = async () => {
    try {
      const data = await FirebaseService.getUserLocationHistory(userId, 500); // Fetch up to 500 records
      setRecords(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch cloud records.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCloudData();
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCloudData();
    setRefreshing(false);
  };

  const handleDelete = (recordId: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record from the cloud?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await FirebaseService.deleteLocationRecord(userId, recordId);
            setRecords((prev) => prev.filter((r) => r.id !== recordId));
          } catch (e) {
            Alert.alert('Error', 'Could not delete record.');
          }
        },
      },
    ]);
  };

  const openEditModal = (record: LocationRecord) => {
    setEditingRecord(record);
    setEditLat(record.location.latitude.toString());
    setEditLng(record.location.longitude.toString());
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const lat = parseFloat(editLat);
    const lng = parseFloat(editLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for latitude and longitude.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedLocation = {
        ...editingRecord.location,
        latitude: lat,
        longitude: lng,
      };
      
      await FirebaseService.updateLocationRecord(userId, editingRecord.id, {
        location: updatedLocation,
      });
      
      setRecords((prev) => 
        prev.map((r) => 
          r.id === editingRecord.id ? { ...r, location: updatedLocation } : r
        )
      );
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update record.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: LocationRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.statusRow}>
          <Ionicons name="cloud-done" size={14} color="#007AFF" />
          <Text style={styles.sourceTag}>CLOUD • {item.location.source}</Text>
        </View>
        <Text style={styles.timeText}>{moment(item.createdAt).format('MMM D, HH:mm')}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.coordBox}>
          <Text style={styles.label}>POSITION</Text>
          <Text style={styles.value}>
            {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash" size={16} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.fetchBtn} onPress={onRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color="#fff" />
              <Text style={styles.fetchBtnText}>Fetch Cloud Data</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.recordCount}>{records.length} records</Text>
      </View>

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color="#444" />
            <Text style={styles.emptyText}>
              No records found in the cloud.{'\n'}Make sure you sync your local history!
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Coordinates</Text>
            
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={editLat}
              onChangeText={setEditLat}
              keyboardType="numeric"
              placeholderTextColor="#555"
            />
            
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={editLng}
              onChangeText={setEditLng}
              keyboardType="numeric"
              placeholderTextColor="#555"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancel]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalSave]} 
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  fetchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  fetchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  recordCount: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: { padding: 15, gap: 10 },
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
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#666', fontSize: 10 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordBox: { flex: 1 },
  label: {
    color: '#444',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  value: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 8,
  },
  delBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 8,
  },
  emptyContainer: { marginTop: 100, alignItems: 'center', gap: 12 },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#000',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#333',
  },
  modalSave: {
    backgroundColor: '#007AFF',
  },
  modalCancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CloudDataScreen;
