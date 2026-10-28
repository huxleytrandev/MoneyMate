import { Chip } from '@/components/atoms/Chip';
import { filters } from '@/constants/transaction-filters';
import { monthLabel, shiftMonth } from '@/helpers/date';
import type { useTransactionsScreen } from '@/hooks/useTransactionsScreen';
import { styles } from './TransactionsScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TransactionsSummary } from './TransactionsScreen.sections';
export function TransactionScreenHeader({
  model,
}: {
  model: ReturnType<typeof useTransactionsScreen>;
}) {
  const {
    setAdding,
    query,
    setQuery,
    setMonth,
    month,
    filter,
    setFilter,
    totals,
    totalCount,
    loading,
  } = model;
  return (
    <View style={{ gap: 24, paddingBottom: 24 }}>
      <View style={ui.row}>
        <View style={{ gap: 5 }}>
          <Text style={ui.title}>Giao dịch</Text>
          <Text style={ui.body}>Nhìn lại từng khoản thu, chi.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm giao dịch"
          onPress={() => setAdding(true)}
          style={styles.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="Tìm kiếm giao dịch"
          placeholder="Tìm giao dịch, danh mục, nguồn tiền..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa tìm kiếm"
            onPress={() => setQuery('')}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.month}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng trước"
          onPress={() => setMonth(shiftMonth(month, -1))}
          style={styles.monthArrow}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
        </Pressable>
        <View style={styles.monthLabel}>
          <Ionicons name="calendar-outline" size={16} color={colors.green} />
          <Text style={styles.monthText}>{monthLabel(month)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tháng sau"
          onPress={() => setMonth(shiftMonth(month, 1))}
          style={styles.monthArrow}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={filter === item.value}
            onPress={() => setFilter(item.value)}
          />
        ))}
      </ScrollView>

      <TransactionsSummary totals={totals} />
      <View style={styles.resultHeading}>
        <Text style={styles.resultCount}>{loading ? 'Đang tải…' : totalCount + ' giao dịch'}</Text>
        <Text style={styles.resultHint}>Theo bộ lọc đang chọn</Text>
      </View>
      {(filter === 'cash' || filter === 'bank' || filter === 'other') && (
        <Text style={styles.sourceHint}>
          Số tiền hiển thị là tổng giao dịch, kể cả giao dịch dùng nhiều nguồn.
        </Text>
      )}
    </View>
  );
}
