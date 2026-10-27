import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatMoney } from '@/helpers/money';
import { colors } from '@/theme/colors';

import { styles } from '@/screens/BudgetScreen/BudgetScreen.styles';
export function BudgetSummary({
  plannedCount,
  planned,
  actual,
  overspent,
  complete,
  remaining,
  message,
  categoryCount,
}: {
  plannedCount: number;
  planned: number;
  actual: number;
  overspent: boolean;
  complete: boolean;
  remaining: number;
  message: string;
  categoryCount: number;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>KẾ HOẠCH</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
            {plannedCount === 0 ? 'Chưa đặt' : formatMoney(planned)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>THỰC TẾ</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.metricValue, overspent && { color: colors.expense }]}
          >
            {formatMoney(actual)}
          </Text>
        </View>
      </View>
      <View style={[styles.status, overspent && { backgroundColor: '#FEF2F2' }]}>
        <Ionicons
          name={
            !complete
              ? 'information-circle-outline'
              : overspent
                ? 'alert-circle-outline'
                : 'checkmark-circle-outline'
          }
          size={19}
          color={overspent ? colors.expense : colors.green}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.statusLabel, overspent && { color: colors.expense }]}>
            {message}
          </Text>
          {complete && remaining !== 0 && (
            <Text style={[styles.statusValue, overspent && { color: colors.expense }]}>
              {formatMoney(Math.abs(remaining))}
            </Text>
          )}
          {!complete && (
            <Text style={styles.statusHint}>
              Đặt đủ kế hoạch để biết phần còn lại của cả tháng.
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.coverage}>
        {plannedCount}/{categoryCount} danh mục đã đặt kế hoạch · VNĐ
      </Text>
    </View>
  );
}
