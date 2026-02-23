import { Platform } from 'react-native';

// Always use local backend when scanning QR
const LOCAL_URL = Platform.OS === 'web' ? 'http://localhost:3001' : 'http://192.168.1.4:3001';

export const API_URL = LOCAL_URL;
