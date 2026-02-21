const isDevelopment = __DEV__;

export const API_URL = isDevelopment 
  ? 'http://10.162.111.227:3001'
  : 'https://work-supervise.onrender.com';
