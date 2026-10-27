import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import RegisterScreen from '@/screens/RegisterScreen/RegisterScreen';
import { ROUTES } from '@/constants/routes';
export default function RegisterRoute() {
  const { session } = useAuth();
  const router = useRouter();
  return session ? (
    <Redirect href={ROUTES.dashboard} />
  ) : (
    <RegisterScreen onLogin={() => router.replace(ROUTES.login)} />
  );
}
