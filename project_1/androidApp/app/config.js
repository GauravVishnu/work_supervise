import { Platform } from 'react-native';
import Constants from 'expo-constants';

// CHANGE THIS to your Render backend URL
const PRODUCTION_URL = 'https://your-app-name.onrender.com';

const getApiUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:3001';
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    return debuggerHost ? `http://${debuggerHost}:3001` : 'http://192.168.1.4:3001';
  }
  return PRODUCTION_URL;
};

export const API_URL = getApiUrl();
console.log('API_URL:', API_URL);
