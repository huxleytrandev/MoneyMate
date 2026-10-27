import { Chip } from '@/components/atoms/Chip';
import { ASSET_OPTIONS } from '@/constants/finance';
import { assetBalance } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Text, View } from 'react-native';
export function TransactionSourceFields({
  model,
}: {
  model: Pick<
    ReturnType<typeof useTransactionForm>,
    'kind' | 'sourceType' | 'setSourceType' | 'setSource' | 'state' | 'source'
  >;
}) {
  const { kind, sourceType, setSourceType, setSource, state, source } = model;
  return (
    <>
      <Text style={ui.heading}>
        {kind === 'expense' ? 'Thanh toán từ đâu?' : 'Nhận tiền vào đâu?'}
      </Text>
      <Text style={ui.body}>
        Chọn tiền mặt hoặc tài khoản cụ thể. Bỏ qua để chia nhiều nguồn ở bước tiếp theo.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {ASSET_OPTIONS.map((group) => (
          <Chip
            key={group.type}
            label={group.label}
            selected={sourceType === group.type}
            onPress={() => {
              setSourceType(group.type);
              setSource('');
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {state.assets
          .filter((asset) => asset.type === sourceType && !asset.isArchived)
          .map((asset) => (
            <Chip
              key={asset.id}
              label={
                (asset.type === 'cash'
                  ? 'Tiền mặt · '
                  : asset.type === 'bank'
                    ? 'Chuyển khoản · '
                    : 'Khác · ') + asset.name
              }
              selected={source === asset.id}
              onPress={() => setSource(source === asset.id ? '' : asset.id)}
            />
          ))}
      </View>
      {!!source && (
        <View style={ui.note}>
          <Text style={{ fontSize: 11, color: colors.muted }}>Số dư hiện tại</Text>
          <Text style={{ fontSize: 17, color: colors.green, fontWeight: '700', marginTop: 5 }}>
            {formatMoney(assetBalance(state, source))}
          </Text>
        </View>
      )}
    </>
  );
}
