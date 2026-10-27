import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import DashboardScreen from '@/screens/DashboardScreen/DashboardScreen';
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
