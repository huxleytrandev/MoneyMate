import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors as c } from '@/theme/colors';
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
        s.base,
        variant === 'primary' ? s.primary : variant === 'secondary' ? s.secondary : s.text,
        (pressed || disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : c.green} />
      ) : (
        <Text style={[s.label, variant === 'primary' && { color: 'white' }]}>{title}</Text>
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: c.green },
  secondary: { backgroundColor: c.lime },
  text: { backgroundColor: 'transparent' },
  label: { fontSize: 14, fontWeight: '700', color: c.green },
});
