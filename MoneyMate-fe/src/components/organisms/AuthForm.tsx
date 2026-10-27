import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { APP_CONFIG } from '@/configs/app.config';
import { useAuthForm } from '@/hooks/useAuthForm';
import { FormField } from '../molecules/FormField';
import { PasswordField } from '../molecules/PasswordField';
import { Button } from '../atoms/Button';
import { ui } from '@/theme/layout';
import { colors as c } from '@/theme/colors';
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
          onChangeText={(v) => setField('displayName', v)}
          error={errors.displayName}
          autoComplete="name"
        />
      )}
      <FormField
        label="Email"
        placeholder="email@vi-du.com"
        value={values.email}
        onChangeText={(v) => setField('email', v)}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
      />
      <PasswordField
        label="Mật khẩu"
        value={values.password}
        onChangeText={(v) => setField('password', v)}
        error={errors.password}
      />
      {mode === 'register' && (
        <PasswordField
          label="Xác nhận mật khẩu"
          value={values.confirmPassword}
          onChangeText={(v) => setField('confirmPassword', v)}
          error={errors.confirmPassword}
        />
      )}
      {mode === 'register' ? (
        <Text style={[ui.body, { fontSize: 12 }]}>Dùng ít nhất 12 ký tự cho mật khẩu.</Text>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setForgot((v) => !v)}
          style={{ alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center', marginTop: -12 }}
        >
          <Text style={{ fontSize: 12, color: c.green, fontWeight: '600' }}>Quên mật khẩu?</Text>
        </Pressable>
      )}
      {forgot && (
        <Text accessibilityRole="alert" style={ui.body}>
          Khôi phục mật khẩu sẽ khả dụng khi tài khoản được kết nối.
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
      <Text style={{ color: c.muted, fontSize: 11, lineHeight: 17 }}>{APP_CONFIG.authNotice}</Text>
    </View>
  );
}
