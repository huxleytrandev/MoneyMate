import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { useDirtyFields } from '@/hooks/useDirtyFields';
import { MoneyField } from '@/components/molecules/MoneyField';
import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { FormField } from '@/components/molecules/FormField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { dateKey, localDateTime, timeKey } from '@/helpers/date';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema } from '@/schemas/finance.schema';
import { ui } from '@/theme/layout';
import type { Transfer } from '@/types/finance.types';
import { useState } from 'react';
import { Text, View } from 'react-native';
export function TransferForm({ onClose, transfer }: { onClose: () => void; transfer?: Transfer }) {
  const { state, saveTransfer, busy, removeRecord } = useFinance();
  const [id] = useState(() => transfer?.id ?? createId());
  const [from, setFrom] = useState(transfer?.fromAssetId ?? '');
  const [to, setTo] = useState(transfer?.toAssetId ?? '');
  const [amount, setAmount] = useState(transfer ? String(transfer.amount) : '');
  const [note, setNote] = useState(transfer?.note ?? '');
  const [date, setDate] = useState(() => dateKey(new Date(transfer?.occurredAt ?? Date.now())));
  const [time, setTime] = useState(() => timeKey(new Date(transfer?.occurredAt ?? Date.now())));
  const [error, setError] = useState('');
  const dirty = useDirtyFields({ from, to, amount, note, date, time });
  async function save() {
    const parsed = amountSchema.safeParse(amount);
    const occurredAt = localDateTime(date, time);
    if (!parsed.success || parsed.data <= 0 || !from || !to || from === to || !occurredAt) {
      setError('Chọn hai nguồn khác nhau, số tiền dương và ngày giờ hợp lệ.');
      return;
    }
    try {
      await saveTransfer({
        id,
        fromAssetId: from,
        toAssetId: to,
        amount: parsed.data,
        note,
        occurredAt,
        version: transfer?.version,
      });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể chuyển tiền.');
    }
  }
  return (
    <SheetTemplate
      title={transfer ? 'Sửa chuyển tiền' : 'Chuyển tiền nội bộ'}
      onClose={onClose}
      dirty={dirty}
      busy={busy}
    >
      <Text style={ui.body}>
        Chỉ ghi nhận chuyển giữa các tài sản của bạn, không thực hiện chuyển tiền ngân hàng và không
        tính vào thu nhập hoặc chi tiêu.
      </Text>
      <MoneyField label="Số tiền (VNĐ)" value={amount} onChangeText={setAmount} />
      <Text style={ui.heading}>Từ nguồn</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {state.assets
          .filter((asset) => !asset.isArchived)
          .map((asset) => (
            <Chip
              key={asset.id}
              label={asset.name}
              selected={from === asset.id}
              onPress={() => setFrom(asset.id)}
            />
          ))}
      </View>
      <Text style={ui.heading}>Đến nguồn</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {state.assets
          .filter((asset) => !asset.isArchived)
          .map((asset) => (
            <Chip
              key={asset.id}
              label={asset.name}
              selected={to === asset.id}
              onPress={() => setTo(asset.id)}
            />
          ))}
      </View>
      <FormField label="Ngày (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <FormField label="Giờ (HH:mm)" value={time} onChangeText={setTime} />
      <FormField label="Ghi chú" value={note} onChangeText={setNote} />
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button title="Lưu chuyển tiền" onPress={() => void save()} loading={busy} />
      {transfer && (
        <ConfirmActionButton
          label="Xóa chuyển tiền"
          title="Xóa lần chuyển tiền này?"
          description="Số dư của cả hai nguồn sẽ được tính lại. Thao tác này không phải chuyển tiền ngân hàng."
          disabled={busy}
          onConfirm={async () => {
            await removeRecord('transfers', transfer.id, transfer.version);
            onClose();
          }}
        />
      )}
    </SheetTemplate>
  );
}
