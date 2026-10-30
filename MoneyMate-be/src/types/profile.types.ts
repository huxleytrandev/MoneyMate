import type { GENDERS } from '../constants/profile.constant.ts';
export interface UserProfile {
  displayName: string;
  gender: (typeof GENDERS)[number] | null;
  dateOfBirth: string | null;
  avatarData: string | null;
}
