import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";

const API_URL = "http://10.162.111.227:3001";

export default function ViewTask() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sliderValues, setSliderValues] = useState<{[key: string]: number}>({});
  const [remarksValues, setRemarksValues] = useState<{[key: string]: string}>({});

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
        
        // Initialize slider values and remarks
        const initialValues: {[key: string]: number} = {};
        const initialRemarks: {[key: string]: string} = {};
        sortedTasks.forEach((task: any) => {
          initialValues[task.task_id] = task.completion_percentage || 0;
          initialRemarks[task.task_id] = task.remarks || '';
        });
        setSliderValues(initialValues);
        setRemarksValues(initialRemarks);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const updateCompletion = async (taskId: string, percentage: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ completionPercentage: percentage }),
      });

      if (response.ok) {
        // Update local state instead of fetching all tasks
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.task_id === taskId 
              ? { ...task, completion_percentage: percentage }
              : task
          )
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const updateRemarks = async (taskId: string, remarks: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ remarks }),
      });

      if (response.ok) {
        // Update local state instead of fetching all tasks
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.task_id === taskId 
              ? { ...task, remarks: remarks }
              : task
          )
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const updateVisibility = async (taskId: string, visibility: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ visibility }),
      });

      if (response.ok) {
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.task_id === taskId 
              ? { ...task, visibility: visibility }
              : task
          )
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const deleteTask = async (taskId: string, taskName: string) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskName}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });

              if (response.ok) {
                fetchTasks();
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
      </TouchableOpacity>

      <Text style={styles.title}>My Tasks</Text>

      <ScrollView 
        style={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />
        }
      >
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet. Create one!</Text>
        ) : (
          tasks.map((task: any) => (
            <View 
              key={task.task_id} 
              style={[
                styles.taskCard,
                task.completion_percentage === 100 && styles.taskCardCompleted
              ]}
            >
              <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{task.name}</Text>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.task_id, task.name)}
                >
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.taskDescription}>{task.description}</Text>

              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Completion:</Text>
                <TextInput
                  style={styles.percentageInput}
                  keyboardType="numeric"
                  value={String(sliderValues[task.task_id] ?? task.completion_percentage ?? 0)}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 0;
                    if (num >= 0 && num <= 100) {
                      setSliderValues(prev => ({...prev, [task.task_id]: num}));
                      updateCompletion(task.task_id, num);
                    }
                  }}
                />
                <Text style={styles.percentageText}>%</Text>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={sliderValues[task.task_id] ?? task.completion_percentage ?? 0}
                onValueChange={(value) => {
                  setSliderValues(prev => ({...prev, [task.task_id]: value}));
                }}
                onSlidingComplete={(value) => {
                  updateCompletion(task.task_id, value);
                }}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#475569"
                thumbTintColor="#60a5fa"
              />

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${task.completion_percentage || 0}%` }
                  ]} 
                />
              </View>

              <Text style={styles.remarksLabel}>Remarks:</Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add remarks..."
                placeholderTextColor="#94a3b8"
                value={remarksValues[task.task_id] ?? task.remarks ?? ""}
                onChangeText={(value) => setRemarksValues(prev => ({...prev, [task.task_id]: value}))}
                onBlur={() => updateRemarks(task.task_id, remarksValues[task.task_id] ?? '')}
                multiline
              />

              <Text style={styles.visibilityLabel}>Visibility:</Text>
              <View style={styles.visibilityContainer}>
                <TouchableOpacity 
                  style={[styles.visibilityBtn, task.visibility === 'private' && styles.visibilityActive]} 
                  onPress={() => updateVisibility(task.task_id, 'private')}
                >
                  <Ionicons name="lock-closed" size={18} color={task.visibility === 'private' ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.visibilityText, task.visibility === 'private' && styles.visibilityTextActive]}>Private</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.visibilityBtn, task.visibility === 'friends' && styles.visibilityActive]} 
                  onPress={() => updateVisibility(task.task_id, 'friends')}
                >
                  <Ionicons name="people" size={18} color={task.visibility === 'friends' ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.visibilityText, task.visibility === 'friends' && styles.visibilityTextActive]}>Friends</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  taskList: {
    flex: 1,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  taskCard: {
    backgroundColor: "#334155",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#475569",
  },
  taskCardCompleted: {
    backgroundColor: "#065f46",
    borderColor: "#10b981",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  taskName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9",
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 15,
  },
  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  completionLabel: {
    fontSize: 16,
    color: "#e2e8f0",
    marginRight: 10,
  },
  percentageInput: {
    backgroundColor: "#475569",
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: "center",
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "bold",
  },
  percentageText: {
    fontSize: 16,
    color: "#e2e8f0",
    marginLeft: 5,
  },
  slider: {
    width: "100%",
    height: 50,
    marginBottom: 10,
    transform: [{ scaleY: 2 }],
  },
  progressBar: {
    height: 10,
    backgroundColor: "#475569",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 5,
  },
  remarksLabel: {
    fontSize: 14,
    color: "#e2e8f0",
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  remarksInput: {
    backgroundColor: "#475569",
    borderRadius: 8,
    padding: 10,
    color: "#f1f5f9",
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  visibilityLabel: {
    fontSize: 14,
    color: "#e2e8f0",
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#475569',
    borderRadius: 8,
    gap: 6,
  },
  visibilityActive: {
    backgroundColor: '#3b82f6',
  },
  visibilityText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: '#fff',
  },
});
