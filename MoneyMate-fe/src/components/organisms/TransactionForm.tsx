import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { ui } from '@/theme/layout';
import { Text } from 'react-native';
import { TransactionAllocationFields } from './TransactionAllocationFields';
import { TransactionAmountField } from './TransactionAmountField';
import { TransactionCategoryFields } from './TransactionCategoryFields';
import { TransactionDateFields } from './TransactionDateFields';
import { TransactionKindFields } from './TransactionKindFields';
import { TransactionSourceFields } from './TransactionSourceFields';
export function TransactionForm(props: Parameters<typeof useTransactionForm>[0]) {
  const form = useTransactionForm(props);
  const transaction = form.transaction;
  return (
    <SheetTemplate
      title={
        form.stage === 'details'
          ? transaction
            ? 'Sửa giao dịch'
            : 'Thêm giao dịch'
          : 'Phân bổ tài sản'
      }
      onClose={form.onClose}
    >
      {form.stage === 'details' ? (
        <>
          <TransactionKindFields model={form} />
          <TransactionAmountField model={form} />
          <FormField
            label="Tên giao dịch"
            placeholder="Ví dụ: Ăn trưa"
            value={form.title}
            onChangeText={form.setTitle}
          />

          <TransactionDateFields model={form} />
          <TransactionCategoryFields model={form} />
          <TransactionSourceFields model={form} />
        </>
      ) : (
        <TransactionAllocationFields model={form} />
      )}
      {!!form.error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {form.error}
        </Text>
      )}
      <Button
        title={
          form.stage === 'allocation'
            ? 'Xác nhận phân bổ và lưu'
            : form.source
              ? 'Lưu giao dịch'
              : 'Tiếp tục phân bổ tài sản'
        }
        loading={form.busy}
        onPress={form.stage === 'allocation' ? form.submitAllocation : form.submitDetails}
      />
      {transaction && (
        <Button
          title={form.confirmDelete ? 'Xác nhận xóa giao dịch' : 'Xóa giao dịch'}
          variant="text"
          disabled={form.busy}
          onPress={() => {
            if (!form.confirmDelete) {
              form.setConfirmDelete(true);
              return;
            }
            void form
              .removeRecord('transactions', transaction.id, transaction.version)
              .then(form.onClose)
              .catch((failure) => form.setError(failure.message));
          }}
        />
      )}
    </SheetTemplate>
  );
}
