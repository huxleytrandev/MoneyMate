import Constants from 'expo-constants';
import { Platform } from 'react-native';
const host =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.hostname
    : (Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost');
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://' + host + ':3000/api').replace(
  /\/$/,
  '',
);
