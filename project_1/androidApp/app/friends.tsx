import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, RefreshControl, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';

export default function Friends() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'requests') await getFriendRequests();
    if (activeTab === 'friends') await getFriends();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/users/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to search users');
    }
  };

  const sendRequest = async (friendId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ friendUserId: friendId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('✓ Friend request sent!');
        setSearchResults(searchResults.filter(u => u.udm_id !== friendId));
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      alert('Failed to send request');
    }
  };

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

  const viewFriendTasks = (friendId, friendName) => {
    router.push({ pathname: '/friendTasks', params: { friendId, friendName } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'search' && styles.activeTab]} onPress={() => setActiveTab('search')}>
          <Ionicons name="search-outline" size={24} color={activeTab === 'search' ? '#60a5fa' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
          <Ionicons name="mail-outline" size={24} color={activeTab === 'requests' ? '#60a5fa' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'friends' && styles.activeTab]} onPress={() => setActiveTab('friends')}>
          <Ionicons name="people-outline" size={24} color={activeTab === 'friends' ? '#60a5fa' : '#94a3b8'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friends</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' && (
        <View style={styles.content}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.input}
              placeholder="Search by name or email"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={searchUsers}>
              <Text style={styles.btnText}>Search</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.udm_id.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View>
                  <Text style={styles.name}>{item.udm_name}</Text>
                  <Text style={styles.email}>{item.udm_email}</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => sendRequest(item.udm_id)}>
                  <Text style={styles.btnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Search for users to add as friends</Text>}
          />
        </View>
      )}

      {activeTab === 'requests' && (
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
                <TouchableOpacity style={styles.acceptBtn} onPress={() => respondRequest(item.friend_id, 'accepted')}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => respondRequest(item.friend_id, 'rejected')}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No pending requests</Text>}
        />
      )}

      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.udm_id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => viewFriendTasks(item.udm_id, item.udm_name)}>
              <View>
                <Text style={styles.name}>{item.udm_name}</Text>
                <Text style={styles.email}>{item.udm_email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#60a5fa" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', gap: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#60a5fa' },
  tabText: { color: '#94a3b8', fontSize: 16 },
  activeTabText: { color: '#60a5fa', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  searchBox: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#334155', color: '#fff', padding: 12, borderRadius: 8, marginRight: 10 },
  searchBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, justifyContent: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  addBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  btnGroup: { flexDirection: 'row', gap: 10 },
  acceptBtn: { backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  rejectBtn: { backgroundColor: '#ef4444', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
