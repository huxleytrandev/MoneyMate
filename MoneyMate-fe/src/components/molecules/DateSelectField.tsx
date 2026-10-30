import '@/configs/calendar.config';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { calendarKey, calendarValue } from '@/helpers/date-selection';
import { useSheetBusy } from '@/hooks/useSheetBusy';
import { ui } from '@/theme/layout';
export function DateSelectField({
  label,
  value,
  onChange,
  minimum = '1900-01-01',
  maximum,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimum?: string;
  maximum?: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const busy = useSheetBusy();
  function confirm({ date }: { date?: Date }) {
    const selected = date ? calendarKey(date) : '';
    if (!calendarValue(selected) || selected < minimum || (maximum && selected > maximum)) {
      setError('Ngày được chọn không hợp lệ.');
      return;
    }
    onChange(selected);
    setError('');
    setVisible(false);
  }
  const selected = calendarValue(value);
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>{label}</Text>
      <PaperButton
        mode="outlined"
        icon="calendar-month-outline"
        disabled={disabled || busy}
        onPress={() => setVisible(true)}
        contentStyle={{ minHeight: 52 }}
        accessibilityLabel={label + ': ' + (value || 'Chưa chọn')}
      >
        {selected ? value.split('-').reverse().join('/') : 'Chọn ngày'}
      </PaperButton>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {visible && (
        <DatePickerModal
          locale="vi"
          mode="single"
          visible
          date={selected}
          onDismiss={() => setVisible(false)}
          onConfirm={confirm}
          allowEditing={false}
          validRange={{
            startDate: calendarValue(minimum),
            endDate: maximum ? calendarValue(maximum) : undefined,
          }}
        />
      )}
    </View>
  );
}
