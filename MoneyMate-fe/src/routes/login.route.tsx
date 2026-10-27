import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/screens/LoginScreen/LoginScreen';
import { ROUTES } from '@/constants/routes';
export default function LoginRoute() {
  const { session, enterDemo } = useAuth();
  const router = useRouter();
  return session ? (
    <Redirect href={ROUTES.dashboard} />
  ) : (
    <LoginScreen onRegister={() => router.push(ROUTES.register)} onDemo={enterDemo} />
  );
}
