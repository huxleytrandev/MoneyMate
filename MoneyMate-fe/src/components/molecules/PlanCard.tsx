import { formatMoney } from '@/helpers/money';
import { planDescription, planProgress } from '@/helpers/plan';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Category } from '@/types/finance.types';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
export function PlanCard({
  category,
  planned,
  actual,
  onEdit,
}: {
  category: Category;
  planned?: number;
  actual: number;
  onEdit: () => void;
}) {
  const remaining = planned === undefined ? undefined : planned - actual;
  const description = planDescription(category.kind, remaining);
  const ratio = planProgress(planned, actual);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Sửa kế hoạch ' + category.name}
      onPress={onEdit}
      style={styles.card}
    >
      <View style={ui.row}>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 14 }}>{category.name}</Text>
        <Text style={{ color: colors.green, fontSize: 12 }}>Chỉnh sửa ↗</Text>
      </View>
      <View style={ui.row}>
        <View>
          <Text style={styles.label}>DỰ KIẾN · PLANNED</Text>
          <Text style={styles.money}>
            {planned === undefined ? 'Chưa đặt' : formatMoney(planned)}
          </Text>
        </View>
        <View>
          <Text style={styles.label}>THỰC TẾ · ACTUAL</Text>
          <Text style={styles.money}>{formatMoney(actual)}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: (String(ratio * 100) + '%') as DimensionValue,
              backgroundColor:
                remaining !== undefined && remaining < 0 && category.kind === 'expense'
                  ? colors.expense
                  : colors.green,
            },
          ]}
        />
      </View>
      <Text
        style={{
          fontSize: 12,
          color:
            remaining !== undefined && remaining < 0 && category.kind === 'expense'
              ? colors.expense
              : colors.green,
        }}
      >
        {description}
        {remaining === undefined ? '' : formatMoney(Math.abs(remaining))}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    gap: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 9, color: colors.muted, letterSpacing: 1, marginBottom: 6 },
  money: { fontSize: 14, fontWeight: '600', color: colors.ink },
  track: { height: 5, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
