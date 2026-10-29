import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { useDirtyFields } from '@/hooks/useDirtyFields';
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
  const dirty = useDirtyFields({ name, email, currentPassword, newPassword });
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
    <SheetTemplate title="Tài khoản của bạn" onClose={onClose} dirty={dirty} busy={busy}>
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
      <ConfirmActionButton
        label="Xóa tài khoản và toàn bộ dữ liệu"
        title="Xóa vĩnh viễn tài khoản?"
        description="Toàn bộ giao dịch, tài sản và kế hoạch sẽ bị xóa vĩnh viễn. Không thể hoàn tác. Hãy nhập mật khẩu hiện tại trước khi xác nhận."
        confirmLabel="Xóa vĩnh viễn"
        disabled={busy}
        onConfirm={async () => {
          if (!currentPassword) throw new Error('Nhập mật khẩu hiện tại để xác nhận.');
          setBusy(true);
          try {
            await auth.deleteUser(currentPassword);
            await forgetSession();
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      />
    </SheetTemplate>
  );
}
