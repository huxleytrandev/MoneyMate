import { FormField } from '@/components/molecules/FormField';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { ui } from '@/theme/layout';
import { View } from 'react-native';
export function TransactionDateFields({
  model,
}: {
  model: Pick<ReturnType<typeof useTransactionForm>, 'date' | 'setDate' | 'time' | 'setTime'>;
}) {
  const { date, setDate, time, setTime } = model;
  return (
    <>
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <FormField label="Ngày (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        </View>
        <View style={{ width: 100 }}>
          <FormField label="Giờ (HH:mm)" value={time} onChangeText={setTime} />
        </View>
      </View>
    </>
  );
}
