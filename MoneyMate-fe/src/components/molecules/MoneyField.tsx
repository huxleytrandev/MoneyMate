import { StyleSheet, Text, View } from 'react-native';
import { MoneyInput, type MoneyInputProps } from '@/components/atoms/MoneyInput';
import { colors } from '@/theme/colors';
export function MoneyField({
  label,
  hint,
  error,
  ...props
}: MoneyInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && { borderColor: colors.expense }]}>
        <MoneyInput
          {...props}
          accessibilityLabel={label}
          placeholder={props.placeholder ?? '0'}
          placeholderTextColor={colors.muted}
          style={[styles.input, props.style]}
        />
        <Text style={styles.unit}>VNĐ</Text>
      </View>
      {!!(error || hint) && (
        <Text
          accessibilityRole={error ? 'alert' : undefined}
          style={{ fontSize: 12, lineHeight: 18, color: error ? colors.expense : colors.muted }}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 14,
    fontSize: 19,
    fontWeight: '600',
    color: colors.ink,
  },
  unit: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});
