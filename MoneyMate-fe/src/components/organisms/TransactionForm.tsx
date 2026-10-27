import { createDemoId } from '@/helpers/id';
import { useState } from 'react';
import { Text, View, TextInput } from 'react-native';
import { colors as c } from '@/theme/colors';
import { assetBalance } from '@/helpers/finance';
import { useFinance } from '@/hooks/useFinance';
import { transactionSchema, categorySchema } from '@/schemas/finance.schema';
import { dateKey, timeKey, localDateTime } from '@/helpers/date';
import { formatMoney } from '@/helpers/money';
import { SheetTemplate } from '../templates/SheetTemplate';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Chip } from '../atoms/Chip';
import { ui } from '@/theme/layout';
import type { TransactionKind } from '@/types/finance.types';
export function TransactionForm({ onClose }: { onClose: () => void }) {
  const { state, saveTransaction, addCategory } = useFinance();
  const now = new Date();
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(dateKey(now));
  const [time, setTime] = useState(timeKey(now));
  const [categoryId, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState('cash');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [stage, setStage] = useState<'details' | 'allocation'>('details');
  const [shares, setShares] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const categories = state.categories.filter((c) => c.kind === kind);
  function save(allocate: boolean) {
    setError('');
    const allocations = allocate
      ? state.assets
          .filter((a) => (shares[a.id] ?? '').trim() !== '' && Number(shares[a.id]) !== 0)
          .map((a) => ({ assetId: a.id, amount: shares[a.id] }))
      : [{ assetId: source || state.assets[0]?.id || '', amount }];
    const result = transactionSchema.safeParse({
      title,
      kind,
      categoryId,
      amount,
      date,
      time,
      allocations,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (!allocate && !source) {
      setStage('allocation');
      return;
    }
    const occurredAt = localDateTime(date, time);
    if (!occurredAt) return;
    const timestamp = new Date().toISOString();
    try {
      saveTransaction({
        id: createDemoId(),
        title: result.data.title,
        kind,
        categoryId,
        amount: result.data.amount,
        occurredAt,
        createdAt: timestamp,
        updatedAt: timestamp,
        allocations: result.data.allocations,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu giao dịch.');
    }
  }
  function createCategory() {
    const result = categorySchema.safeParse({ name: newCategory, kind });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (
      categories.some(
        (c) => c.name.toLocaleLowerCase('vi') === result.data.name.toLocaleLowerCase('vi'),
      )
    ) {
      setError('Danh mục này đã có. Hãy chọn trong danh sách.');
      return;
    }
    const category = { id: createDemoId(), ...result.data };
    addCategory(category);
    setCategory(category.id);
    setNewCategory('');
    setCreatingCategory(false);
    setError('');
  }
  return (
    <SheetTemplate
      title={stage === 'details' ? 'Thêm giao dịch' : 'Phân bổ tài sản'}
      onClose={onClose}
    >
      {stage === 'details' ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label="Chi tiêu"
              selected={kind === 'expense'}
              onPress={() => {
                setKind('expense');
                setCategory('');
                setError('');
              }}
            />
            <Chip
              label="Thu nhập"
              selected={kind === 'income'}
              onPress={() => {
                setKind('income');
                setCategory('');
                setError('');
              }}
            />
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
            <Text style={ui.body}>
              {kind === 'expense' ? 'Số tiền chi tiêu' : 'Số tiền thu nhập'} · VNĐ
            </Text>
            <TextInput
              accessibilityLabel="Số tiền (VND)"
              placeholder="0"
              placeholderTextColor={c.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              style={{
                color: c.ink,
                fontSize: 40,
                fontWeight: '700',
                textAlign: 'center',
                width: '100%',
                minHeight: 58,
              }}
            />
            <Text style={{ fontSize: 12, color: c.green }}>{formatMoney(Number(amount) || 0)}</Text>
          </View>
          <FormField
            label="Tên giao dịch"
            placeholder="Ví dụ: Ăn trưa"
            value={title}
            onChangeText={setTitle}
          />

          <View style={ui.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Ngày (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            </View>
            <View style={{ width: 100 }}>
              <FormField label="Giờ (HH:mm)" value={time} onChangeText={setTime} />
            </View>
          </View>
          <Text style={ui.heading}>Danh mục bắt buộc</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={categoryId === c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
          </View>
          <Button
            title={creatingCategory ? 'Ẩn tạo danh mục' : '+ Thêm danh mục'}
            variant="text"
            onPress={() => setCreatingCategory((v) => !v)}
          />
          {creatingCategory && (
            <View style={{ gap: 10 }}>
              <FormField
                label="Tên danh mục mới"
                placeholder="Ví dụ: Mua sắm"
                value={newCategory}
                onChangeText={setNewCategory}
              />
              <Button title="Tạo danh mục" variant="secondary" onPress={createCategory} />
            </View>
          )}
          <Text style={ui.heading}>
            {kind === 'expense' ? 'Thanh toán từ đâu?' : 'Nhận tiền vào đâu?'}
          </Text>
          <Text style={ui.body}>
            Chọn tiền mặt hoặc tài khoản cụ thể. Bỏ qua để chia nhiều nguồn ở bước tiếp theo.
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {[
              { type: 'cash', label: 'Tiền mặt' },
              { type: 'bank', label: 'Ngân hàng' },
              { type: 'other', label: 'Tài sản khác' },
            ].map((g) => (
              <Chip
                key={g.type}
                label={g.label}
                selected={sourceType === g.type}
                onPress={() => {
                  setSourceType(g.type);
                  setSource('');
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {state.assets
              .filter((a) => a.type === sourceType)
              .map((a) => (
                <Chip
                  key={a.id}
                  label={
                    (a.type === 'cash'
                      ? 'Tiền mặt · '
                      : a.type === 'bank'
                        ? 'Chuyển khoản · '
                        : 'Khác · ') + a.name
                  }
                  selected={source === a.id}
                  onPress={() => setSource(source === a.id ? '' : a.id)}
                />
              ))}
          </View>
          {!!source && (
            <View style={ui.note}>
              <Text style={{ fontSize: 11, color: c.muted }}>Số dư hiện tại</Text>
              <Text style={{ fontSize: 17, color: c.green, fontWeight: '700', marginTop: 5 }}>
                {formatMoney(assetBalance(state, source))}
              </Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={ui.body}>
            {kind === 'expense' ? 'Giảm' : 'Tăng'} tổng cộng {formatMoney(Number(amount) || 0)} vào
            các nguồn dưới đây. Chỉ lưu khi phân bổ đủ.
          </Text>
          {state.assets.map((a) => (
            <FormField
              key={a.id}
              label={a.name + ' (VND)'}
              value={shares[a.id] ?? ''}
              onChangeText={(v) => setShares((s) => ({ ...s, [a.id]: v }))}
              keyboardType="number-pad"
              placeholder="0"
            />
          ))}
          <Text style={ui.label}>
            Đã phân bổ:{' '}
            {formatMoney(Object.values(shares).reduce((s, v) => s + (Number(v) || 0), 0))}
          </Text>
          <Button
            title="← Quay lại giao dịch"
            variant="text"
            onPress={() => {
              setStage('details');
              setError('');
            }}
          />
        </>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button
        title={
          stage === 'allocation'
            ? 'Xác nhận phân bổ và lưu'
            : source
              ? 'Lưu giao dịch'
              : 'Tiếp tục phân bổ tài sản'
        }
        onPress={() => save(stage === 'allocation')}
      />
      <Text style={ui.body}>Dữ liệu trải nghiệm chỉ lưu trong phiên chạy.</Text>
    </SheetTemplate>
  );
}
