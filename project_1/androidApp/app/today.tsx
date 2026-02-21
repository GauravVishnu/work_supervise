import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Today() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#60a5fa" />
      </TouchableOpacity>

      <Text style={styles.title}>Today's Tasks</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionBox} onPress={() => router.push("/viewTask")}>
          <Ionicons name="list-outline" size={50} color="#60a5fa" />
          <Text style={styles.optionText}>View Task</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBox} onPress={() => router.push("/createTask")}>
          <Ionicons name="add-circle-outline" size={50} color="#60a5fa" />
          <Text style={styles.optionText}>Create Task</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionBox} onPress={() => router.push("/taskSummary")}>
          <Ionicons name="stats-chart-outline" size={50} color="#60a5fa" />
          <Text style={styles.optionText}>Task Summary</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 15,
    backgroundColor: "#334155",
    borderRadius: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f1f5f9",
    marginBottom: 50,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  optionBox: {
    width: 140,
    height: 160,
    backgroundColor: "#334155",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#475569",
  },
  optionText: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
  },
});
