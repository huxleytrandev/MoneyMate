import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button as PaperButton, Dialog, Portal } from 'react-native-paper';
import { TimePicker } from 'react-native-paper-dates';
import { selectedTime } from '@/helpers/date-selection';
import { useSheetBusy } from '@/hooks/useSheetBusy';
import { ui } from '@/theme/layout';
export function TimeSelectField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [focused, setFocused] = useState<'hours' | 'minutes'>('hours');
  const [error, setError] = useState('');
  const busy = useSheetBusy();
  function open() {
    const [hour, minute] = value.split(':').map(Number);
    setHours(Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 0);
    setMinutes(Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0);
    setFocused('hours');
    setError('');
    setVisible(true);
  }
  function confirm() {
    const result = selectedTime({ hours, minutes });
    if (!result) {
      setError('Giờ hoặc phút không hợp lệ.');
      return;
    }
    onChange(result);
    setVisible(false);
  }
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>Giờ phát sinh</Text>
      <PaperButton
        icon="clock-outline"
        mode="outlined"
        disabled={disabled || busy}
        onPress={open}
        contentStyle={{ minHeight: 52 }}
        accessibilityLabel={'Chọn giờ: ' + value}
      >
        {value || 'Chọn giờ'}
      </PaperButton>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={() => setVisible(false)}
          style={{ width: '94%', maxWidth: 440, alignSelf: 'center' }}
        >
          <Dialog.Title>Chọn giờ</Dialog.Title>
          <TimePicker
            locale="vi"
            hours={hours}
            minutes={minutes}
            inputType="picker"
            focused={focused}
            onFocusInput={setFocused}
            use24HourClock
            onChange={(selection) => {
              setHours(selection.hours);
              setMinutes(selection.minutes);
              if (selection.focused) setFocused(selection.focused);
            }}
          />
          {!!error && (
            <Dialog.Content>
              <Text style={ui.error}>{error}</Text>
            </Dialog.Content>
          )}
          <Dialog.Actions>
            <PaperButton onPress={() => setVisible(false)}>Hủy</PaperButton>
            <PaperButton onPress={confirm}>Chọn</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
