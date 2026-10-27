import { AuthForm } from '@/components/organisms/AuthForm';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { colors } from '@/theme/colors';
import { Pressable, Text, View } from 'react-native';
export default function RegisterScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <AuthTemplate
      title="Tạo tài khoản"
      subtitle="Bắt đầu hành trình chủ động tài chính ngay hôm nay."
      onBack={onLogin}
    >
      <AuthForm mode="register" />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Text style={{ fontSize: 13, color: colors.muted }}>Đã có tài khoản?</Text>
        <Pressable accessibilityRole="button" onPress={onLogin} style={{ padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.green }}>Đăng nhập</Text>
        </Pressable>
      </View>
    </AuthTemplate>
  );
}
