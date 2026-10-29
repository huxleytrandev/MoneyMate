import { useSheetBusy } from '@/hooks/useSheetBusy';
import type { TextInputProps } from 'react-native';
import CurrencyInput from 'react-native-currency-input';
export interface MoneyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (raw: string) => void;
  sign?: 'positive' | 'signed';
}
export function MoneyInput({ value, onChangeText, sign = 'positive', ...props }: MoneyInputProps) {
  const busy = useSheetBusy();
  const number = value === '' || value === '-' ? null : Number(value);
  return (
    <CurrencyInput
      {...props}
      editable={props.editable !== false && !busy}
      value={number !== null && Number.isFinite(number) ? number : null}
      onChangeValue={(next) => {
        if (next !== null && (!Number.isSafeInteger(next) || (sign === 'positive' && next < 0)))
          return;
        onChangeText(next === null ? '' : String(next));
      }}
      delimiter="."
      separator=","
      precision={0}
      minValue={sign === 'positive' ? 0 : -Number.MAX_SAFE_INTEGER}
      maxValue={Number.MAX_SAFE_INTEGER}
      keyboardType={sign === 'signed' ? 'numbers-and-punctuation' : 'number-pad'}
    />
  );
}
