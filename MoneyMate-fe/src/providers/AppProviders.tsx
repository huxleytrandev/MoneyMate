import { PaperProvider } from 'react-native-paper';
import { paperTheme } from '@/theme/paper';
import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './AuthProvider';
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>{children}</AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
