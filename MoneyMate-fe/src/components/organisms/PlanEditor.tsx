import { monthLabel } from '@/helpers/date';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema } from '@/schemas/finance.schema';
import { ui } from '@/theme/layout';
import type { Category } from '@/types/finance.types';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '../atoms/Button';
import { FormField } from '../molecules/FormField';
import { SheetTemplate } from '../templates/SheetTemplate';
export function PlanEditor({
  category,
  month,
  onClose,
}: {
  category: Category;
  month: string;
  onClose: () => void;
}) {
  const { state, savePlan, removeRecord, busy } = useFinance();
  const [old] = useState(() =>
    state.plans.find((plan) => plan.categoryId === category.id && plan.month === month),
  );
  const [amount, setAmount] = useState(old ? String(old.amount) : '');
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  async function save() {
    const result = amountSchema.safeParse(amount);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    try {
      await savePlan(category.id, month, result.data, old?.version ?? null);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    }
  }
  return (
    <SheetTemplate title={'Kế hoạch · ' + category.name} onClose={onClose}>
      <Text style={ui.body}>
        {monthLabel(month)} · {category.kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
      </Text>
      <FormField
        label="Planned (VND)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        hint="0 là chủ động đặt kế hoạch bằng 0. Xóa kế hoạch để trở về trạng thái chưa đặt."
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button title="Lưu kế hoạch tháng" onPress={() => void save()} loading={busy} />
      {old?.id && (
        <Button
          title={confirm ? 'Xác nhận xóa kế hoạch' : 'Xóa kế hoạch tháng'}
          variant="text"
          disabled={busy}
          onPress={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            void removeRecord('plans', old.id!, old.version)
              .then(onClose)
              .catch((failure) => setError(failure.message));
          }}
        />
      )}
    </SheetTemplate>
  );
}
