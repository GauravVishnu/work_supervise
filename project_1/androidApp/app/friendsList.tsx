import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';

export default function FriendsList() {
  const router = useRouter();
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getFriends();
  }, []);

  const getFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load friends');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getFriends();
    setRefreshing(false);
  };

  const viewFriendTasks = (friendId, friendName) => {
    router.push({ pathname: '/friendTasks', params: { friendId, friendName } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>Friends Tasks</Text>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.udm_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => viewFriendTasks(item.udm_id, item.udm_name)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.udm_name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.udm_name}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#334155', padding: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#475569', marginHorizontal: 20, marginBottom: 8, borderRadius: 8 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
