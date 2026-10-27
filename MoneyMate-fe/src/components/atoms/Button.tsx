import { colors } from '@/theme/colors';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary'
          ? styles.primary
          : variant === 'secondary'
            ? styles.secondary
            : styles.text,
        (pressed || disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.green} />
      ) : (
        <Text style={[styles.label, variant === 'primary' && { color: 'white' }]}>{title}</Text>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.green },
  secondary: { backgroundColor: colors.lime },
  text: { backgroundColor: 'transparent' },
  label: { fontSize: 14, fontWeight: '700', color: colors.green },
});
