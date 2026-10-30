import { useState } from 'react';
import { Text } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { MoneyField } from '@/components/molecules/MoneyField';
import { CategoryAppearancePicker } from '@/components/molecules/CategoryAppearancePicker';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { monthLabel } from '@/helpers/date';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { useDirtyFields } from '@/hooks/useDirtyFields';
import { amountSchema, categorySchema } from '@/schemas/finance.schema';
import { ui } from '@/theme/layout';
import type { Category, TransactionKind } from '@/types/finance.types';
export function NewBudgetCategory({
  kind,
  month,
  onClose,
}: {
  kind: TransactionKind;
  month: string;
  onClose: () => void;
}) {
  const { addCategory, savePlan, busy } = useFinance();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(kind === 'expense' ? 'receipt' : 'wallet');
  const [color, setColor] = useState('#0F766E');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Category | null>(null);
  const [id] = useState(createId);
  const dirty = useDirtyFields({ name, icon, color, amount });
  async function save() {
    const categoryResult = categorySchema.safeParse({ name, kind, icon, color });
    const amountResult = amountSchema.safeParse(amount);
    if (!categoryResult.success) {
      setError(categoryResult.error.issues[0].message);
      return;
    }
    if (!amountResult.success) {
      setError(amountResult.error.issues[0].message);
      return;
    }
    setError('');
    try {
      const category = created ?? (await addCategory({ id, ...categoryResult.data }));
      setCreated(category);
      await savePlan(category.id, month, amountResult.data);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    }
  }
  return (
    <SheetTemplate title="Thêm danh mục" onClose={onClose} dirty={dirty} busy={busy}>
      <Text style={ui.body}>
        {kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'} · {monthLabel(month)}
      </Text>
      <FormField
        label="Tên danh mục"
        placeholder={kind === 'expense' ? 'Ví dụ: Mua sắm' : 'Ví dụ: Tiền thưởng'}
        value={name}
        onChangeText={setName}
        editable={!busy && !created}
      />
      {!created && (
        <CategoryAppearancePicker
          kind={kind}
          icon={icon}
          color={color}
          onIconChange={setIcon}
          onColorChange={setColor}
        />
      )}
      {created && (
        <Text style={ui.body}>
          Danh mục đã được tạo. Bạn có thể lưu lại kế hoạch nếu bước trước chưa hoàn tất.
        </Text>
      )}
      <MoneyField
        label="Kế hoạch tháng"
        value={amount}
        onChangeText={setAmount}
        hint="Nhập 0 nếu bạn chủ động đặt kế hoạch bằng 0."
        editable={!busy}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button
        title={created ? 'Lưu kế hoạch' : 'Lưu danh mục và kế hoạch'}
        onPress={() => void save()}
        loading={busy}
      />
    </SheetTemplate>
  );
}
