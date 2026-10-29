import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import { monthLabel, shiftMonth } from '@/helpers/date';
import { colors } from '@/theme/colors';
export function MonthSwitcher({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tháng trước"
        disabled={month <= '1000-01'}
        onPress={() => onChange(shiftMonth(month, -1))}
        style={styles.arrow}
      >
        <ChevronLeft size={21} color={colors.ink} />
      </Pressable>
      <View style={styles.label}>
        <CalendarDays size={17} color={colors.green} />
        <Text style={styles.text}>{monthLabel(month)}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tháng sau"
        disabled={month >= '9998-12'}
        onPress={() => onChange(shiftMonth(month, 1))}
        style={styles.arrow}
      >
        <ChevronRight size={21} color={colors.ink} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
