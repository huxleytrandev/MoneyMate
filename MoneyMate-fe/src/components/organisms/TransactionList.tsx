import { Text, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Transaction, FinanceState } from '@/types/finance.types';
import { formatDateTime } from '@/helpers/date';
import { formatMoney } from '@/helpers/money';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
export function TransactionList({
  transactions,
  state,
}: {
  transactions: Transaction[];
  state: FinanceState;
}) {
  return (
    <View style={{ gap: 10 }}>
      {transactions.length === 0 ? (
        <View style={ui.card}>
          <Text style={ui.body}>Chưa có giao dịch phù hợp.</Text>
        </View>
      ) : (
        transactions.map((t) => (
          <View key={t.id} style={s.card}>
            <View
              style={[
                s.icon,
                { backgroundColor: t.kind === 'income' ? c.softGreen : c.background },
              ]}
            >
              <Ionicons
                name={
                  t.kind === 'income'
                    ? 'wallet'
                    : t.categoryId === 'food'
                      ? 'restaurant'
                      : t.categoryId === 'travel'
                        ? 'car'
                        : 'receipt'
                }
                size={19}
                color={t.kind === 'income' ? c.income : c.ink}
              />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={s.title}>{t.title}</Text>
              <Text style={s.meta}>
                {t.allocations
                  .map((a) => state.assets.find((asset) => asset.id === a.assetId)?.name)
                  .join(' + ')}
              </Text>
              <Text style={s.meta}>{formatDateTime(t.occurredAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', maxWidth: '44%', gap: 5 }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: t.kind === 'income' ? c.income : c.expense,
                }}
              >
                {t.kind === 'income' ? '+' : '−'}
                {formatMoney(t.amount)}
              </Text>
              <Text style={s.meta}>
                {state.categories.find((category) => category.id === t.categoryId)?.name}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: c.ink },
  meta: { fontSize: 10, color: c.muted, lineHeight: 16 },
});
