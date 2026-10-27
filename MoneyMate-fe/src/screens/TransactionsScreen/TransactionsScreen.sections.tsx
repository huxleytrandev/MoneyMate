import { formatMoney } from '@/helpers/money';
import type { useTransactionsScreen } from '@/hooks/useTransactionsScreen';
import { styles } from '@/screens/TransactionsScreen/TransactionsScreen.styles';
import { colors } from '@/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
export function TransactionsSummary({
  totals,
}: Pick<ReturnType<typeof useTransactionsScreen>, 'totals'>) {
  return (
    <View style={styles.summary}>
      <View style={styles.metric}>
        <View style={styles.metricLabel}>
          <Ionicons name="arrow-down" size={14} color="#16A34A" />
          <Text style={styles.metricText}>Thu nhập</Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.metricAmount, { color: '#16A34A' }]}
        >
          {formatMoney(totals.income)}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.metric}>
        <View style={styles.metricLabel}>
          <Ionicons name="arrow-up" size={14} color={colors.expense} />
          <Text style={styles.metricText}>Chi tiêu</Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.metricAmount, { color: colors.expense }]}
        >
          {formatMoney(totals.expense)}
        </Text>
      </View>
    </View>
  );
}
