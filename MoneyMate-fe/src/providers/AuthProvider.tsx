import { Button } from '@/components/atoms/Button';
import { setFinanceTimezone } from '@/helpers/date';
import { ApiError, onUnauthorized } from '@/services/api.service';
import { currentUser, logout as logoutRequest } from '@/services/auth.service';
import { colors } from '@/theme/colors';
import type { AuthResult, UserSession } from '@/types/auth.types';
import { createContext, useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
export const AuthContext = createContext<{
  session: UserSession | null;
  establish: (result: AuthResult) => Promise<void>;
  logout: () => Promise<void>;
  updateSession: (user: UserSession) => void;
  forgetSession: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const clearLocalState = useCallback(() => {
    setFinanceTimezone(undefined);
    setSession(null);
  }, []);
  function acceptUser(user: UserSession) {
    setFinanceTimezone(user.timezone);
    setSession(user);
  }
  useEffect(() => {
    let active = true;
    onUnauthorized(clearLocalState);
    currentUser()
      .then(({ user }) => {
        if (active) acceptUser(user);
      })
      .catch((failure) => {
        if (!active) return;
        if (failure instanceof ApiError && failure.status === 401) {
          clearLocalState();
          return;
        }
        setError(failure instanceof Error ? failure.message : 'Không thể khôi phục phiên.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      onUnauthorized(undefined);
    };
  }, [clearLocalState]);
  async function restore() {
    setLoading(true);
    setError('');
    try {
      acceptUser((await currentUser()).user);
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) clearLocalState();
      else setError(failure instanceof Error ? failure.message : 'Không thể khôi phục phiên.');
    } finally {
      setLoading(false);
    }
  }
  async function establish(result: AuthResult) {
    acceptUser(result.user);
  }
  async function logout() {
    await logoutRequest();
    clearLocalState();
  }
  async function forgetSession() {
    await logoutRequest();
    clearLocalState();
  }
  return (
    <AuthContext.Provider
      value={{ session, establish, logout, updateSession: acceptUser, forgetSession }}
    >
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator color={colors.green} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 28,
            gap: 18,
            backgroundColor: colors.background,
          }}
        >
          <Text>{error}</Text>
          <Button title="Thử kết nối lại" onPress={() => void restore()} />
          <Button
            title="Quay lại đăng nhập"
            variant="text"
            onPress={() => {
              void forgetSession()
                .then(() => setError(''))
                .catch(() => setError('Chưa thể đăng xuất. Vui lòng kết nối lại.'));
            }}
          />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
