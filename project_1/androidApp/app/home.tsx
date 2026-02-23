import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socketService from './socketService';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    socketService.connect();
  }, []);

  const handleLogout = async () => {
    console.log("Logout pressed");
    socketService.disconnect();
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
      </TouchableOpacity>
      
      <Text style={styles.heading}>Work Supervise</Text>
      
      {/* My Tasks Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.box} onPress={() => router.push("/today")}>
          <Ionicons name="today-outline" size={40} color="#60a5fa" />
          <Text style={styles.boxText}>Today's Tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => router.push("/history")}>
          <Ionicons name="time-outline" size={40} color="#ec4899" />
          <Text style={styles.boxText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Friends Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends</Text>
        
        <TouchableOpacity style={styles.box} onPress={() => router.push('/conversations')}>
          <Ionicons name="chatbubbles" size={40} color="#22c55e" />
          <Text style={styles.boxText}>Chat with Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => router.push('/friendsList')}>
          <Ionicons name="list" size={40} color="#8b5cf6" />
          <Text style={styles.boxText}>View Friends Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.smallBox} onPress={() => router.push('/searchUsers')}>
          <Ionicons name="person-add" size={24} color="#10b981" />
          <Text style={styles.smallText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallBox} onPress={() => router.push('/friendRequests')}>
          <Ionicons name="mail" size={24} color="#f59e0b" />
          <Text style={styles.smallText}>Requests</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 20,
  },
  logoutButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 12,
    backgroundColor: "#ef4444",
    borderRadius: 50,
    zIndex: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 70,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 10,
    marginLeft: 5,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  boxText: {
    color: "#e2e8f0",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 15,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  smallBox: {
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 15,
    width: "45%",
    borderWidth: 1,
    borderColor: "#334155",
  },
  smallText: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
