import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { formatMoney } from '@/helpers/money';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { ui } from '@/theme/layout';
import { Text } from 'react-native';
export function TransactionAllocationFields({
  model,
}: {
  model: Pick<
    ReturnType<typeof useTransactionForm>,
    'kind' | 'amount' | 'state' | 'shares' | 'setShares' | 'setStage' | 'setError'
  >;
}) {
  const { kind, amount, state, shares, setShares, setStage, setError } = model;
  return (
    <>
      <>
        <Text style={ui.body}>
          {kind === 'expense' ? 'Giảm' : 'Tăng'} tổng cộng {formatMoney(Number(amount) || 0)} vào
          các nguồn dưới đây. Chỉ lưu khi phân bổ đủ.
        </Text>
        {state.assets.map((asset) => (
          <FormField
            key={asset.id}
            label={asset.name + ' (VND)'}
            value={shares[asset.id] ?? ''}
            onChangeText={(value) => setShares((total) => ({ ...total, [asset.id]: value }))}
            keyboardType="number-pad"
            placeholder="0"
          />
        ))}
        <Text style={ui.label}>
          Đã phân bổ:{' '}
          {formatMoney(
            Object.values(shares).reduce((total, value) => total + (Number(value) || 0), 0),
          )}
        </Text>
        <Button
          title="← Quay lại giao dịch"
          variant="text"
          onPress={() => {
            setStage('details');
            setError('');
          }}
        />
      </>
    </>
  );
}
