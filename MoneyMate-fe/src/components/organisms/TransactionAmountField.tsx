import { Text, View } from 'react-native';
import { MoneyInput } from '@/components/atoms/MoneyInput';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { useTransactionForm } from '@/hooks/useTransactionForm';
export function TransactionAmountField({
  model,
}: {
  model: Pick<ReturnType<typeof useTransactionForm>, 'kind' | 'amount' | 'setAmount'>;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
      <Text style={ui.body}>
        {model.kind === 'expense' ? 'Bạn đã chi bao nhiêu?' : 'Bạn nhận được bao nhiêu?'}
      </Text>
      <MoneyInput
        accessibilityLabel="Số tiền (VNĐ)"
        placeholder="0"
        placeholderTextColor={colors.muted}
        value={model.amount}
        onChangeText={model.setAmount}
        style={{
          color: colors.ink,
          fontSize: 40,
          fontWeight: '700',
          textAlign: 'center',
          width: '100%',
          minHeight: 62,
        }}
      />
      <Text style={{ fontSize: 12, color: colors.green }}>VNĐ · tự động phân cách hàng nghìn</Text>
    </View>
  );
}
