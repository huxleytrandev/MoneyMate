import { Button } from '@/components/atoms/Button';
import { StatisticsPanel } from '@/components/organisms/StatisticsPanel';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { TransactionList } from '@/components/organisms/TransactionList';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { formatMoney } from '@/helpers/money';
import { useDashboardScreen } from '@/hooks/useDashboardScreen';
import { styles } from '@/screens/DashboardScreen/DashboardScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import {
  DashboardAssetAccounts,
  DashboardAssetTotal,
  DashboardBudgetStatus,
} from './DashboardScreen.sections';
export default function DashboardScreen(props: Parameters<typeof useDashboardScreen>[0]) {
  const {
    displayName,
    onProfile,
    state,
    onAssets,
    total,
    balances,
    groups,
    onBudget,
    complete,
    remaining,
    usage,
    totals,
    planned,
    missing,
    onTransactions,
    transactions,
    refreshError,
    refresh,
    setRefreshError,
    setAdd,
    add,
  } = useDashboardScreen(props);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTemplate>
        <View style={ui.row}>
          <View style={{ gap: 4 }}>
            <Text style={ui.body}>Xin chào,</Text>
            <Text style={ui.heading}>{displayName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở hồ sơ tài khoản"
            onPress={onProfile}
            style={styles.circle}
          >
            <Ionicons name="person-circle-outline" size={23} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.connection}>
          <View style={styles.dot} />
          <Text style={styles.connectionText}>Đã kết nối tài khoản · Đơn vị VNĐ</Text>
        </View>
        {state.assets.length === 0 && (
          <View style={ui.note}>
            <Text style={ui.body}>
              Chào mừng bạn! Hãy nhập tiền mặt, tài khoản ngân hàng và các tài sản đang có trước khi
              ghi thu chi.
            </Text>
            <Button title="Thiết lập tài sản ban đầu" variant="text" onPress={onAssets} />
          </View>
        )}
        <DashboardAssetTotal total={total} balances={balances} groups={groups} />
        <View style={ui.row}>
          <Text style={ui.heading}>Nguồn tiền</Text>
          <Pressable accessibilityRole="button" onPress={onAssets} hitSlop={12}>
            <Text style={styles.link}>XEM TẤT CẢ</Text>
          </Pressable>
        </View>
        <DashboardAssetAccounts balances={balances} onAssets={onAssets} />
        <DashboardBudgetStatus
          onBudget={onBudget}
          complete={complete}
          remaining={remaining}
          usage={usage}
          totals={totals}
          planned={planned}
          missing={missing}
        />
        <View style={ui.row}>
          <View style={[styles.monthMetric, { backgroundColor: colors.softGreen }]}>
            <Text style={ui.body}>Thu nhập tháng</Text>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[styles.metric, { color: colors.income }]}
            >
              {formatMoney(totals.income)}
            </Text>
          </View>
          <View style={[styles.monthMetric, { backgroundColor: colors.surface }]}>
            <Text style={ui.body}>Chi tiêu tháng</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.metric}>
              {formatMoney(totals.expense)}
            </Text>
          </View>
        </View>
        <View style={ui.row}>
          <Text style={ui.heading}>Giao dịch gần đây</Text>
          <Pressable accessibilityRole="button" onPress={onTransactions} hitSlop={12}>
            <Text style={styles.link}>XEM TẤT CẢ</Text>
          </Pressable>
        </View>
        <TransactionList transactions={transactions.slice(0, 3)} state={state} />
        {!!refreshError && <Text style={ui.error}>{refreshError}</Text>}
        <Button
          title="Đồng bộ dữ liệu mới nhất"
          variant="text"
          onPress={() =>
            void refresh()
              .then(() => setRefreshError(''))
              .catch((failure) => setRefreshError(failure.message))
          }
        />
        <StatisticsPanel />
      </ScreenTemplate>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Thêm giao dịch"
        onPress={() => (state.assets.length ? setAdd(true) : onAssets())}
        style={styles.fab}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
      {add && <TransactionForm onClose={() => setAdd(false)} />}
    </View>
  );
}
