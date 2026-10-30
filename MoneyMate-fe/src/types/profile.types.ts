export type Gender = 'male' | 'female' | 'other' | 'undisclosed';
export interface UserProfile {
  displayName: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  avatarData: string | null;
}
