import { useSheetBusy } from '@/hooks/useSheetBusy';
import { colors } from '@/theme/colors';
import { Pressable, StyleSheet, Text } from 'react-native';
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const busy = useSheetBusy();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.green }]}
    >
      <Text style={[styles.text, selected && { color: 'white' }]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 44,
  },
  text: { color: colors.green, fontSize: 12, fontWeight: '600' },
});
