import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { Menu } from 'react-native-paper';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import Pencil from 'lucide-react-native/icons/pencil';
import Settings2 from 'lucide-react-native/icons/settings-2';
import List from 'lucide-react-native/icons/list';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { formatMoney } from '@/helpers/money';
import { planDescription, planProgress } from '@/helpers/plan';
import { colors } from '@/theme/colors';
import type { Category } from '@/types/finance.types';
interface Props {
  category: Category;
  planned?: number;
  actual: number;
  onOpen: () => void;
  onEdit: () => void;
  onManage: () => void;
}
export function PlanCard({ category, planned, actual, onOpen, onEdit, onManage }: Props) {
  const [menu, setMenu] = useState(false);
  const remaining = planned === undefined ? undefined : planned - actual;
  const over = category.kind === 'expense' && remaining !== undefined && remaining < 0;
  function select(action: () => void) {
    setMenu(false);
    action();
  }
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Xem giao dịch ' + category.name}
        onPress={onOpen}
        style={({ pressed }) => [styles.content, pressed && { opacity: 0.65 }]}
      >
        <View style={styles.row}>
          <CategoryIcon category={category} />
          <View style={{ flex: 1, gap: 4, paddingRight: 45 }}>
            <Text style={styles.name}>{category.name}</Text>
            <Text style={styles.meta}>
              {category.isArchived ? 'Đã lưu trữ · Xem lịch sử' : 'Xem các giao dịch trong tháng'}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DỰ KIẾN</Text>
            <Text style={styles.money}>
              {planned === undefined ? 'Chưa đặt' : formatMoney(planned)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>THỰC TẾ</Text>
            <Text style={styles.money}>{formatMoney(actual)}</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View
            style={{
              height: '100%',
              borderRadius: 5,
              width: (String(planProgress(planned, actual) * 100) + '%') as DimensionValue,
              backgroundColor: over ? colors.expense : colors.green,
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={{ flex: 1, fontSize: 12, color: over ? colors.expense : colors.green }}>
            {planDescription(category.kind, remaining)}
            {remaining === undefined ? '' : formatMoney(Math.abs(remaining))}
          </Text>
          <ChevronRight size={16} color={colors.muted} />
        </View>
      </Pressable>
      <View style={styles.menu}>
        <Menu
          visible={menu}
          onDismiss={() => setMenu(false)}
          contentStyle={{ backgroundColor: colors.surface, borderRadius: 18 }}
          anchor={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Quản lý ' + category.name}
              onPress={() => setMenu(true)}
              style={styles.menuButton}
            >
              <Ellipsis size={22} color={colors.ink} />
            </Pressable>
          }
        >
          <Menu.Item
            title="Xem giao dịch"
            leadingIcon={() => <List size={18} color={colors.ink} />}
            onPress={() => select(onOpen)}
          />
          <Menu.Item
            title="Đặt kế hoạch"
            disabled={category.isArchived}
            leadingIcon={() => <Pencil size={18} color={colors.ink} />}
            onPress={() => select(onEdit)}
          />
          <Menu.Item
            title="Chỉnh sửa danh mục"
            leadingIcon={() => <Settings2 size={18} color={colors.ink} />}
            onPress={() => select(onManage)}
          />
        </Menu>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  content: { padding: 18, gap: 17 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 10, color: colors.muted },
  label: { fontSize: 10, letterSpacing: 0.7, color: colors.muted, marginBottom: 6 },
  money: { fontSize: 15, fontWeight: '600', color: colors.ink },
  track: { height: 6, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  menu: { position: 'absolute', right: 10, top: 14 },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
});
