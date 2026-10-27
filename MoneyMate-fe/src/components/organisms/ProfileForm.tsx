import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { useAuth } from '@/hooks/useAuth';
import * as auth from '@/services/auth.service';
import { ui } from '@/theme/layout';
import { useState } from 'react';
import { Text } from 'react-native';
export function ProfileForm({ onClose }: { onClose: () => void }) {
  const { session, updateSession, forgetSession } = useAuth();
  const [name, setName] = useState(session?.displayName ?? '');
  const [email, setEmail] = useState(session?.email ?? '');
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const body = {
        displayName: name,
        ...(email !== session?.email ? { email } : {}),
        ...(newPassword ? { newPassword } : {}),
        ...(currentPassword ? { currentPassword } : {}),
      };
      const result = await auth.updateUser(body);
      if (result.requiresLogin) {
        await forgetSession();
      } else updateSession(result.user);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    } finally {
      setBusy(false);
      setCurrent('');
      setNew('');
    }
  }
  return (
    <SheetTemplate title="Tài khoản của bạn" onClose={onClose}>
      <FormField label="Họ và tên" value={name} onChangeText={setName} />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrent} />
      <PasswordField
        label="Mật khẩu mới (nếu muốn đổi)"
        value={newPassword}
        onChangeText={setNew}
      />
      <Text style={ui.body}>
        Cần mật khẩu hiện tại để đổi email, mật khẩu hoặc xóa tài khoản. Đổi mật khẩu sẽ kết thúc
        các phiên đăng nhập.
      </Text>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button title="Lưu thông tin tài khoản" onPress={() => void save()} loading={busy} />
      <Button
        title={confirm ? 'Xác nhận xóa vĩnh viễn tài khoản' : 'Xóa tài khoản và toàn bộ dữ liệu'}
        variant="text"
        disabled={busy}
        onPress={() => {
          if (!confirm) {
            setConfirm(true);
            return;
          }
          if (!currentPassword) {
            setError('Nhập mật khẩu hiện tại để xác nhận.');
            return;
          }
          setBusy(true);
          void auth
            .deleteUser(currentPassword)
            .then(() => forgetSession())
            .then(onClose)
            .catch((failure) => setError(failure.message))
            .finally(() => setBusy(false));
        }}
      />
      {confirm && (
        <Text style={ui.error}>
          Xóa tài khoản sẽ xóa vĩnh viễn toàn bộ dữ liệu thu chi và tài sản của bạn.
        </Text>
      )}
    </SheetTemplate>
  );
}
