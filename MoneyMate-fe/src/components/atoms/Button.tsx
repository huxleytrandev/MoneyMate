import { useSheetBusy } from '@/hooks/useSheetBusy';
import type { ComponentProps } from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};
const appearance = {
  primary: { mode: 'contained', buttonColor: colors.green, textColor: 'white' },
  secondary: { mode: 'contained-tonal', buttonColor: colors.lime, textColor: colors.green },
  text: { mode: 'text', textColor: colors.green },
  danger: { mode: 'text', textColor: colors.expense },
} satisfies Record<NonNullable<Props['variant']>, Partial<ComponentProps<typeof PaperButton>>>;
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  accessibilityLabel,
}: Props) {
  const busy = useSheetBusy();
  return (
    <PaperButton
      {...appearance[variant]}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading || busy}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: Boolean(disabled || loading || busy),
        busy: Boolean(loading),
      }}
      contentStyle={{ minHeight: 50 }}
      labelStyle={{ fontSize: 14, fontWeight: '700' }}
      style={{ borderRadius: 18 }}
    >
      {title}
    </PaperButton>
  );
}
