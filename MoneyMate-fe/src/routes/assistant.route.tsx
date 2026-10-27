import { ROUTES } from '@/constants/routes';
import AssistantScreen from '@/screens/AssistantScreen/AssistantScreen';
import { useRouter } from 'expo-router';
export default function AssistantRoute() {
  const router = useRouter();
  return <AssistantScreen onViewBudget={() => router.navigate(ROUTES.budget)} />;
}
