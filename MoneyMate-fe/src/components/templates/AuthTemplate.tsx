import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenTemplate } from './ScreenTemplate';
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
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
      )}
      <View style={[styles.hero, !onBack && { paddingTop: 32 }]}>
        <Text style={ui.title}>{title}</Text>
        <Text style={[ui.body, { fontSize: 15, lineHeight: 24 }]}>{subtitle}</Text>
      </View>
      {children}
    </ScreenTemplate>
  );
}
const styles = StyleSheet.create({
  hero: { gap: 9, paddingBottom: 10 },
  back: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
