import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

export default function History() {
  const router = useRouter();
  const [stats, setStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/history/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.stats || []);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const saveSnapshot = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/history/snapshot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      fetchStats();
    } catch (err) {
      alert('Failed to save snapshot');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      <Text style={styles.note}>💡 Snapshots are automatically saved daily at midnight</Text>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />}
      >
        {stats.length === 0 ? (
          <Text style={styles.empty}>No history yet. Save a snapshot!</Text>
        ) : (
          stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => {
                console.log('Clicked date:', stat.snapshot_date);
                router.push(`/historyDetail?date=${stat.snapshot_date}`);
              }}
            >
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={20} color="#60a5fa" />
                <Text style={styles.date}>{new Date(stat.snapshot_date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.total_tasks}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.completed_tasks}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.round(stat.avg_completion)}%</Text>
                  <Text style={styles.statLabel}>Avg Progress</Text>
                </View>
              </View>
            </TouchableOpacity>
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
  snapshotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', marginHorizontal: 20, padding: 15, borderRadius: 10, gap: 10, marginBottom: 20 },
  snapshotText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  note: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginBottom: 20, fontStyle: 'italic' },
  content: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: '#334155', padding: 15, borderRadius: 10, marginBottom: 15 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  date: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#60a5fa', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 5 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
