import { formatMoney } from '@/helpers/money';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Text, TextInput, View } from 'react-native';
export function TransactionAmountField({
  model,
}: {
  model: Pick<ReturnType<typeof useTransactionForm>, 'kind' | 'amount' | 'setAmount'>;
}) {
  const { kind, amount, setAmount } = model;
  return (
    <>
      <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
        <Text style={ui.body}>
          {kind === 'expense' ? 'Số tiền chi tiêu' : 'Số tiền thu nhập'} · VNĐ
        </Text>
        <TextInput
          accessibilityLabel="Số tiền (VND)"
          placeholder="0"
          placeholderTextColor={colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          style={{
            color: colors.ink,
            fontSize: 40,
            fontWeight: '700',
            textAlign: 'center',
            width: '100%',
            minHeight: 58,
          }}
        />
        <Text style={{ fontSize: 12, color: colors.green }}>
          {formatMoney(Number(amount) || 0)}
        </Text>
      </View>
    </>
  );
}
