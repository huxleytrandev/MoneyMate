import { APP_CONFIG } from '@/configs/app.config';
import { useAuthForm } from '@/hooks/useAuthForm';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../atoms/Button';
import { FormField } from '../molecules/FormField';
import { PasswordField } from '../molecules/PasswordField';
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { values, errors, message, busy, setField, submit } = useAuthForm(mode);
  const [forgot, setForgot] = useState(false);
  return (
    <View style={{ gap: 21 }}>
      {mode === 'register' && (
        <FormField
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={values.displayName}
          onChangeText={(value) => setField('displayName', value)}
          error={errors.displayName}
          autoComplete="name"
        />
      )}
      <FormField
        label="Email"
        placeholder="email@vi-du.com"
        value={values.email}
        onChangeText={(value) => setField('email', value)}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
      />
      <PasswordField
        label="Mật khẩu"
        value={values.password}
        onChangeText={(value) => setField('password', value)}
        error={errors.password}
      />
      {mode === 'register' && (
        <PasswordField
          label="Xác nhận mật khẩu"
          value={values.confirmPassword}
          onChangeText={(value) => setField('confirmPassword', value)}
          error={errors.confirmPassword}
        />
      )}
      {mode === 'register' ? (
        <Text style={[ui.body, { fontSize: 12 }]}>Dùng ít nhất 12 ký tự cho mật khẩu.</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setForgot((value) => !value)}
          style={{ alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center', marginTop: -12 }}
        >
          <Text style={{ fontSize: 12, color: colors.green, fontWeight: '600' }}>
            Quên mật khẩu?
          </Text>
        </Pressable>
      )}
      {forgot && (
        <Text accessibilityRole="alert" style={ui.body}>
          Nếu bạn vẫn đăng nhập, hãy đổi mật khẩu ở Hồ sơ tài khoản. Khôi phục qua email chưa được
          hỗ trợ.
        </Text>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={ui.error}>
          {message}
        </Text>
      )}
      <Button
        title={mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        loading={busy}
        onPress={() => void submit()}
      />
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>
        {APP_CONFIG.authNotice}
      </Text>
    </View>
  );
}
