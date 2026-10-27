import { AuthForm } from '@/components/organisms/AuthForm';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
export default function LoginScreen({ onRegister }: { onRegister: () => void }) {
  return (
    <AuthTemplate
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để tiếp tục quản lý tài chính của bạn."
    >
      <AuthForm mode="login" />
      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.small}>hoặc tiếp tục với</Text>
        <View style={styles.line} />
      </View>
      <View style={styles.socialRow}>
        <View accessibilityLabel="Google chưa khả dụng" style={styles.social}>
          <Ionicons name="logo-google" size={19} color={colors.ink} />
          <Text style={styles.socialText}>Google</Text>
        </View>
        <View accessibilityLabel="Apple chưa khả dụng" style={styles.social}>
          <Ionicons name="logo-apple" size={21} color={colors.ink} />
          <Text style={styles.socialText}>Apple</Text>
        </View>
      </View>
      <Text style={[styles.small, { textAlign: 'center', marginTop: -12 }]}>
        Đăng nhập Google và Apple đang được hoàn thiện.
      </Text>
      <View style={styles.footer}>
        <Text style={styles.small}>Chưa có tài khoản?</Text>
        <Pressable accessibilityRole="button" onPress={onRegister} style={{ padding: 10 }}>
          <Text style={styles.link}>Tạo tài khoản</Text>
        </Pressable>
      </View>
    </AuthTemplate>
  );
}
const styles = StyleSheet.create({
  separator: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  small: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  socialRow: { flexDirection: 'row', gap: 14 },
  social: {
    flex: 1,
    height: 54,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    opacity: 0.65,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  link: { fontSize: 13, color: colors.green, fontWeight: '600' },
});
