import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';
import socketService from './socketService';

export default function Chat() {
  const router = useRouter();
  const { friendId, friendName } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadUserId();
    fetchMessages();
    socketService.connect();

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('user_typing', handleTyping);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('user_online', (data) => {
      if (data.userId == friendId) setIsOnline(true);
    });
    socketService.on('user_offline', (data) => {
      if (data.userId == friendId) setIsOnline(false);
    });

    // Mark messages as read
    socketService.markRead(friendId);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('user_typing', handleTyping);
      socketService.off('messages_read', handleMessagesRead);
    };
  }, []);

  const loadUserId = async () => {
    const user = await AsyncStorage.getItem('user');
    if (user) {
      setUserId(JSON.parse(user).id);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const handleNewMessage = (message) => {
    if (message.sender_id == friendId) {
      setMessages(prev => [...prev, message]);
      socketService.markRead(friendId);
    }
  };

  const handleMessageSent = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTyping = (data) => {
    if (data.userId == friendId) {
      setIsTyping(data.isTyping);
    }
  };

  const handleMessagesRead = (data) => {
    if (data.userId == friendId) {
      setMessages(prev => prev.map(m => 
        m.receiver_id == friendId ? { ...m, status: 'read' } : m
      ));
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketService.sendMessage(friendId, newMessage);
    setNewMessage('');
    socketService.typing(friendId, false);
  };

  const handleTextChange = (text) => {
    setNewMessage(text);
    
    if (text.trim()) {
      socketService.typing(friendId, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.typing(friendId, false);
      }, 1000);
    } else {
      socketService.typing(friendId, false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const renderMessage = ({ item, index }) => {
    const isMine = item.sender_id === userId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showTime = !prevMsg || new Date(item.created_on_server) - new Date(prevMsg.created_on_server) > 60000;
    
    return (
      <View>
        {showTime && (
          <Text style={styles.timeStamp}>{formatTime(item.created_on_server)}</Text>
        )}
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
          <Text style={styles.messageText}>{item.message}</Text>
          {isMine && (
            <View style={styles.statusContainer}>
              {item.status === 'read' ? (
                <Text style={styles.readStatus}>✓✓</Text>
              ) : item.status === 'delivered' ? (
                <Text style={styles.deliveredStatus}>✓✓</Text>
              ) : (
                <Text style={styles.sentStatus}>✓</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#60a5fa" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{friendName}</Text>
          {isTyping ? (
            <Text style={styles.statusText}>typing...</Text>
          ) : isOnline ? (
            <Text style={styles.statusText}>online</Text>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_id.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={renderMessage}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={newMessage}
          onChangeText={handleTextChange}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1222' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  backBtn: { marginRight: 12 },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusText: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  timeStamp: { textAlign: 'center', color: '#64748b', fontSize: 12, marginVertical: 8 },
  messageBubble: { maxWidth: '75%', padding: 10, borderRadius: 8, marginVertical: 2, marginHorizontal: 12 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#005c4b' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  messageText: { color: '#fff', fontSize: 15 },
  statusContainer: { alignSelf: 'flex-end', marginTop: 2 },
  readStatus: { fontSize: 12, color: '#4ade80' },
  deliveredStatus: { fontSize: 12, color: '#94a3b8' },
  sentStatus: { fontSize: 12, color: '#94a3b8' },
  inputContainer: { flexDirection: 'row', padding: 8, backgroundColor: '#1e293b', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#2d3748', color: '#fff', padding: 10, borderRadius: 20, marginRight: 8, fontSize: 15 },
  sendBtn: { backgroundColor: '#005c4b', padding: 10, borderRadius: 20, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }
});
