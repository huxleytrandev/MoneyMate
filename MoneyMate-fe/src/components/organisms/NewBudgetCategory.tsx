import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { monthLabel } from '@/helpers/date';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema, categorySchema } from '@/schemas/finance.schema';
import { ui } from '@/theme/layout';
import type { TransactionKind } from '@/types/finance.types';

export function NewBudgetCategory({
  kind,
  month,
  onClose,
}: {
  kind: TransactionKind;
  month: string;
  onClose: () => void;
}) {
  const { state, addCategory, savePlan } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  async function save() {
    const categoryResult = categorySchema.safeParse({ name, kind });
    const amountResult = amountSchema.safeParse(amount);
    if (!categoryResult.success) {
      setError(categoryResult.error.issues[0].message);
      return;
    }
    if (!amountResult.success) {
      setError(amountResult.error.issues[0].message);
      return;
    }
    if (
      state.categories.some(
        (category) =>
          category.kind === kind &&
          category.name.toLocaleLowerCase('vi') ===
            categoryResult.data.name.toLocaleLowerCase('vi'),
      )
    ) {
      setError('Danh mục này đã có. Hãy chỉnh sửa kế hoạch trong danh sách.');
      return;
    }
    const category = { id: createId(), ...categoryResult.data };
    try {
      const created = await addCategory(category);
      await savePlan(created.id, month, amountResult.data);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    }
  }
  return (
    <SheetTemplate title="Thêm danh mục" onClose={onClose}>
      <Text style={ui.body}>
        {kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'} · {monthLabel(month)}
      </Text>
      <FormField
        label="Tên danh mục"
        placeholder={kind === 'expense' ? 'Ví dụ: Mua sắm' : 'Ví dụ: Thưởng'}
        value={name}
        onChangeText={setName}
      />
      <FormField
        label="Kế hoạch tháng (VNĐ)"
        placeholder="Ví dụ: 1000000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        hint="Nhập 0 nếu bạn chủ động đặt kế hoạch bằng 0."
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button title="Lưu danh mục và kế hoạch" onPress={() => void save()} />
    </SheetTemplate>
  );
}
