import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { Redirect, useRouter } from 'expo-router';
export default function LoginRoute() {
  const { session } = useAuth();
  const router = useRouter();
  return session ? (
    <Redirect href={ROUTES.dashboard} />
  ) : (
    <LoginScreen onRegister={() => router.push(ROUTES.register)} />
  );
}
