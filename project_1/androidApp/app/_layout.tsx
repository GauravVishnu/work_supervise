import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#0c1222' },
        animation: 'fade'
      }} 
    />
  );
}
