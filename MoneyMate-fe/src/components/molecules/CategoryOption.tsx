import { useSheetBusy } from '@/hooks/useSheetBusy';
import { Pressable, Text } from 'react-native';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { colors } from '@/theme/colors';
import type { Category } from '@/types/finance.types';
export function CategoryOption({
  category,
  selected,
  onPress,
}: {
  category: Category;
  selected: boolean;
  onPress: () => void;
}) {
  const busy = useSheetBusy();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      accessibilityState={{ selected, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        borderRadius: 16,
        padding: 7,
        paddingRight: 13,
        borderWidth: 1,
        borderColor: selected ? colors.green : colors.border,
        backgroundColor: selected ? colors.lime : colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <CategoryIcon category={category} size={32} />
      <Text style={{ color: colors.ink, fontSize: 12, fontWeight: selected ? '700' : '500' }}>
        {category.name}
      </Text>
    </Pressable>
  );
}
