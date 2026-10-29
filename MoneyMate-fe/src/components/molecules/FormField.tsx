import { useSheetBusy } from '@/hooks/useSheetBusy';
import { colors } from '@/theme/colors';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
type Props = TextInputProps & { label: string; error?: string; hint?: string };
export function FormField({ label, error, hint, ...props }: Props) {
  const busy = useSheetBusy();
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        editable={props.editable !== false && !busy}
        style={[styles.input, error ? { borderColor: '#A33B28' } : null, props.style]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.ink,
    minHeight: 52,
  },
  error: { fontSize: 12, color: '#A33B28', lineHeight: 18 },
  hint: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
