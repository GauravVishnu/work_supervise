import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';

export default function FriendRequests() {
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getFriendRequests();
  }, []);

  const getFriendRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFriendRequests(data.requests || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load requests');
    }
  };

  const respondRequest = async (requestId, status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/friends/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      Alert.alert('Success', data.message);
      await getFriendRequests();
    } catch (err) {
      Alert.alert('Error', 'Failed to respond');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getFriendRequests();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>Friend Requests</Text>
      </View>

      <FlatList
        data={friendRequests}
        keyExtractor={(item) => item.friend_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.udm_name}</Text>
              <Text style={styles.email}>{item.udm_email}</Text>
            </View>
            <View style={styles.btnGroup}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => respondRequest(item.friend_id, true)}>
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => respondRequest(item.friend_id, false)}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pending requests</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  btnGroup: { flexDirection: 'row', gap: 10 },
  acceptBtn: { backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  rejectBtn: { backgroundColor: '#ef4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
