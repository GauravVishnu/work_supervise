import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.162.111.227:3001';

export default function FriendTasks() {
  const router = useRouter();
  const { friendId, friendName } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/friends/${friendId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      alert('Failed to load tasks');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>{friendName}'s Tasks</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.task_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
        renderItem={({ item }) => (
          <View style={[styles.card, item.completion_percentage === 100 && styles.completedCard]}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskName}>{item.name}</Text>
              <Text style={[styles.percentage, item.completion_percentage === 100 && styles.completedText]}>
                {item.completion_percentage}%
              </Text>
            </View>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            {item.remarks ? <Text style={styles.remarks}>Note: {item.remarks}</Text> : null}
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${item.completion_percentage}%` }]} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No shared tasks</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 8, marginHorizontal: 20, marginBottom: 10 },
  completedCard: { backgroundColor: '#065f46' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskName: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  percentage: { color: '#60a5fa', fontSize: 16, fontWeight: 'bold' },
  completedText: { color: '#10b981' },
  description: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  remarks: { color: '#fbbf24', fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 3 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
