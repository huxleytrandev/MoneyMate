import { Chip } from '@/components/atoms/Chip';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { View } from 'react-native';
export function TransactionKindFields({
  model,
}: {
  model: Pick<
    ReturnType<typeof useTransactionForm>,
    'kind' | 'setKind' | 'setCategory' | 'setError'
  >;
}) {
  const { kind, setKind, setCategory, setError } = model;
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="Chi tiêu"
          selected={kind === 'expense'}
          onPress={() => {
            if (kind === 'expense') return;
            setKind('expense');
            setCategory('');
            setError('');
          }}
        />
        <Chip
          label="Thu nhập"
          selected={kind === 'income'}
          onPress={() => {
            if (kind === 'income') return;
            setKind('income');
            setCategory('');
            setError('');
          }}
        />
      </View>
    </>
  );
}
