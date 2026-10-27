import { formatDateTime } from '@/helpers/date';
import { formatMoney } from '@/helpers/money';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { FinanceState, Transaction } from '@/types/finance.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionForm } from './TransactionForm';
export function TransactionList({
  transactions,
  state,
}: {
  transactions: Transaction[];
  state: FinanceState;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  return (
    <View style={{ gap: 10 }}>
      {transactions.length === 0 ? (
        <View style={ui.card}>
          <Text style={ui.body}>Chưa có giao dịch phù hợp.</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={'Sửa giao dịch ' + transaction.title}
            onPress={() => setEditing(transaction)}
            key={transaction.id}
            style={styles.card}
          >
            <View
              style={[
                styles.icon,
                {
                  backgroundColor:
                    transaction.kind === 'income' ? colors.softGreen : colors.background,
                },
              ]}
            >
              <Ionicons
                name={
                  transaction.kind === 'income'
                    ? 'wallet'
                    : transaction.categoryId === 'food'
                      ? 'restaurant'
                      : transaction.categoryId === 'travel'
                        ? 'car'
                        : 'receipt'
                }
                size={19}
                color={transaction.kind === 'income' ? colors.income : colors.ink}
              />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={styles.title}>{transaction.title}</Text>
              <Text style={styles.meta}>
                {transaction.allocations
                  .map(
                    (allocation) =>
                      state.assets.find((asset) => asset.id === allocation.assetId)?.name,
                  )
                  .join(' + ')}
              </Text>
              <Text style={styles.meta}>{formatDateTime(transaction.occurredAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', maxWidth: '44%', gap: 5 }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: transaction.kind === 'income' ? colors.income : colors.expense,
                }}
              >
                {transaction.kind === 'income' ? '+' : '−'}
                {formatMoney(transaction.amount)}
              </Text>
              <Text style={styles.meta}>
                {state.categories.find((category) => category.id === transaction.categoryId)?.name}
              </Text>
            </View>
          </Pressable>
        ))
      )}
      {editing && <TransactionForm transaction={editing} onClose={() => setEditing(null)} />}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.ink },
  meta: { fontSize: 10, color: colors.muted, lineHeight: 16 },
});
