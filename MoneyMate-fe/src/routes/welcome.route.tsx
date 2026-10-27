import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import WelcomeScreen from '@/screens/WelcomeScreen/WelcomeScreen';
import { Redirect, useRouter } from 'expo-router';
export default function WelcomeRoute() {
  const { session } = useAuth();
  const router = useRouter();
  if (session) return <Redirect href={ROUTES.dashboard} />;
  return (
    <WelcomeScreen
      onStart={() => router.push(ROUTES.register)}
      onLogin={() => router.push(ROUTES.login)}
    />
  );
}
