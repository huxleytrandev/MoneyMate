import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { formatMoney } from '@/helpers/money';
import { formatDateTime } from '@/helpers/date';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Adjustment } from '@/types/finance.types';
import type { useAssetAdjustmentHistory } from '@/hooks/useAssetAdjustmentHistory';
interface HistoryProps {
  history: ReturnType<typeof useAssetAdjustmentHistory>;
  busy: boolean;
  onUndo: (adjustment: Adjustment) => void;
}
export function AssetAdjustmentHistory({ history, busy, onUndo }: HistoryProps) {
  if (history.loading)
    return (
      <ActivityIndicator accessibilityLabel="Đang tải lịch sử điều chỉnh" color={colors.green} />
    );
  if (history.error)
    return (
      <View style={{ gap: 10 }}>
        <Text accessibilityRole="alert" style={ui.error}>
          {history.error}
        </Text>
        <Button title="Thử tải lịch sử lại" variant="text" onPress={history.retry} />
      </View>
    );
  return (
    <View style={{ gap: 12 }}>
      {history.records.length === 0 && (
        <Text style={ui.body}>Tài sản này chưa có điều chỉnh nào.</Text>
      )}
      {history.records.map((adjustment) => (
        <View key={adjustment.id} style={ui.card}>
          <Text>
            {formatMoney(adjustment.delta)} · {formatDateTime(adjustment.occurredAt)}
          </Text>
          <Button
            title="Hoàn tác điều chỉnh này"
            variant="text"
            disabled={busy}
            onPress={() => onUndo(adjustment)}
          />
        </View>
      ))}
      {history.total > 0 && (
        <>
          <Text style={ui.body}>
            Trang {history.page}/{history.pageCount} · {history.total} điều chỉnh
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Trang trước"
                variant="text"
                disabled={busy || !history.hasPrevious}
                onPress={history.previous}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Trang sau"
                variant="text"
                disabled={busy || !history.hasNext}
                onPress={history.next}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}
