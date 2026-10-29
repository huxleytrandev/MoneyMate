import { ScrollView, Text, View } from 'react-native';

import { formatMoney } from '@/helpers/money';
import { colors } from '@/theme/colors';
import type { TransactionKind } from '@/types/finance.types';

import { styles } from '@/screens/BudgetScreen/BudgetScreen.styles';
import type { BudgetRow } from '@/types/budget.types';
function shortMoney(value: number) {
  const unit = value >= 1000000 ? 1000000 : value >= 1000 ? 1000 : 1;
  return (
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / unit) +
    (unit === 1000000 ? 'tr' : unit === 1000 ? 'k' : '')
  );
}

export function BudgetComparisonChart({
  rows,
  maxValue,
  kind,
}: {
  rows: BudgetRow[];
  maxValue: number;
  kind: TransactionKind;
}) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>Kế hoạch và thực tế</Text>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#DDE2DE' }]} />
          <Text style={styles.legendText}>Kế hoạch</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.legendText}>Thực tế</Text>
        </View>
        {kind === 'expense' && (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.expense }]} />
            <Text style={styles.legendText}>Vượt</Text>
          </View>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chart}
      >
        {rows.map((row) => (
          <View
            key={row.category.id}
            style={styles.chartGroup}
            accessible
            accessibilityLabel={`${row.category.name}: kế hoạch ${row.planned === undefined ? 'chưa đặt' : formatMoney(row.planned)}, thực tế ${formatMoney(row.actual)}`}
          >
            <View style={styles.barPair}>
              <View style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {row.planned === undefined ? '—' : shortMoney(row.planned)}
                </Text>
                <View
                  style={[
                    styles.bar,
                    { height: ((row.planned ?? 0) / maxValue) * 120, backgroundColor: '#DDE2DE' },
                  ]}
                />
              </View>
              <View style={styles.barColumn}>
                <Text style={styles.barValue}>{shortMoney(row.actual)}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (row.actual / maxValue) * 120,
                      backgroundColor:
                        kind === 'expense' && row.planned !== undefined && row.actual > row.planned
                          ? colors.expense
                          : '#16A34A',
                    },
                  ]}
                />
              </View>
            </View>
            <Text numberOfLines={2} style={styles.chartName}>
              {row.category.name}
            </Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.chartHint}>
        Chạm danh mục bên dưới để xem giao dịch và kế hoạch tháng.
      </Text>
    </View>
  );
}
