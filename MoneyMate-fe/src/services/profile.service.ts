import { api } from './api.service';
import type { UserProfile } from '@/types/profile.types';
export const getProfile = (signal?: AbortSignal) =>
  api<UserProfile>('/users/me/profile', { signal });
export const saveProfile = (body: UserProfile) =>
  api<UserProfile>('/users/me/profile', { method: 'PUT', body });
