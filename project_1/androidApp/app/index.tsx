import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.162.111.227:3001";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    generateCaptcha();
    // checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      router.replace("/(tabs)/");
    }
  };

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10));
    setNum2(Math.floor(Math.random() * 10));
    setCaptchaInput("");
  };

  const handleLogin = async () => {
    console.log("=== Login clicked ===");
    console.log("Form data:", { email, password, captchaInput });
    console.log("Captcha: input =", captchaInput, "expected =", num1 + num2);

    if (!email || !password) {
      console.log("❌ FAILED: Empty fields");
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    console.log("✅ PASSED: Fields filled");

    if (Number(captchaInput) !== num1 + num2) {
      console.log("❌ FAILED: Incorrect captcha");
      Alert.alert("Error", "Incorrect captcha");
      return;
    }
    console.log("✅ PASSED: Captcha correct");

    console.log("🚀 Making API call to:", `${API_URL}/login`);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("📡 Response status:", response.status);
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (response.ok) {
        console.log("✅ Login successful");
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        router.push("/home");
      } else {
        console.log("❌ Login failed:", data.error);
        Alert.alert("Error", data.error || "Login failed");
      }
    } catch (err: any) {
      console.log("❌ Network Error:", err);
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="log-in-outline" size={32} color="#3b82f6" />
      </View>

      <Text style={styles.heading}>Welcome Back</Text>
      <Text style={styles.subHeading}>
        Sign in to continue to Quiz App
      </Text>

      {/* Email */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={20} color="#9ca3af" />
        <TextInput
          placeholder="you@example.com"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
        <TextInput
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Captcha */}
      <Text style={styles.label}>Verify you're human</Text>
      <View style={styles.captchaBox}>
        <Text style={styles.captchaText}>
          {num1} + {num2} =
        </Text>

        <TextInput
          style={styles.captchaInput}
          keyboardType="numeric"
          value={captchaInput}
          onChangeText={setCaptchaInput}
        />

        <Pressable onPress={generateCaptcha} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* Button */}
      <Pressable 
        style={styles.button} 
        onPress={() => {
          console.log("BUTTON PRESSED!");
          handleLogin();
        }}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>

      {/* Footer */}
      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text
          style={styles.signUp}
          onPress={() => router.push("/register")}
        >
          Sign up
        </Text>
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#1e293b",
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 40,
    marginBottom: 20,
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#f1f5f9",
  },

  subHeading: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#e2e8f0",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#475569",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#334155",
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    color: "#f1f5f9",
  },

  captchaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#334155",
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },

  captchaText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
    color: "#e2e8f0",
  },

  captchaInput: {
    flex: 1,
    backgroundColor: "#475569",
    borderRadius: 8,
    paddingVertical: 6,
    textAlign: "center",
    marginHorizontal: 8,
    color: "#f1f5f9",
  },

  refreshBtn: {
    padding: 6,
    backgroundColor: "#475569",
    borderRadius: 8,
  },

  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#94a3b8",
  },

  signUp: {
    color: "#60a5fa",
    fontWeight: "600",
  },
});