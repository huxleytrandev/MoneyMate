import { useState } from 'react';
import { Text } from 'react-native';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema } from '@/schemas/finance.schema';
import type { Category } from '@/types/finance.types';
import { SheetTemplate } from '../templates/SheetTemplate';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { monthLabel } from '@/helpers/date';
import { ui } from '@/theme/layout';
export function PlanEditor({
  category,
  month,
  onClose,
}: {
  category: Category;
  month: string;
  onClose: () => void;
}) {
  const { state, savePlan } = useFinance();
  const existing = state.plans.find((p) => p.categoryId === category.id && p.month === month);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [error, setError] = useState('');
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
        hint="0 là chủ động đặt kế hoạch bằng 0; chưa nhập nghĩa là chưa có kế hoạch."
      />
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button
        title="Lưu kế hoạch tháng"
        onPress={() => {
          const r = amountSchema.safeParse(amount);
          if (!r.success) {
            setError(r.error.issues[0].message);
            return;
          }
          savePlan(category.id, month, r.data);
          onClose();
        }}
      />
    </SheetTemplate>
  );
}
