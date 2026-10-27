import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { TransactionList } from '@/components/organisms/TransactionList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { dateKey, monthKey, monthLabel, shiftMonth } from '@/helpers/date';
import { monthlyTotals, monthlyTransactions } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { AssetKind, Transaction, TransactionKind } from '@/types/finance.types';

type Filter = 'all' | TransactionKind | AssetKind;
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'expense', label: 'Chi tiêu' },
  { value: 'income', label: 'Thu nhập' },
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank', label: 'Ngân hàng' },
  { value: 'other', label: 'Tài sản khác' },
];
function normalize(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
function dayLabel(value: string) {
  const now = new Date();
  if (value === dateKey(now)) return 'Hôm nay';
  now.setDate(now.getDate() - 1);
  if (value === dateKey(now)) return 'Hôm qua';
  return new Date(value + 'T12:00:00').toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function TransactionsScreen() {
  const { state } = useFinance();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const search = normalize(query.trim());
  const transactions = monthlyTransactions(state, month)
    .filter((transaction) => {
      const sourceMatch =
        filter === 'cash' || filter === 'bank' || filter === 'other'
          ? transaction.allocations.some(
              (allocation) =>
                state.assets.find((asset) => asset.id === allocation.assetId)?.type === filter,
            )
          : filter === 'all' || transaction.kind === filter;
      if (!sourceMatch) return false;
      const category =
        state.categories.find((item) => item.id === transaction.categoryId)?.name ?? '';
      const assets = transaction.allocations
        .map(
          (allocation) => state.assets.find((asset) => asset.id === allocation.assetId)?.name ?? '',
        )
        .join(' ');
      return normalize(
        [transaction.title, category, assets, String(transaction.amount)].join(' '),
      ).includes(search);
    })
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const totals = monthlyTotals(transactions);
  const grouped = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const day = dateKey(new Date(transaction.occurredAt));
    grouped.set(day, [...(grouped.get(day) ?? []), transaction]);
  }

  return (
    <ScreenTemplate>
      <View style={ui.row}>
        <View style={{ gap: 5 }}>
          <Text style={ui.title}>Giao dịch</Text>
          <Text style={ui.body}>Nhìn lại từng khoản thu, chi.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm giao dịch"
          onPress={() => setAdding(true)}
          style={s.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
      </View>

      <View style={s.search}>
        <Ionicons name="search-outline" size={20} color={c.muted} />
        <TextInput
          accessibilityLabel="Tìm kiếm giao dịch"
          placeholder="Tìm giao dịch, danh mục, nguồn tiền..."
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={setQuery}
          style={s.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa tìm kiếm"
            onPress={() => setQuery('')}
            style={s.clear}
          >
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        )}
      </View>

      <View style={s.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng trước"
          onPress={() => setMonth(shiftMonth(month, -1))}
          style={s.monthArrow}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </Pressable>
        <View style={s.monthLabel}>
          <Ionicons name="calendar-outline" size={16} color={c.green} />
          <Text style={s.monthText}>{monthLabel(month)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng sau"
          onPress={() => setMonth(shiftMonth(month, 1))}
          style={s.monthArrow}
        >
          <Ionicons name="chevron-forward" size={18} color={c.ink} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
      >
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={filter === item.value}
            onPress={() => setFilter(item.value)}
          />
        ))}
      </ScrollView>

      <View style={s.summary}>
        <View style={s.metric}>
          <View style={s.metricLabel}>
            <Ionicons name="arrow-down" size={14} color="#16A34A" />
            <Text style={s.metricText}>Thu nhập</Text>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[s.metricAmount, { color: '#16A34A' }]}
          >
            {formatMoney(totals.income)}
          </Text>
        </View>
        <View style={s.divider} />
        <View style={s.metric}>
          <View style={s.metricLabel}>
            <Ionicons name="arrow-up" size={14} color={c.expense} />
            <Text style={s.metricText}>Chi tiêu</Text>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[s.metricAmount, { color: c.expense }]}
          >
            {formatMoney(totals.expense)}
          </Text>
        </View>
      </View>
      <View style={s.resultHeading}>
        <Text style={s.resultCount}>{transactions.length} giao dịch</Text>
        <Text style={s.resultHint}>Theo bộ lọc đang chọn</Text>
      </View>
      {(filter === 'cash' || filter === 'bank' || filter === 'other') && (
        <Text style={s.sourceHint}>
          Số tiền hiển thị là tổng giao dịch, kể cả giao dịch dùng nhiều nguồn.
        </Text>
      )}

      {transactions.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="receipt-outline" size={30} color={c.green} />
          </View>
          <Text style={s.emptyTitle}>Chưa có giao dịch phù hợp</Text>
          <Text style={s.emptyBody}>
            {search || filter !== 'all'
              ? 'Thử đổi từ khóa hoặc bộ lọc để tìm khoản thu, chi của bạn.'
              : 'Bắt đầu ghi lại một khoản thu hoặc chi trong tháng này.'}
          </Text>
        </View>
      ) : (
        [...grouped.entries()].map(([day, items]) => {
          const dailyTotals = monthlyTotals(items);
          const net = dailyTotals.income - dailyTotals.expense;
          return (
            <View key={day} style={s.dayGroup}>
              <View style={ui.row}>
                <Text style={s.dayTitle}>{dayLabel(day)}</Text>
                <Text
                  style={[
                    s.dayTotal,
                    { color: net > 0 ? '#16A34A' : net < 0 ? c.expense : c.muted },
                  ]}
                >
                  {net > 0 ? '+' : net < 0 ? '−' : ''}
                  {formatMoney(Math.abs(net))}
                </Text>
              </View>
              <TransactionList transactions={items} state={state} />
            </View>
          );
        })
      )}
      <Button title="+ Ghi giao dịch mới" onPress={() => setAdding(true)} />
      {adding && <TransactionForm onClose={() => setAdding(false)} />}
    </ScreenTemplate>
  );
}

const s = StyleSheet.create({
  add: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: c.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    backgroundColor: c.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: c.border,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12, color: c.ink, paddingVertical: 17 },
  clear: { minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  month: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 3,
  },
  monthArrow: { width: 43, height: 43, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  monthText: { color: c.ink, fontSize: 13, fontWeight: '600' },
  filters: { gap: 8, paddingRight: 4 },
  summary: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 20,
    flexDirection: 'row',
    gap: 18,
  },
  metric: { flex: 1, gap: 10 },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricText: { color: c.muted, fontSize: 11 },
  metricAmount: { fontWeight: '700', fontSize: 20, letterSpacing: -0.5 },
  divider: { width: 1, backgroundColor: c.border },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultCount: { color: c.ink, fontSize: 13, fontWeight: '600' },
  resultHint: { color: c.muted, fontSize: 10 },
  sourceHint: { color: c.muted, fontSize: 11, lineHeight: 17 },
  empty: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 28,
    gap: 12,
  },
  emptyIcon: {
    height: 64,
    width: 64,
    borderRadius: 20,
    backgroundColor: c.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: c.ink, fontSize: 15, fontWeight: '600' },
  emptyBody: { color: c.muted, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  dayGroup: { gap: 12 },
  dayTitle: { color: c.muted, fontSize: 12, fontWeight: '600' },
  dayTotal: { fontSize: 12, fontWeight: '600' },
});
