import { useSheetBusy } from '@/hooks/useSheetBusy';
import { Pressable, Text, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { categoryIcons, categoryColors } from '@/constants/category-options';
import { ui } from '@/theme/layout';
interface Props {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}
export function CategoryAppearancePicker({ icon, color, onIconChange, onColorChange }: Props) {
  const busy = useSheetBusy();
  return (
    <View style={{ gap: 12 }}>
      <Text style={ui.label}>Biểu tượng danh mục</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categoryIcons.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            disabled={busy}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: option.value === icon }}
            onPress={() => onIconChange(option.value)}
            style={{
              borderWidth: 2,
              borderColor: icon === option.value ? color : 'transparent',
              borderRadius: 17,
              padding: 2,
            }}
          >
            <CategoryIcon
              category={{ name: option.label, kind: 'expense', icon: option.value, color }}
            />
          </Pressable>
        ))}
      </View>
      <Text style={ui.label}>Màu nhấn</Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {categoryColors.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            disabled={busy}
            accessibilityLabel={'Màu ' + option}
            accessibilityState={{ selected: color === option }}
            onPress={() => onColorChange(option)}
            style={{
              backgroundColor: option,
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {color === option && <Check size={20} color="white" />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
