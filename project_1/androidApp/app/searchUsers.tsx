import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';

export default function SearchUsers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>Search Users</Text>
      </View>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  searchBox: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#334155', color: '#fff', padding: 12, borderRadius: 8, marginRight: 10 },
  searchBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  email: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  addBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
