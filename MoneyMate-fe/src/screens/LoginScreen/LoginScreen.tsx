import { Text, View, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { AuthForm } from '@/components/organisms/AuthForm';
import { Button } from '@/components/atoms/Button';
import { colors as c } from '@/theme/colors';
export default function LoginScreen({
  onRegister,
  onDemo,
}: {
  onRegister: () => void;
  onDemo: () => void;
}) {
  return (
    <AuthTemplate
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để tiếp tục quản lý tài chính của bạn."
    >
      <AuthForm mode="login" />
      <View style={s.separator}>
        <View style={s.line} />
        <Text style={s.small}>hoặc tiếp tục với</Text>
        <View style={s.line} />
      </View>
      <View style={s.socialRow}>
        <View accessibilityLabel="Google chưa khả dụng" style={s.social}>
          <Ionicons name="logo-google" size={19} color={c.ink} />
          <Text style={s.socialText}>Google</Text>
        </View>
        <View accessibilityLabel="Apple chưa khả dụng" style={s.social}>
          <Ionicons name="logo-apple" size={21} color={c.ink} />
          <Text style={s.socialText}>Apple</Text>
        </View>
      </View>
      <Text style={[s.small, { textAlign: 'center', marginTop: -12 }]}>
        Đăng nhập Google và Apple đang được hoàn thiện.
      </Text>
      <View style={s.footer}>
        <Text style={s.small}>Chưa có tài khoản?</Text>
        <Pressable accessibilityRole="button" onPress={onRegister} style={{ padding: 10 }}>
          <Text style={s.link}>Tạo tài khoản</Text>
        </Pressable>
      </View>
      <Button title="Khám phá bản trải nghiệm" variant="secondary" onPress={onDemo} />
    </AuthTemplate>
  );
}
const s = StyleSheet.create({
  separator: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  line: { flex: 1, height: 1, backgroundColor: c.border },
  small: { fontSize: 12, color: c.muted, lineHeight: 18 },
  socialRow: { flexDirection: 'row', gap: 14 },
  social: {
    flex: 1,
    height: 54,
    borderRadius: 19,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    opacity: 0.65,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: c.ink },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  link: { fontSize: 13, color: c.green, fontWeight: '600' },
});
