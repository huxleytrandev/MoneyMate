import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { TransactionList } from '@/components/organisms/TransactionList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { filters } from '@/constants/transaction-filters';
import { monthLabel, shiftMonth } from '@/helpers/date';
import { monthlyTotals } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { dayLabel } from '@/helpers/transaction-display';
import { useTransactionsScreen } from '@/hooks/useTransactionsScreen';
import { styles } from '@/screens/TransactionsScreen/TransactionsScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TransactionsSummary } from './TransactionsScreen.sections';
export default function TransactionsScreen() {
  const {
    setAdding,
    query,
    setQuery,
    setMonth,
    month,
    filter,
    setFilter,
    totals,
    transactions,
    search,
    grouped,
    state,
    adding,
  } = useTransactionsScreen();
  return (
    <ScreenTemplate>
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
        <Text style={styles.resultCount}>{transactions.length} giao dịch</Text>
        <Text style={styles.resultHint}>Theo bộ lọc đang chọn</Text>
      </View>
      {(filter === 'cash' || filter === 'bank' || filter === 'other') && (
        <Text style={styles.sourceHint}>
          Số tiền hiển thị là tổng giao dịch, kể cả giao dịch dùng nhiều nguồn.
        </Text>
      )}

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={30} color={colors.green} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có giao dịch phù hợp</Text>
          <Text style={styles.emptyBody}>
            {search || filter !== 'all'
              ? 'Thử đổi từ khóa hoặc bộ lọc để tìm khoản thu, chi của bạn.'
              : 'Bắt đầu ghi lại một khoản thu hoặc chi trong tháng này.'}
          </Text>
        </View>
      ) : (
        [...grouped.entries()].map(([day, items]) => {
          const dailyTotals = monthlyTotals(items);
          const net = dailyTotals.income - dailyTotals.expense;
          return (
            <View key={day} style={styles.dayGroup}>
              <View style={ui.row}>
                <Text style={styles.dayTitle}>{dayLabel(day)}</Text>
                <Text
                  style={[
                    styles.dayTotal,
                    { color: net > 0 ? '#16A34A' : net < 0 ? colors.expense : colors.muted },
                  ]}
                >
                  {net > 0 ? '+' : net < 0 ? '−' : ''}
                  {formatMoney(Math.abs(net))}
                </Text>
              </View>
              <TransactionList transactions={items} state={state} />
            </View>
          );
        })
      )}
      <Button title="+ Ghi giao dịch mới" onPress={() => setAdding(true)} />
      {adding && <TransactionForm onClose={() => setAdding(false)} />}
    </ScreenTemplate>
  );
}
