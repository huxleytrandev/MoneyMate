import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { MoneyField } from '@/components/molecules/MoneyField';
import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { monthLabel } from '@/helpers/date';
import { useFinance } from '@/hooks/useFinance';
import { useMonthlyFinance } from '@/hooks/useMonthlyFinance';
import { useDirtyFields } from '@/hooks/useDirtyFields';
import { amountSchema } from '@/schemas/finance.schema';
import { ui } from '@/theme/layout';
import type { Category } from '@/types/finance.types';
export function PlanEditor({
  category,
  month,
  onClose,
}: {
  category: Category;
  month: string;
  onClose: () => void;
}) {
  const { savePlan, removeRecord, busy } = useFinance();
  const { state } = useMonthlyFinance(month);
  const [old] = useState(() =>
    state.plans.find((plan) => plan.categoryId === category.id && plan.month === month),
  );
  const [amount, setAmount] = useState(old ? String(old.amount) : '');
  const [error, setError] = useState('');
  const dirty = useDirtyFields({ amount });
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
      setError(failure instanceof Error ? failure.message : 'Không thể lưu kế hoạch.');
    }
  }
  async function removePlan() {
    if (!old?.id) return;
    await removeRecord('plans', old.id, old.version);
    onClose();
  }
  return (
    <SheetTemplate
      size="compact"
      title={'Kế hoạch · ' + category.name}
      onClose={onClose}
      dirty={dirty}
      busy={busy}
    >
      <Text style={ui.body}>
        {monthLabel(month)} · {category.kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
      </Text>
      <MoneyField
        label="Số tiền dự kiến"
        value={amount}
        onChangeText={setAmount}
        editable={!busy}
        hint="0 là chủ động đặt kế hoạch bằng 0. Xóa kế hoạch để trở về trạng thái chưa đặt."
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button title="Lưu kế hoạch tháng" onPress={() => void save()} loading={busy} />
      {old?.id && (
        <ConfirmActionButton
          label="Xóa kế hoạch tháng"
          title="Xóa kế hoạch này?"
          description="Giao dịch thực tế vẫn được giữ lại. Danh mục sẽ trở về trạng thái chưa đặt kế hoạch trong tháng này."
          disabled={busy}
          onConfirm={removePlan}
        />
      )}
    </SheetTemplate>
  );
}
