import { useState } from 'react';
import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFinance } from '@/hooks/useFinance';
import { monthKey } from '@/helpers/date';
import { assetBalance, monthlyTransactions, monthlyTotals } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { TransactionList } from '@/components/organisms/TransactionList';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
export default function DashboardScreen({
  displayName,
  onLogout,
  onAssets,
  onBudget,
  onTransactions,
}: {
  displayName: string;
  onLogout: () => void;
  onAssets: () => void;
  onBudget: () => void;
  onTransactions: () => void;
}) {
  const { state } = useFinance();
  const [add, setAdd] = useState(false);
  const month = monthKey(new Date());
  const transactions = monthlyTransactions(state, month).sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt),
  );
  const totals = monthlyTotals(transactions);
  const balances = state.assets.map((a) => ({ ...a, balance: assetBalance(state, a.id) }));
  const total = balances.reduce((sum, a) => sum + a.balance, 0);
  const expenseCategories = state.categories.filter((a) => a.kind === 'expense');
  const planned = state.plans
    .filter((p) => p.month === month && expenseCategories.some((a) => a.id === p.categoryId))
    .reduce((sum, p) => sum + p.amount, 0);
  const missing = expenseCategories.filter(
    (a) => !state.plans.some((p) => p.categoryId === a.id && p.month === month),
  ).length;
  const remaining = planned - totals.expense;
  const complete = expenseCategories.length > 0 && missing === 0;
  const usage = complete && planned > 0 ? Math.round((totals.expense / planned) * 100) : undefined;
  const groups = [
    { type: 'cash', name: 'TIỀN MẶT', color: c.amber },
    { type: 'bank', name: 'NGÂN HÀNG', color: '#FFFFFF' },
    { type: 'other', name: 'TÀI SẢN KHÁC', color: '#39BD73' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenTemplate>
        <View style={ui.row}>
          <View style={{ gap: 4 }}>
            <Text style={ui.body}>Xin chào,</Text>
            <Text style={ui.heading}>{displayName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thoát demo"
            onPress={onLogout}
            style={s.circle}
          >
            <Ionicons name="log-out-outline" size={23} color={c.ink} />
          </Pressable>
        </View>
        <View style={s.demo}>
          <View style={s.dot} />
          <Text style={s.demoText}>Bản trải nghiệm · Dữ liệu mẫu trong phiên</Text>
        </View>
        <View style={s.hero}>
          <Text style={{ color: '#CEE9E3', fontSize: 14 }}>Tổng tài sản</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={s.total}>
            {formatMoney(total)}
          </Text>
          {total > 0 && balances.every((a) => a.balance >= 0) && (
            <View style={s.stack}>
              {groups.map((g) => (
                <View
                  key={g.type}
                  style={{
                    flex:
                      balances
                        .filter((a) => a.type === g.type)
                        .reduce((sum, a) => sum + a.balance, 0) / total,
                    backgroundColor: g.color,
                  }}
                />
              ))}
            </View>
          )}
          <View style={s.legend}>
            {groups.map((g) => (
              <View style={s.legendItem} key={g.type}>
                <View style={[s.dot, { backgroundColor: g.color }]} />
                <Text style={s.legendText}>{g.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={ui.row}>
          <Text style={ui.heading}>Nguồn tiền</Text>
          <Pressable accessibilityRole="button" onPress={onAssets} hitSlop={12}>
            <Text style={s.link}>XEM TẤT CẢ</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14 }}
        >
          {balances.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={'Xem tài sản ' + a.name}
              onPress={onAssets}
              style={s.asset}
            >
              <View
                style={[
                  s.icon,
                  {
                    backgroundColor:
                      a.type === 'cash' ? c.softAmber : a.type === 'bank' ? '#EFF6FF' : c.softGreen,
                  },
                ]}
              >
                <Ionicons
                  name={a.type === 'cash' ? 'wallet' : a.type === 'bank' ? 'business' : 'diamond'}
                  color={a.type === 'cash' ? c.amber : a.type === 'bank' ? c.blue : c.income}
                  size={19}
                />
              </View>
              <Text numberOfLines={1} style={s.assetName}>
                {a.name.toLocaleUpperCase('vi')}
              </Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={s.assetValue}>
                {formatMoney(a.balance)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem ngân sách tháng này"
          onPress={onBudget}
          style={ui.card}
        >
          <View style={ui.row}>
            <Text style={{ color: c.ink, fontWeight: '700', fontSize: 15 }}>
              Ngân sách tháng này
            </Text>
            <Text
              style={[
                s.badge,
                {
                  color: complete && remaining < 0 ? c.expense : c.green,
                  backgroundColor: complete && remaining < 0 ? c.softRed : c.softGreen,
                },
              ]}
            >
              {!complete
                ? 'CHƯA ĐỦ KẾ HOẠCH'
                : usage === undefined
                  ? totals.expense > 0
                    ? 'CHI VƯỢT'
                    : 'ĐÃ DÙNG 0%'
                  : usage > 100
                    ? 'ĐÃ VƯỢT ' + (usage - 100) + '%'
                    : 'ĐÃ DÙNG ' + usage + '%'}
            </Text>
          </View>
          <View style={ui.row}>
            <View style={{ flex: 1, gap: 7 }}>
              <Text style={ui.label}>DỰ KIẾN</Text>
              <Text style={s.metric}>{formatMoney(planned)}</Text>
            </View>
            <View style={{ flex: 1, gap: 7, alignItems: 'flex-end' }}>
              <Text style={ui.label}>THỰC TẾ</Text>
              <Text style={[s.metric, { color: complete && remaining < 0 ? c.expense : c.green }]}>
                {formatMoney(totals.expense)}
              </Text>
            </View>
          </View>
          <View style={s.track}>
            <View
              style={{
                height: '100%',
                width: (Math.min(usage ?? 0, 100) + '%') as `${number}%`,
                backgroundColor: complete && remaining < 0 ? c.expense : c.green,
                borderRadius: 4,
              }}
            />
          </View>
          <View style={ui.row}>
            <Text
              style={{
                fontSize: 12,
                color: complete && remaining < 0 ? c.expense : c.green,
                flex: 1,
              }}
            >
              {complete
                ? (remaining < 0 ? 'Vượt ' : 'Còn được chi ') + formatMoney(Math.abs(remaining))
                : 'Đặt đủ kế hoạch để xem phần còn được chi.'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.muted} />
          </View>
          {missing > 0 && (
            <Text style={{ fontSize: 11, color: c.muted }}>
              {missing} danh mục chưa đặt kế hoạch.
            </Text>
          )}
        </Pressable>
        <View style={ui.row}>
          <View style={[s.monthMetric, { backgroundColor: c.softGreen }]}>
            <Text style={ui.body}>Thu nhập tháng</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={[s.metric, { color: c.income }]}>
              {formatMoney(totals.income)}
            </Text>
          </View>
          <View style={[s.monthMetric, { backgroundColor: c.surface }]}>
            <Text style={ui.body}>Chi tiêu tháng</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={s.metric}>
              {formatMoney(totals.expense)}
            </Text>
          </View>
        </View>
        <View style={ui.row}>
          <Text style={ui.heading}>Giao dịch gần đây</Text>
          <Pressable accessibilityRole="button" onPress={onTransactions} hitSlop={12}>
            <Text style={s.link}>XEM TẤT CẢ</Text>
          </Pressable>
        </View>
        <TransactionList transactions={transactions.slice(0, 3)} state={state} />
      </ScreenTemplate>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thêm giao dịch"
        onPress={() => setAdd(true)}
        style={s.fab}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
      {add && <TransactionForm onClose={() => setAdd(false)} />}
    </View>
  );
}
const s = StyleSheet.create({
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -8 },
  demoText: { fontSize: 10, color: c.muted },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.green },
  hero: {
    backgroundColor: c.green,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    boxShadow: '0px 10px 18px rgba(15,118,110,0.16)',
  },
  total: { fontSize: 32, fontWeight: '800', color: 'white', letterSpacing: -0.8, marginBottom: 10 },
  stack: {
    flexDirection: 'row',
    height: 11,
    backgroundColor: '#FFFFFF22',
    borderRadius: 8,
    overflow: 'hidden',
  },
  legend: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontSize: 8, fontWeight: '700', color: '#E4F4F0' },
  link: { fontSize: 10, fontWeight: '700', color: c.green, letterSpacing: 0.4 },
  asset: {
    width: 157,
    padding: 17,
    gap: 12,
    borderRadius: 24,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  icon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  assetName: { fontSize: 9, color: c.muted },
  assetValue: { fontSize: 16, fontWeight: '700', color: c.ink },
  badge: {
    fontSize: 8,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  metric: { fontSize: 16, fontWeight: '700', color: c.ink },
  track: { height: 5, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
  monthMetric: { flex: 1, padding: 16, gap: 9, borderRadius: 20 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: c.green,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 5px 15px rgba(15,118,110,0.24)',
  },
});
