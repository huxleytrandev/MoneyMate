import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import DashboardScreen from '@/screens/DashboardScreen/DashboardScreen';
import { useRouter } from 'expo-router';
export default function DashboardRoute() {
  const { session, logout } = useAuth();
  const router = useRouter();
  return (
    <DashboardScreen
      displayName={session?.displayName ?? 'Bạn'}
      onLogout={logout}
      onAssets={() => router.navigate(ROUTES.assets)}
      onBudget={() => router.navigate(ROUTES.budget)}
      onTransactions={() => router.navigate(ROUTES.transactions)}
    />
  );
}
