import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from './config';
import socketService from './socketService';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Chat() {
  const router = useRouter();
  const { friendId, friendName } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
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

    // Mark friend's messages as read after a delay
    const timer = setTimeout(() => {
      socketService.markRead(friendId);
    }, 1000);

    return () => {
      clearTimeout(timer);
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

  // Refresh messages periodically to get updated status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [friendId]);

  const handleNewMessage = (message) => {
    if (message.sender_id == friendId) {
      setMessages(prev => [...prev, message]);
      socketService.markRead(friendId);
    }
  };

  const handleMessageSent = (message) => {
    // Replace temp message with real one from server
    setMessages(prev => {
      const tempIndex = prev.findIndex(m => m.status === 'sending' && m.message === message.message);
      if (tempIndex !== -1) {
        const updated = [...prev];
        updated[tempIndex] = message;
        return updated;
      }
      // If no temp message found, don't add duplicate
      return prev;
    });
  };

  const handleTyping = (data) => {
    if (data.userId == friendId) {
      setIsTyping(data.isTyping);
    }
  };

  const handleMessagesRead = (data) => {
    if (data.userId == friendId) {
      // Friend read your messages - update messages you sent to them
      setMessages(prev => prev.map(m => 
        (m.sender_id == userId && m.receiver_id == friendId) ? { ...m, status: 'read' } : m
      ));
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (editingMessage) {
      // Edit existing message
      socketService.emit('edit_message', {
        messageId: editingMessage.message_id,
        newText: newMessage.trim()
      });
      setMessages(prev => prev.map(m => 
        m.message_id === editingMessage.message_id 
          ? { ...m, message: newMessage.trim(), edited: true } 
          : m
      ));
      setEditingMessage(null);
      setNewMessage('');
      return;
    }
    
    // Optimistic UI - show message immediately
    const tempMessage = {
      message_id: Date.now(),
      sender_id: userId,
      receiver_id: friendId,
      message: newMessage.trim(),
      status: 'sending',
      created_on_server: new Date().toISOString(),
      reply_to: replyTo?.message_id || null
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const messageText = newMessage;
    setNewMessage('');
    setReplyTo(null);
    socketService.typing(friendId, false);
    
    // Send via WebSocket
    socketService.sendMessage(friendId, messageText, replyTo?.message_id);
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

  const deleteMessage = (messageId) => {
    socketService.emit('delete_message', { messageId });
    setMessages(prev => prev.filter(m => m.message_id !== messageId));
  };

  const startEdit = (message) => {
    setEditingMessage(message);
    setNewMessage(message.message);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const toggleSelectMessage = (message) => {
    setSelectedMessages(prev => {
      const exists = prev.find(m => m.message_id === message.message_id);
      if (exists) {
        return prev.filter(m => m.message_id !== message.message_id);
      }
      return [...prev, message];
    });
  };

  const renderMessage = ({ item, index }) => {
    const isMine = item.sender_id === userId;
    const repliedMsg = item.reply_to ? messages.find(m => m.message_id === item.reply_to) : null;
    const isSelected = selectedMessages.find(m => m.message_id === item.message_id);
    
    const renderRightActions = () => (
      <View style={styles.swipeAction}>
        <Ionicons name="arrow-undo" size={24} color="#60a5fa" />
      </View>
    );
    
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => setReplyTo(item)}
        overshootRight={false}
      >
        <TouchableOpacity 
          onLongPress={() => toggleSelectMessage(item)}
          onPress={() => selectedMessages.length > 0 && toggleSelectMessage(item)}
          activeOpacity={0.7}
          style={isSelected && styles.selectedRow}
        >
          <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
            {repliedMsg && (
              <View style={styles.replyContainer}>
                <Text style={styles.replyText} numberOfLines={1}>{repliedMsg.message}</Text>
              </View>
            )}
            <View style={styles.messageRow}>
              <Text style={styles.messageText}>
                {item.message}
                {item.edited && <Text style={styles.editedLabel}> (edited)</Text>}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={styles.messageTime}>{formatTime(item.created_on_server)}</Text>
                {isMine && (
                  <Text style={item.status === 'read' ? styles.readStatus : styles.sentStatus}>
                    {item.status === 'read' ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <View style={styles.header}>
        {selectedMessages.length > 0 ? (
          <>
            <TouchableOpacity onPress={() => setSelectedMessages([])} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#60a5fa" />
            </TouchableOpacity>
            <Text style={styles.title}>{selectedMessages.length} selected</Text>
            <View style={styles.headerActions}>
              {selectedMessages.length === 1 && (
                <TouchableOpacity onPress={() => { setReplyTo(selectedMessages[0]); setSelectedMessages([]); }} style={styles.headerActionBtn}>
                  <Ionicons name="arrow-undo" size={24} color="#60a5fa" />
                </TouchableOpacity>
              )}
              {selectedMessages.length === 1 && selectedMessages[0].sender_id === userId && (
                <TouchableOpacity onPress={() => { startEdit(selectedMessages[0]); setSelectedMessages([]); }} style={styles.headerActionBtn}>
                  <Ionicons name="pencil" size={24} color="#60a5fa" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => { selectedMessages.forEach(m => deleteMessage(m.message_id)); setSelectedMessages([]); }} style={styles.headerActionBtn}>
                <Ionicons name="trash" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.message_id.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyPreviewText} numberOfLines={1}>Replying to: {replyTo.message}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        {editingMessage && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyPreviewText}>Editing message</Text>
            <TouchableOpacity onPress={cancelEdit}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={newMessage}
            onChangeText={handleTextChange}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c1222' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 40, backgroundColor: '#1e293b' },
  backBtn: { marginRight: 12 },
  headerInfo: { flex: 1 },
  callBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statusText: { fontSize: 12, color: '#22c55e', marginTop: 2 },
  messagesList: { paddingVertical: 10 },
  messageBubble: { maxWidth: '75%', padding: 8, borderRadius: 8, marginVertical: 2, marginHorizontal: 12 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#005c4b' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  selectedRow: { backgroundColor: '#1e3a5f', width: '100%' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  messageText: { color: '#fff', fontSize: 15, flexShrink: 1 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  messageTime: { fontSize: 10, color: '#94a3b8' },
  readStatus: { fontSize: 12, color: '#4ade80' },
  sentStatus: { fontSize: 12, color: '#94a3b8' },
  replyContainer: { backgroundColor: '#1e293b', padding: 6, borderRadius: 4, marginBottom: 4, borderLeftWidth: 3, borderLeftColor: '#60a5fa' },
  replyText: { fontSize: 12, color: '#94a3b8' },
  editedLabel: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },
  swipeAction: { justifyContent: 'center', alignItems: 'center', width: 60, backgroundColor: '#1e293b' },
  headerActions: { flexDirection: 'row', gap: 16, flex: 1, justifyContent: 'flex-end' },
  headerActionBtn: { padding: 4 },
  inputContainer: { backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  replyPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, backgroundColor: '#2d3748', borderBottomWidth: 1, borderBottomColor: '#334155' },
  replyPreviewText: { fontSize: 12, color: '#94a3b8', flex: 1 },
  inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#2d3748', color: '#fff', padding: 10, borderRadius: 20, marginRight: 8, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#005c4b', padding: 10, borderRadius: 20, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }
});
