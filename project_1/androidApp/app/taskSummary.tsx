import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from './config';

export default function TaskSummary() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [inProgressTasks, setInProgressTasks] = useState(0);
  const [avgCompletion, setAvgCompletion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        const taskList = data.tasks || [];
        
        // Sort: incomplete tasks by percentage (high to low), then completed tasks at bottom
        const sortedTasks = taskList.sort((a: any, b: any) => {
          if (a.completion_percentage === 100 && b.completion_percentage !== 100) return 1;
          if (a.completion_percentage !== 100 && b.completion_percentage === 100) return -1;
          return b.completion_percentage - a.completion_percentage;
        });
        
        setTasks(sortedTasks);
        
        const total = taskList.length;
        const completed = taskList.filter((t: any) => t.completion_percentage === 100).length;
        const inProgress = taskList.filter((t: any) => t.completion_percentage > 0 && t.completion_percentage < 100).length;
        const avg = total > 0 ? Math.round(taskList.reduce((sum: number, t: any) => sum + (t.completion_percentage || 0), 0) / total) : 0;

        setTotalTasks(total);
        setCompletedTasks(completed);
        setInProgressTasks(inProgress);
        setAvgCompletion(avg);
      }
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
      </TouchableOpacity>

      <Text style={styles.title}>Task Summary</Text>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={40} color="#60a5fa" />
            <Text style={styles.statNumber}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={[styles.statCard, styles.completedCard]}>
            <Ionicons name="checkmark-circle-outline" size={40} color="#10b981" />
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, styles.progressCard]}>
            <Ionicons name="time-outline" size={40} color="#f59e0b" />
            <Text style={styles.statNumber}>{inProgressTasks}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={40} color="#8b5cf6" />
            <Text style={styles.statNumber}>{avgCompletion}%</Text>
            <Text style={styles.statLabel}>Avg Completion</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Task List</Text>
        {tasks.map((task: any) => (
          <View key={task.task_id} style={styles.taskItem}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskPercentage}>{task.completion_percentage}%</Text>
            </View>
            <View style={styles.progressBarSmall}>
              <View 
                style={[
                  styles.progressFillSmall, 
                  { width: `${task.completion_percentage || 0}%` }
                ]} 
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 24,
  },
  backButton: {
    width: 50,
    height: 50,
    backgroundColor: "#334155",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#334155",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#475569",
  },
  completedCard: {
    borderColor: "#10b981",
  },
  progressCard: {
    borderColor: "#f59e0b",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 15,
  },
  taskItem: {
    backgroundColor: "#334155",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#475569",
  },
  taskInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    color: "#f1f5f9",
    fontWeight: "600",
    flex: 1,
  },
  taskPercentage: {
    fontSize: 16,
    color: "#60a5fa",
    fontWeight: "bold",
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: "#475569",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFillSmall: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 3,
  },
});
