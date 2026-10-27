import { TextInput, Text, View, StyleSheet, type TextInputProps } from 'react-native';
import { colors as c } from '@/theme/colors';
type Props = TextInputProps & { label: string; error?: string; hint?: string };
export function FormField({ label, error, hint, ...props }: Props) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={[s.input, error ? { borderColor: '#A33B28' } : null, props.style]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: c.ink },
  input: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: c.ink,
    minHeight: 52,
  },
  error: { fontSize: 12, color: '#A33B28', lineHeight: 18 },
  hint: { fontSize: 11, color: c.muted, lineHeight: 17 },
});
