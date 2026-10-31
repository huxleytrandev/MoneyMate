import { ActivityIndicator, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/atoms/Button';
import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { useTelegramLink } from '@/hooks/useTelegramLink';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
export function TelegramConnectionCard({ disabled = false }: { disabled?: boolean }) {
  const model = useTelegramLink();
  const candidate = model.status?.request?.candidate;
  return (
    <View style={ui.card}>
      <View style={ui.row}>
        <Ionicons name="paper-plane-outline" size={25} color={colors.green} />
        <Text style={[ui.heading, { flex: 1 }]}>Telegram MoneyMate</Text>
      </View>
      <Text style={ui.body}>
        Ghi thu chi, quản lý tài sản, kế hoạch và xem báo cáo bằng chat. Bot chỉ được truy cập sau
        khi bạn xác nhận đúng danh tính tại đây.
      </Text>
      {model.loading && <ActivityIndicator />}
      {!!model.error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {model.error}
        </Text>
      )}
      {!model.loading && !model.status && (
        <Button title="Thử lại" onPress={() => void model.refresh()} />
      )}
      {model.status && !model.status.enabled && (
        <Text style={ui.body}>Kết nối Telegram hiện chưa sẵn sàng. Vui lòng thử lại sau.</Text>
      )}
      {model.status?.link && (
        <View style={ui.note}>
          <Text style={ui.heading}>Đã liên kết</Text>
          <Text style={ui.body}>
            {model.status.link.displayName}
            {model.status.link.username ? ' · @' + model.status.link.username : ''}
          </Text>
          <Text style={ui.body}>Telegram ID: {model.status.link.telegramUserId}</Text>
        </View>
      )}
      {!!candidate && (
        <View style={{ gap: 12 }}>
          <Text style={ui.body}>
            Telegram đang yêu cầu liên kết: {candidate.displayName}
            {candidate.username ? ' (@' + candidate.username + ')' : ''} · ID{' '}
            {candidate.telegramUserId}. Chỉ xác nhận nếu đây là tài khoản của bạn.
          </Text>
          <ConfirmActionButton
            label="Xác nhận đúng tài khoản Telegram"
            title="Cấp quyền cho Telegram này?"
            confirmLabel="Đồng ý liên kết"
            description={
              'Telegram ID ' +
              candidate.telegramUserId +
              ' sẽ được đọc và thêm/sửa/xóa dữ liệu tài chính, cập nhật hồ sơ qua bot. Liên kết cũ (nếu có) sẽ bị thay thế. Mỗi thao tác ghi trên bot vẫn cần xác nhận.'
            }
            disabled={disabled || model.busy}
            onConfirm={model.confirm}
          />
        </View>
      )}
      {!!model.url && (
        <Button
          title="Mở bot trên Telegram"
          disabled={disabled || model.busy}
          onPress={() => void model.open()}
        />
      )}
      {model.status?.enabled && (
        <Button
          title={model.status.link ? 'Tạo liên kết Telegram mới' : 'Bắt đầu liên kết Telegram'}
          variant="secondary"
          loading={model.busy}
          disabled={disabled}
          onPress={() => void model.request().catch(() => {})}
        />
      )}
      {!!model.status?.request && !candidate && (
        <Text style={ui.body}>
          Mở bot, nhấn Start rồi quay lại trang này. Yêu cầu có hiệu lực 10 phút; trạng thái tự cập
          nhật.
        </Text>
      )}
      {(model.status?.link || model.status?.request) && (
        <ConfirmActionButton
          label="Hủy liên kết / yêu cầu Telegram"
          title="Ngắt Telegram khỏi MoneyMate?"
          confirmLabel="Ngắt kết nối"
          description="Bot sẽ mất quyền truy cập. Dữ liệu tài chính đã lưu vẫn được giữ. Các yêu cầu chưa xác nhận sẽ không còn hiệu lực."
          disabled={disabled || model.busy}
          onConfirm={model.revoke}
        />
      )}
    </View>
  );
}
