import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    console.log("Logout pressed");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#60a5fa" />
      </TouchableOpacity>
      
      <Text style={styles.text}>Welcome to Quiz App!</Text>
      
      <View style={styles.boxContainer}>
        <TouchableOpacity style={styles.box} onPress={() => router.push("/today")}>
          <Ionicons name="today-outline" size={40} color="#60a5fa" />
          <Text style={styles.boxText}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box} onPress={() => router.push("/friends")}>
          <Ionicons name="people-outline" size={40} color="#60a5fa" />
          <Text style={styles.boxText}>Friends</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.box}>
          <Ionicons name="time-outline" size={40} color="#60a5fa" />
          <Text style={styles.boxText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1e293b",
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
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#60a5fa",
    marginBottom: 40,
  },
  boxContainer: {
    flexDirection: "row",
    gap: 20,
  },
  box: {
    width: 100,
    height: 120,
    backgroundColor: "#334155",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#475569",
  },
  boxText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
});
