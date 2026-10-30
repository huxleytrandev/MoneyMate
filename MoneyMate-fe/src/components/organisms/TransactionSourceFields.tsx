import { Pressable, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import { assetBalance } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { useSheetBusy } from '@/hooks/useSheetBusy';
import type { useTransactionForm } from '@/hooks/useTransactionForm';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
const sourceOptions = [
  { type: 'cash', label: 'Tiền mặt', icon: 'cash-outline' },
  { type: 'bank', label: 'Ngân hàng', icon: 'card-outline' },
  { type: 'other', label: 'Khác', icon: 'layers-outline' },
] as const;
export function TransactionSourceFields({
  model,
}: {
  model: ReturnType<typeof useTransactionForm>;
}) {
  const busy = useSheetBusy();
  const isCash = model.sourceType === 'cash';
  const selected = model.sources.find((asset) => asset.id === model.source);
  return (
    <View style={{ gap: 14 }}>
      <Text style={ui.heading}>
        {model.kind === 'expense' ? 'Thanh toán từ đâu?' : 'Nhận tiền vào đâu?'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {sourceOptions.map((option) => {
          const active = model.allocationMode === 'source' && model.sourceType === option.type;
          return (
            <Pressable
              key={option.type}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active, disabled: busy }}
              disabled={busy}
              onPress={() => model.setSourceType(option.type)}
              style={{
                flex: 1,
                gap: 9,
                alignItems: 'center',
                paddingVertical: 18,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: active ? colors.green : colors.border,
                backgroundColor: active ? colors.softGreen : colors.surface,
              }}
            >
              <Ionicons name={option.icon} size={26} color={active ? colors.green : colors.muted} />
              <Text
                style={{
                  color: active ? colors.green : colors.ink,
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {model.allocationMode === 'source' && (
        <>
          {!model.sources.length && (
            <Text style={ui.error}>
              Chưa có nguồn tiền này. Hãy thêm tại màn hình Tài sản hoặc chọn loại khác.
            </Text>
          )}
          {!isCash &&
            model.sources.length > 1 &&
            model.sources.map((asset) => (
              <Pressable
                key={asset.id}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={'Chọn ' + asset.name}
                accessibilityState={{ selected: model.source === asset.id, disabled: busy }}
                onPress={() => model.setSource(asset.id)}
                style={[
                  ui.card,
                  {
                    padding: 16,
                    borderColor: model.source === asset.id ? colors.green : colors.border,
                  },
                ]}
              >
                <View style={ui.row}>
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={{ color: colors.ink, fontWeight: '700' }}>{asset.name}</Text>
                    <Text style={ui.body}>{formatMoney(assetBalance(model.state, asset.id))}</Text>
                  </View>
                  <Ionicons
                    name={model.source === asset.id ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={colors.green}
                  />
                </View>
              </Pressable>
            ))}
          {!!model.sources.length && (isCash || model.sources.length === 1) && (
            <View style={ui.note}>
              <Text style={{ color: colors.green, fontWeight: '700' }}>
                {isCash
                  ? (selected?.name ?? 'Tiền mặt') + ' · đã chọn'
                  : selected?.name + ' · tự động chọn'}
              </Text>
              <Text style={ui.body}>
                {formatMoney(
                  (selected ? [selected] : model.sources).reduce(
                    (total, asset) => total + assetBalance(model.state, asset.id),
                    0,
                  ),
                )}
              </Text>
              {isCash && !selected && model.sources.length > 1 && (
                <Text style={ui.body}>
                  {model.kind === 'expense'
                    ? 'Tự phân bổ theo số dư từng ví; phần thiếu ghi vào ví đầu tiên.'
                    : 'Thu nhập được cộng vào ví tiền mặt đầu tiên: ' + model.sources[0].name}
                  . Bạn có thể chọn phân bổ thủ công bên dưới.
                </Text>
              )}
            </View>
          )}
        </>
      )}
      <Button
        title={
          model.allocationMode === 'split' ? 'Đang chọn phân bổ nhiều nguồn' : 'Phân bổ nhiều nguồn'
        }
        variant="text"
        onPress={() => {
          model.setAllocationMode('split');
          model.setError('');
        }}
      />
      {model.allocationMode === 'split' && (
        <Text style={ui.body}>Bấm tiếp tục để phân bổ chính xác số tiền cho từng tài sản.</Text>
      )}
    </View>
  );
}
