import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from './config';

export default function CreateTask() {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [submitted, setSubmitted] = useState(false);

  const handleCreateTask = async () => {
    console.log("=== Create Task clicked ===");
    console.log("Task data:", { taskName, description });

    if (!taskName) {
      console.log("❌ Empty task name");
      Alert.alert("Error", "Please enter task name");
      return;
    }
    console.log("✅ Task name filled");

    try {
      const token = await AsyncStorage.getItem("token");
      console.log("🔑 Token:", token ? "Found" : "Not found");

      console.log("🚀 Making API call to:", `${API_URL}/tasks`);

      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: taskName,
          description: description || "",
          completionPercentage: 0,
          visibility: visibility
        }),
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok) {
        console.log("✅ Task created");
        setSubmitted(true);
        setTaskName("");
        setDescription("");
      } else {
        console.log("❌ Failed:", data.error);
        Alert.alert("Error", data.error || "Failed to create task");
      }
    } catch (err: any) {
      console.log("❌ Error:", err);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
      </TouchableOpacity>

      <Text style={styles.title}>Create New Task</Text>

      <Text style={styles.label}>Task Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter task name"
        placeholderTextColor="#94a3b8"
        value={taskName}
        onChangeText={setTaskName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter task description"
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Visibility</Text>
      <View style={styles.visibilityContainer}>
        <TouchableOpacity 
          style={[styles.visibilityBtn, visibility === 'private' && styles.visibilityActive]} 
          onPress={() => setVisibility('private')}
        >
          <Ionicons name="lock-closed" size={20} color={visibility === 'private' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>Private</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.visibilityBtn, visibility === 'friends' && styles.visibilityActive]} 
          onPress={() => setVisibility('friends')}
        >
          <Ionicons name="people" size={20} color={visibility === 'friends' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.visibilityText, visibility === 'friends' && styles.visibilityTextActive]}>Friends</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreateTask}>
        {submitted ? (
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Task</Text>
        )}
      </TouchableOpacity>

      {submitted && (
        <TouchableOpacity style={styles.addMoreButton} onPress={() => setSubmitted(false)}>
          <Ionicons name="add-circle-outline" size={24} color="#60a5fa" />
          <Text style={styles.addMoreText}>Add More Task</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#334155",
    borderWidth: 2,
    borderColor: "#475569",
    borderRadius: 10,
    padding: 15,
    color: "#f1f5f9",
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 15,
    borderWidth: 2,
    borderColor: "#60a5fa",
    borderRadius: 10,
  },
  addMoreText: {
    color: "#60a5fa",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  visibilityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    gap: 8,
  },
  visibilityActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  visibilityText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: '#fff',
  },
});
