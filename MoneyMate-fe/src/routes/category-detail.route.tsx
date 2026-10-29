import { useLocalSearchParams } from 'expo-router';
import { monthKey } from '@/helpers/date';
import CategoryDetailScreen from '@/screens/CategoryDetailScreen/CategoryDetailScreen';
export default function CategoryDetailRoute() {
  const params = useLocalSearchParams<{ id: string; month?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const month =
    typeof params.month === 'string' &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) &&
    Number(params.month.slice(0, 4)) >= 1000 &&
    Number(params.month.slice(0, 4)) <= 9998
      ? params.month
      : monthKey(new Date());
  return <CategoryDetailScreen key={id} id={id} initialMonth={month} />;
}
