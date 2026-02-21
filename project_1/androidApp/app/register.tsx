import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from './config';

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10));
    setNum2(Math.floor(Math.random() * 10));
    setCaptchaInput("");
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (Number(captchaInput) !== num1 + num2) {
      Alert.alert("Error", "Incorrect captcha");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          mobile: "NA",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Registration successful");
        router.replace("/");
      } else {
        Alert.alert("Error", data.error || "Registration failed");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name="person-add" size={32} color="#3b82f6" />
      </View>

      <Text style={styles.heading}>Create Account</Text>
      <Text style={styles.subHeading}>Sign up to start taking quizzes</Text>

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="person-outline" size={20} color="#9ca3af" />
        <TextInput
          placeholder="John Doe"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Email */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="mail-outline" size={20} color="#9ca3af" />
        <TextInput
          placeholder="you@example.com"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
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

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
        <TextInput
          placeholder="••••••••"
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Create Account</Text>
      </Pressable>

      {/* Sign in */}
      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.signIn} onPress={() => router.replace("/")}>
          Sign in
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

  signIn: {
    color: "#60a5fa",
    fontWeight: "600",
  },
});