import { Text, View, Pressable, StyleSheet, type DimensionValue } from 'react-native';
import type { Category } from '@/types/finance.types';
import { formatMoney } from '@/helpers/money';
import { colors as c } from '@/theme/colors';
import { ui } from '@/theme/layout';
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
  const description =
    remaining === undefined
      ? 'Chưa lập kế hoạch'
      : category.kind === 'expense'
        ? remaining >= 0
          ? 'Còn được chi '
          : 'Vượt kế hoạch '
        : remaining >= 0
          ? 'Còn cần thu '
          : 'Vượt mục tiêu ';
  const ratio = planned && planned > 0 ? Math.min(actual / planned, 1) : actual > 0 ? 1 : 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Sửa kế hoạch ' + category.name}
      onPress={onEdit}
      style={s.card}
    >
      <View style={ui.row}>
        <Text style={{ color: c.ink, fontWeight: '700', fontSize: 14 }}>{category.name}</Text>
        <Text style={{ color: c.green, fontSize: 12 }}>Chỉnh sửa ↗</Text>
      </View>
      <View style={ui.row}>
        <View>
          <Text style={s.label}>DỰ KIẾN · PLANNED</Text>
          <Text style={s.money}>{planned === undefined ? 'Chưa đặt' : formatMoney(planned)}</Text>
        </View>
        <View>
          <Text style={s.label}>THỰC TẾ · ACTUAL</Text>
          <Text style={s.money}>{formatMoney(actual)}</Text>
        </View>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: (String(ratio * 100) + '%') as DimensionValue,
              backgroundColor:
                remaining !== undefined && remaining < 0 && category.kind === 'expense'
                  ? c.expense
                  : c.green,
            },
          ]}
        />
      </View>
      <Text
        style={{
          fontSize: 12,
          color:
            remaining !== undefined && remaining < 0 && category.kind === 'expense'
              ? c.expense
              : c.green,
        }}
      >
        {description}
        {remaining === undefined ? '' : formatMoney(Math.abs(remaining))}
      </Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: 22,
    padding: 18,
    gap: 15,
    borderWidth: 1,
    borderColor: c.border,
  },
  label: { fontSize: 9, color: c.muted, letterSpacing: 1, marginBottom: 6 },
  money: { fontSize: 14, fontWeight: '600', color: c.ink },
  track: { height: 5, backgroundColor: c.border, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
});
