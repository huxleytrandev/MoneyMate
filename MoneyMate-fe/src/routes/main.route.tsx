import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { FinanceProvider } from '@/providers/FinanceProvider';
import { ROUTES } from '@/constants/routes';
export default function MainRoute() {
  const { session } = useAuth();
  if (!session) return <Redirect href={ROUTES.welcome} />;
  return (
    <FinanceProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="profile" />
      </Stack>
    </FinanceProvider>
  );
}
