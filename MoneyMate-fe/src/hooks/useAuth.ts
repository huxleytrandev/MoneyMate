import { AuthContext } from '@/providers/AuthProvider';
import { useContext } from 'react';
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}
