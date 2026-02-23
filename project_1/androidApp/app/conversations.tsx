import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from './config';
import socketService from './socketService';

export default function Conversations() {
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchFriends();
    socketService.connect();

    socketService.on('user_online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });
    socketService.on('user_offline', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    return () => {
      socketService.off('user_online');
      socketService.off('user_offline');
    };
  }, []);

  const fetchFriends = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        console.error('Fetch friends failed:', response.status);
        setRefreshing(false);
        return;
      }
      
      const data = await response.json();
      console.log('Friends:', data.friends?.length || 0);
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Fetch friends error:', error);
    }
    setRefreshing(false);
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => router.push({ pathname: '/chat', params: { friendId: item.udm_id, friendName: item.udm_name } })}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, onlineUsers.has(item.udm_id) && styles.onlineAvatar]}>
          <Text style={styles.avatarText}>{item.udm_name[0].toUpperCase()}</Text>
        </View>
        {onlineUsers.has(item.udm_id) && <View style={styles.onlineDot} />}
      </View>
      
      <View style={styles.friendContent}>
        <Text style={styles.name}>{item.udm_name}</Text>
        <Text style={styles.subtitle}>Tap to start chat</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Friend to Chat</Text>
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item.udm_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFriends(); }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No friends yet. Add friends to start chatting!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  backButton: { fontSize: 28, color: '#60a5fa', marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  friendItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  onlineAvatar: { borderWidth: 2, borderColor: '#22c55e' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#0f172a' },
  friendContent: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontSize: 16 },
});
