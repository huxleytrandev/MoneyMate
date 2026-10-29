import Utensils from 'lucide-react-native/icons/utensils';
import Coffee from 'lucide-react-native/icons/coffee';
import Bus from 'lucide-react-native/icons/bus';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import House from 'lucide-react-native/icons/house';
import Heart from 'lucide-react-native/icons/heart';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Gamepad2 from 'lucide-react-native/icons/gamepad-2';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Gift from 'lucide-react-native/icons/gift';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Wallet from 'lucide-react-native/icons/wallet';
import Plane from 'lucide-react-native/icons/plane';
import PiggyBank from 'lucide-react-native/icons/piggy-bank';
import Receipt from 'lucide-react-native/icons/receipt';
import Tags from 'lucide-react-native/icons/tags';
import { type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { categoryIconName, categoryColor } from '@/helpers/category';
import type { Category } from '@/types/finance.types';
const icons: Record<string, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  bus: Bus,
  'shopping-bag': ShoppingBag,
  house: House,
  heart: Heart,
  'graduation-cap': GraduationCap,
  gamepad: Gamepad2,
  briefcase: Briefcase,
  gift: Gift,
  'trending-up': TrendingUp,
  wallet: Wallet,
  plane: Plane,
  'piggy-bank': PiggyBank,
  receipt: Receipt,
  tags: Tags,
};
export function CategoryIcon({
  category,
  size = 44,
}: {
  category: Pick<Category, 'icon' | 'name' | 'kind' | 'color'>;
  size?: number;
}) {
  const Icon = icons[categoryIconName(category)] ?? Tags;
  const color = categoryColor(category);
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: color + '14',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size * 0.48} color={color} strokeWidth={1.8} />
    </View>
  );
}
