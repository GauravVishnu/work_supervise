import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

export default function HistoryDetail() {
  const router = useRouter();
  const { date } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Fetching tasks for date:', date);
      const res = await fetch(`${API_URL}/history/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Tasks response:', data);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>{new Date(date).toLocaleDateString()}</Text>
      </View>

      <ScrollView style={styles.content}>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks for this date</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.history_id} style={styles.card}>
              <Text style={styles.taskName}>{task.name}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${task.completion_percentage}%` }]} />
              </View>
              <Text style={styles.percentage}>{task.completion_percentage}%</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { marginRight: 15, padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 10, marginBottom: 15 },
  taskName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  progressBar: { height: 8, backgroundColor: '#475569', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 4 },
  percentage: { color: '#94a3b8', fontSize: 14, textAlign: 'right' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
