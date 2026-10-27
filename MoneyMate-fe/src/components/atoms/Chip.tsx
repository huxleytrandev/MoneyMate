import { Pressable, Text, StyleSheet } from 'react-native';
import { colors as c } from '@/theme/colors';
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected && { backgroundColor: c.green }]}
    >
      <Text style={[s.text, selected && { color: 'white' }]}>{label}</Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  chip: {
    borderRadius: 20,
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 44,
  },
  text: { color: c.green, fontSize: 12, fontWeight: '600' },
});
