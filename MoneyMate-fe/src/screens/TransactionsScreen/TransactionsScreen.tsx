import { Button } from '@/components/atoms/Button';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { TransactionRow } from '@/components/organisms/TransactionList';
import { dayLabel } from '@/helpers/transaction-display';
import { financeIndex } from '@/helpers/finance';
import { formatMoney } from '@/helpers/money';
import { useTransactionsScreen } from '@/hooks/useTransactionsScreen';
import { styles } from './TransactionsScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Transaction } from '@/types/finance.types';
import type { TransactionDaySection } from '@/types/transaction-page.types';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionScreenHeader } from './TransactionScreenHeader';

function SectionHeading({ section }: { section: TransactionDaySection }) {
  const net = section.income - section.expense;
  return (
    <View style={[ui.row, layout.sectionHeading]}>
      <Text style={styles.dayTitle}>{dayLabel(section.key)}</Text>
      <Text
        style={[
          styles.dayTotal,
          { color: net > 0 ? '#16A34A' : net < 0 ? colors.expense : colors.muted },
        ]}
      >
        {section.partial ? 'Đã tải: ' : ''}
        {net > 0 ? '+' : net < 0 ? '−' : ''}
        {formatMoney(Math.abs(net))}
      </Text>
    </View>
  );
}
function EmptyTransactions({ model }: { model: ReturnType<typeof useTransactionsScreen> }) {
  if (model.loading) return <ActivityIndicator color={colors.green} style={{ padding: 28 }} />;
  if (model.error)
    return (
      <View style={styles.empty}>
        <Text style={ui.error}>{model.error}</Text>
        <Button title="Thử lại" onPress={model.retry} />
      </View>
    );
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Chưa có giao dịch phù hợp</Text>
      <Text style={styles.emptyBody}>
        {model.search || model.filter !== 'all'
          ? 'Thử đổi từ khóa hoặc bộ lọc để tìm khoản thu, chi của bạn.'
          : 'Bắt đầu ghi lại một khoản thu hoặc chi trong tháng này.'}
      </Text>
    </View>
  );
}
function TransactionFooter({ model }: { model: ReturnType<typeof useTransactionsScreen> }) {
  return (
    <View style={layout.footer}>
      {!!model.error && model.transactions.length > 0 && (
        <>
          <Text style={ui.error}>{model.error}</Text>
          <Button title="Thử lại" variant="text" onPress={model.retry} />
        </>
      )}
      {model.hasMore && !model.error && (
        <Button
          title="Tải thêm giao dịch"
          variant="secondary"
          loading={model.loadingMore}
          onPress={() => void model.loadMore()}
        />
      )}
      <Button title="+ Ghi giao dịch mới" onPress={() => model.setAdding(true)} />
    </View>
  );
}
export default function TransactionsScreen() {
  const model = useTransactionsScreen();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const index = useMemo(() => financeIndex(model.state), [model.state]);
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <View style={layout.item}>
        <TransactionRow
          transaction={item}
          assetsById={index.assets}
          categoriesById={index.categories}
          onEdit={setEditing}
        />
      </View>
    ),
    [index],
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={layout.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SectionList<Transaction, TransactionDaySection>
          sections={model.sections}
          keyExtractor={(transaction) => transaction.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => <SectionHeading section={section} />}
          ListHeaderComponent={<TransactionScreenHeader model={model} />}
          ListEmptyComponent={<EmptyTransactions model={model} />}
          ListFooterComponent={<TransactionFooter model={model} />}
          onEndReached={() => void model.loadMore()}
          onEndReachedThreshold={0.4}
          initialNumToRender={12}
          maxToRenderPerBatch={20}
          windowSize={7}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={layout.page}
        />
      </KeyboardAvoidingView>
      {model.adding && <TransactionForm onClose={() => model.setAdding(false)} />}
      {editing && <TransactionForm transaction={editing} onClose={() => setEditing(null)} />}
    </SafeAreaView>
  );
}
const layout = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 24, paddingBottom: 44 },
  item: { paddingBottom: 10 },
  sectionHeading: { paddingTop: 24, paddingBottom: 12 },
  footer: { gap: 16, marginTop: 24 },
});
