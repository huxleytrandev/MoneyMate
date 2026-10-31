import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { useNavigation, useRouter } from 'expo-router';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { Button } from '@/components/atoms/Button';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { TelegramConnectionCard } from '@/components/organisms/TelegramConnectionCard';
import { ProfileForm } from '@/components/organisms/ProfileForm';
import { PersonalProfileFields } from '@/components/organisms/PersonalProfileFields';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { ui } from '@/theme/layout';
export default function ProfileScreen() {
  const model = useUserProfile();
  const { session, logout } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [security, setSecurity] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [leaving, setLeaving] = useState(false);
  const disablePrevention = usePreventRemove(
    !leaving && !!session && (model.dirty || model.busy),
    ({ repeat }) => {
      if (!model.busy) setPending(() => repeat);
    },
  );
  return (
    <ScreenTemplate>
      <View style={ui.row}>
        <Text style={ui.title}>Hồ sơ tài khoản</Text>
        <Button
          title="Quay lại"
          variant="text"
          disabled={model.busy}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : router.replace('/home'))}
        />
      </View>
      <Text style={ui.body}>{session?.email}</Text>
      {model.loading ? <ActivityIndicator /> : <PersonalProfileFields model={model} />}
      {!!model.error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {model.error}
        </Text>
      )}
      {!model.loading && !model.profile && (
        <Button title="Tải lại hồ sơ" onPress={() => void model.reload()} />
      )}
      {!!model.message && (
        <Text accessibilityRole="alert" style={ui.body}>
          {model.message}
        </Text>
      )}
      <TelegramConnectionCard disabled={model.busy || model.dirty} />
      <View style={ui.card}>
        <Text style={ui.heading}>Tài khoản và bảo mật</Text>
        <Button
          title="Đổi email, mật khẩu và quản lý tài khoản"
          variant="secondary"
          disabled={model.busy || model.dirty || model.loading}
          onPress={() => setSecurity(true)}
        />
        <ConfirmActionButton
          label="Đăng xuất"
          title="Đăng xuất MoneyMate?"
          confirmLabel="Đăng xuất"
          description={
            model.dirty
              ? 'Các thông tin hồ sơ chưa lưu sẽ bị bỏ. Bạn có thể đăng nhập lại bất cứ lúc nào.'
              : 'Bạn có thể đăng nhập lại để tiếp tục quản lý tài chính.'
          }
          disabled={model.busy}
          onConfirm={async () => {
            setLeaving(true);
            disablePrevention();
            try {
              await logout();
            } catch (failure) {
              setLeaving(false);
              throw failure;
            }
          }}
        />
      </View>
      <ConfirmDialog
        visible={!!pending}
        title="Bỏ thay đổi hồ sơ?"
        description="Thông tin chưa lưu sẽ bị mất."
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục sửa"
        onDismiss={() => setPending(null)}
        onConfirm={() => {
          const repeat = pending;
          setPending(null);
          model.discard();
          setLeaving(true);
          disablePrevention();
          repeat?.();
        }}
      />
      {security && (
        <ProfileForm
          onClose={() => {
            setSecurity(false);
            void model.reload();
          }}
        />
      )}
    </ScreenTemplate>
  );
}
