import type { PropsWithChildren } from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenTemplate } from './ScreenTemplate';
import { ui } from '@/theme/layout';
import { colors as c } from '@/theme/colors';
export function AuthTemplate({
  title,
  subtitle,
  onBack,
  children,
}: { title: string; subtitle: string; onBack?: () => void } & PropsWithChildren) {
  return (
    <ScreenTemplate>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={onBack}
          style={s.back}
        >
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </Pressable>
      )}
      <View style={[s.hero, !onBack && { paddingTop: 32 }]}>
        <Text style={ui.title}>{title}</Text>
        <Text style={[ui.body, { fontSize: 15, lineHeight: 24 }]}>{subtitle}</Text>
      </View>
      {children}
    </ScreenTemplate>
  );
}
const s = StyleSheet.create({
  hero: { gap: 9, paddingBottom: 10 },
  back: {
    width: 44,
    height: 44,
    backgroundColor: c.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
