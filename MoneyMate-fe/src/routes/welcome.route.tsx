import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import WelcomeScreen from '@/screens/WelcomeScreen/WelcomeScreen';
export default function WelcomeRoute() {
  const { session, enterDemo } = useAuth();
  const router = useRouter();
  if (session) return <Redirect href={ROUTES.dashboard} />;
  return (
    <WelcomeScreen
      onStart={() => router.push(ROUTES.register)}
      onLogin={() => router.push(ROUTES.login)}
      onDemo={enterDemo}
    />
  );
}
