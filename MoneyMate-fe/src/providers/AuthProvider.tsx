import { createContext, useState, type PropsWithChildren } from 'react';
import type { DemoSession } from '@/types/auth.types';
export const AuthContext = createContext<{
  session: DemoSession | null;
  enterDemo: () => void;
  logout: () => void;
} | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<DemoSession | null>(null);
  return (
    <AuthContext.Provider
      value={{
        session,
        enterDemo: () => setSession({ displayName: 'Bạn', mode: 'demo' }),
        logout: () => setSession(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
