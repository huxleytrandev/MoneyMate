import { View } from 'react-native';
import { DateSelectField } from '@/components/molecules/DateSelectField';
import { TimeSelectField } from '@/components/molecules/TimeSelectField';
import { dateKey } from '@/helpers/date';
import type { useTransactionForm } from '@/hooks/useTransactionForm';
export function TransactionDateFields({
  model,
}: {
  model: Pick<ReturnType<typeof useTransactionForm>, 'date' | 'setDate' | 'time' | 'setTime'>;
}) {
  return (
    <View style={{ gap: 14 }}>
      <DateSelectField
        label="Ngày phát sinh"
        value={model.date}
        onChange={model.setDate}
        maximum={dateKey(new Date())}
      />
      <TimeSelectField value={model.time} onChange={model.setTime} />
    </View>
  );
}
