import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { PlanCard } from '@/components/molecules/PlanCard';
import { PlanEditor } from '@/components/organisms/PlanEditor';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { monthKey, monthLabel, shiftMonth } from '@/helpers/date';
import { categoryActual } from '@/helpers/finance';
import { createDemoId } from '@/helpers/id';
import { formatMoney } from '@/helpers/money';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema, categorySchema } from '@/schemas/finance.schema';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Category, TransactionKind } from '@/types/finance.types';

function shortMoney(value: number) {
  const unit = value >= 1000000 ? 1000000 : value >= 1000 ? 1000 : 1;
  return (
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / unit) +
    (unit === 1000000 ? 'tr' : unit === 1000 ? 'k' : '')
  );
}

export default function BudgetScreen() {
  const { state } = useFinance();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [editor, setEditor] = useState<Category | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const rows = state.categories
    .filter((category) => category.kind === kind)
    .map((category) => ({
      category,
      planned: state.plans.find((plan) => plan.categoryId === category.id && plan.month === month)
        ?.amount,
      actual: categoryActual(state, category.id, month),
    }));
  const plannedCount = rows.filter((row) => row.planned !== undefined).length;
  const planned = rows.reduce((sum, row) => sum + (row.planned ?? 0), 0);
  const actual = rows.reduce((sum, row) => sum + row.actual, 0);
  const complete = rows.length > 0 && plannedCount === rows.length;
  const remaining = planned - actual;
  const overspent = complete && kind === 'expense' && remaining < 0;
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.planned ?? 0, row.actual]));
  const message = !complete
    ? plannedCount === 0
      ? 'Chưa có kế hoạch cho tháng này.'
      : `${rows.length - plannedCount} danh mục chưa đặt kế hoạch.`
    : kind === 'expense'
      ? remaining < 0
        ? 'Đã vượt ngân sách'
        : remaining === 0
          ? 'Đã dùng hết ngân sách'
          : 'Còn có thể chi'
      : remaining < 0
        ? 'Thu nhập vượt mục tiêu'
        : remaining === 0
          ? 'Đã đạt mục tiêu thu nhập'
          : 'Còn cần thu';

  return (
    <ScreenTemplate>
      <View style={ui.row}>
        <View style={{ gap: 5 }}>
          <Text style={ui.title}>Ngân sách</Text>
          <Text style={ui.body}>Chủ động từng khoản thu, chi.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm danh mục và kế hoạch"
          onPress={() => setAddingCategory(true)}
          style={s.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
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

      <View style={s.segment}>
        {(
          [
            { value: 'expense', label: 'Chi tiêu' },
            { value: 'income', label: 'Thu nhập' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: kind === item.value }}
            onPress={() => setKind(item.value)}
            style={[s.segmentButton, kind === item.value && s.segmentSelected]}
          >
            <Text style={[s.segmentText, kind === item.value && { color: 'white' }]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={s.summary}>
        <View style={s.summaryMetrics}>
          <View style={s.metric}>
            <Text style={s.metricLabel}>KẾ HOẠCH</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={s.metricValue}>
              {plannedCount === 0 ? 'Chưa đặt' : formatMoney(planned)}
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.metric}>
            <Text style={s.metricLabel}>THỰC TẾ</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[s.metricValue, overspent && { color: c.expense }]}
            >
              {formatMoney(actual)}
            </Text>
          </View>
        </View>
        <View style={[s.status, overspent && { backgroundColor: '#FEF2F2' }]}>
          <Ionicons
            name={
              !complete
                ? 'information-circle-outline'
                : overspent
                  ? 'alert-circle-outline'
                  : 'checkmark-circle-outline'
            }
            size={19}
            color={overspent ? c.expense : c.green}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.statusLabel, overspent && { color: c.expense }]}>{message}</Text>
            {complete && remaining !== 0 && (
              <Text style={[s.statusValue, overspent && { color: c.expense }]}>
                {formatMoney(Math.abs(remaining))}
              </Text>
            )}
            {!complete && (
              <Text style={s.statusHint}>Đặt đủ kế hoạch để biết phần còn lại của cả tháng.</Text>
            )}
          </View>
        </View>
        <Text style={s.coverage}>
          {plannedCount}/{rows.length} danh mục đã đặt kế hoạch · VNĐ
        </Text>
      </View>

      <View style={s.chartCard}>
        <Text style={s.sectionTitle}>Kế hoạch và thực tế</Text>
        <View style={s.legend}>
          <View style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: '#DDE2DE' }]} />
            <Text style={s.legendText}>Kế hoạch</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: '#16A34A' }]} />
            <Text style={s.legendText}>Thực tế</Text>
          </View>
          {kind === 'expense' && (
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: c.expense }]} />
              <Text style={s.legendText}>Vượt</Text>
            </View>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chart}
        >
          {rows.map((row) => (
            <View
              key={row.category.id}
              style={s.chartGroup}
              accessible
              accessibilityLabel={`${row.category.name}: kế hoạch ${row.planned === undefined ? 'chưa đặt' : formatMoney(row.planned)}, thực tế ${formatMoney(row.actual)}`}
            >
              <View style={s.barPair}>
                <View style={s.barColumn}>
                  <Text style={s.barValue}>
                    {row.planned === undefined ? '—' : shortMoney(row.planned)}
                  </Text>
                  <View
                    style={[
                      s.bar,
                      { height: ((row.planned ?? 0) / maxValue) * 120, backgroundColor: '#DDE2DE' },
                    ]}
                  />
                </View>
                <View style={s.barColumn}>
                  <Text style={s.barValue}>{shortMoney(row.actual)}</Text>
                  <View
                    style={[
                      s.bar,
                      {
                        height: (row.actual / maxValue) * 120,
                        backgroundColor:
                          kind === 'expense' &&
                          row.planned !== undefined &&
                          row.actual > row.planned
                            ? c.expense
                            : '#16A34A',
                      },
                    ]}
                  />
                </View>
              </View>
              <Text numberOfLines={2} style={s.chartName}>
                {row.category.name}
              </Text>
            </View>
          ))}
        </ScrollView>
        <Text style={s.chartHint}>Chạm danh mục bên dưới để điều chỉnh kế hoạch tháng.</Text>
      </View>

      <View style={ui.row}>
        <Text style={s.sectionTitle}>Theo danh mục</Text>
        <Text style={s.coverage}>{rows.length} danh mục</Text>
      </View>
      <View style={{ gap: 12 }}>
        {rows.map((row) => (
          <PlanCard
            key={row.category.id}
            category={row.category}
            planned={row.planned}
            actual={row.actual}
            onEdit={() => setEditor(row.category)}
          />
        ))}
      </View>
      <Button
        title="+ Thêm danh mục và kế hoạch"
        variant="text"
        onPress={() => setAddingCategory(true)}
      />
      {editor && <PlanEditor category={editor} month={month} onClose={() => setEditor(null)} />}
      {addingCategory && (
        <NewBudgetCategory kind={kind} month={month} onClose={() => setAddingCategory(false)} />
      )}
    </ScreenTemplate>
  );
}

function NewBudgetCategory({
  kind,
  month,
  onClose,
}: {
  kind: TransactionKind;
  month: string;
  onClose: () => void;
}) {
  const { state, addCategory, savePlan } = useFinance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  function save() {
    const categoryResult = categorySchema.safeParse({ name, kind });
    const amountResult = amountSchema.safeParse(amount);
    if (!categoryResult.success) {
      setError(categoryResult.error.issues[0].message);
      return;
    }
    if (!amountResult.success) {
      setError(amountResult.error.issues[0].message);
      return;
    }
    if (
      state.categories.some(
        (category) =>
          category.kind === kind &&
          category.name.toLocaleLowerCase('vi') ===
            categoryResult.data.name.toLocaleLowerCase('vi'),
      )
    ) {
      setError('Danh mục này đã có. Hãy chỉnh sửa kế hoạch trong danh sách.');
      return;
    }
    const category = { id: createDemoId(), ...categoryResult.data };
    addCategory(category);
    savePlan(category.id, month, amountResult.data);
    onClose();
  }
  return (
    <SheetTemplate title="Thêm danh mục" onClose={onClose}>
      <Text style={ui.body}>
        {kind === 'expense' ? 'Chi tiêu' : 'Thu nhập'} · {monthLabel(month)}
      </Text>
      <FormField
        label="Tên danh mục"
        placeholder={kind === 'expense' ? 'Ví dụ: Mua sắm' : 'Ví dụ: Thưởng'}
        value={name}
        onChangeText={setName}
      />
      <FormField
        label="Kế hoạch tháng (VNĐ)"
        placeholder="Ví dụ: 1000000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        hint="Nhập 0 nếu bạn chủ động đặt kế hoạch bằng 0."
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button title="Lưu danh mục và kế hoạch" onPress={save} />
    </SheetTemplate>
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
  segment: {
    backgroundColor: '#EDEFEA',
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  segmentSelected: { backgroundColor: c.green },
  segmentText: { fontSize: 13, fontWeight: '600', color: c.muted },
  summary: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 20,
    gap: 17,
  },
  summaryMetrics: { flexDirection: 'row', gap: 18 },
  metric: { flex: 1, gap: 9 },
  metricLabel: { fontSize: 9, letterSpacing: 1.2, color: c.muted, fontWeight: '600' },
  metricValue: { fontSize: 21, fontWeight: '700', color: c.ink, letterSpacing: -0.6 },
  divider: { width: 1, backgroundColor: c.border },
  status: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: { color: c.green, fontSize: 12, fontWeight: '500' },
  statusValue: { color: c.green, fontSize: 22, fontWeight: '700', letterSpacing: -0.7 },
  statusHint: { color: c.muted, fontSize: 11, lineHeight: 17 },
  coverage: { fontSize: 10, color: c.muted },
  chartCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 20,
    gap: 17,
  },
  sectionTitle: { color: c.ink, fontSize: 16, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 7, width: 7, borderRadius: 3.5 },
  legendText: { color: c.muted, fontSize: 10 },
  chart: { gap: 15, paddingTop: 8 },
  chartGroup: { width: 74, alignItems: 'center', gap: 10 },
  barPair: {
    height: 150,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 2,
  },
  barColumn: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  barValue: { color: c.muted, fontSize: 9 },
  bar: { width: 21, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  chartName: { fontSize: 10, color: c.muted, textAlign: 'center', height: 28, lineHeight: 14 },
  chartHint: { fontSize: 10, lineHeight: 17, color: c.muted },
});
