import { MonthSwitcher } from '@/components/molecules/MonthSwitcher';
import { CategoryBudgetSummary } from '@/components/organisms/CategoryBudgetSummary';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Settings2 from 'lucide-react-native/icons/settings-2';
import { Button } from '@/components/atoms/Button';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { TransactionRow } from '@/components/organisms/TransactionList';
import { TransactionForm } from '@/components/organisms/TransactionForm';
import { CategoryEditor } from '@/components/organisms/CategoryEditor';
import { PlanEditor } from '@/components/organisms/PlanEditor';
import { useCategoryDetail } from '@/hooks/useCategoryDetail';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { Transaction } from '@/types/finance.types';
type Model = ReturnType<typeof useCategoryDetail>;
function DetailHeader({ model }: { model: Model }) {
  const category = model.category;
  if (!category)
    return (
      <View style={styles.block}>
        {model.monthlyLoading ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <Text style={ui.error}>{model.monthlyError || 'Danh mục không còn tồn tại.'}</Text>
        )}
      </View>
    );
  return (
    <View style={styles.block}>
      <View style={ui.row}>
        <CategoryIcon category={category} size={56} />
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ui.title}>{category.name}</Text>
          <Text style={ui.body}>
            {category.kind === 'expense' ? 'Danh mục chi tiêu' : 'Danh mục thu nhập'}
            {category.isArchived ? ' · Đã lưu trữ' : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chỉnh sửa danh mục"
          onPress={() => model.setEditor({ type: 'category' })}
          style={styles.iconButton}
        >
          <Settings2 size={21} color={colors.green} />
        </Pressable>
      </View>
      <MonthSwitcher month={model.month} onChange={model.setMonth} />
      <CategoryBudgetSummary
        planned={model.planned}
        actual={model.actual}
        kind={category.kind}
        loading={model.monthlyLoading}
        error={model.monthlyError}
      />
      {!category.isArchived && (
        <View style={{ gap: 8 }}>
          <Button
            title={category.kind === 'expense' ? '+ Thêm khoản chi' : '+ Thêm khoản thu'}
            onPress={() => model.setEditor({ type: 'new' })}
            disabled={model.monthlyLoading}
          />
          <Button
            title="Chỉnh sửa kế hoạch tháng"
            variant="text"
            onPress={() => model.setEditor({ type: 'plan' })}
            disabled={model.monthlyLoading}
          />
        </View>
      )}
      <Text style={ui.heading}>
        Giao dịch trong tháng{model.loading ? '' : ' · ' + model.page.totals.total}
      </Text>
    </View>
  );
}
function DetailFooter({ model }: { model: Model }) {
  return (
    <View style={styles.block}>
      {!!model.error && (
        <>
          <Text accessibilityRole="alert" style={ui.error}>
            {model.error}
          </Text>
          <Button title="Thử tải lại" variant="text" onPress={model.retry} />
        </>
      )}
      {!!model.monthlyError && (
        <>
          <Text style={ui.error}>{model.monthlyError}</Text>
          <Button title="Tải lại tổng hợp" variant="text" onPress={model.retryMonth} />
        </>
      )}
      {model.page.page.hasMore && !model.error && (
        <Button
          title="Tải thêm giao dịch"
          variant="secondary"
          loading={model.loadingMore}
          onPress={() => void model.loadMore()}
        />
      )}
    </View>
  );
}
function DetailEditors({ model }: { model: Model }) {
  const { category, editor } = model;
  if (!category || !editor) return null;
  const close = () => model.setEditor(null);
  if (editor.type === 'category') return <CategoryEditor category={category} onClose={close} />;
  if (editor.type === 'plan')
    return <PlanEditor category={category} month={model.month} onClose={close} />;
  if (editor.type === 'transaction')
    return <TransactionForm transaction={editor.transaction} onClose={close} />;
  return <TransactionForm initialCategory={category} initialMonth={model.month} onClose={close} />;
}
export default function CategoryDetailScreen({
  id,
  initialMonth,
}: {
  id: string;
  initialMonth: string;
}) {
  const router = useRouter();
  const model = useCategoryDetail(id, initialMonth);
  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <View style={styles.item}>
        <TransactionRow
          transaction={item}
          assetsById={model.index.assets}
          categoriesById={model.index.categories}
          onEdit={(transaction) => model.setEditor({ type: 'transaction', transaction })}
        />
      </View>
    ),
    [model.index, model.setEditor],
  );
  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.navigation}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại ngân sách"
          style={styles.iconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/budget'))}
        >
          <ArrowLeft color={colors.ink} size={23} />
        </Pressable>
        <Text style={ui.heading}>Chi tiết danh mục</Text>
      </View>
      <FlatList
        data={model.page.data}
        keyExtractor={(transaction) => transaction.id}
        renderItem={renderItem}
        ListHeaderComponent={<DetailHeader model={model} />}
        ListFooterComponent={<DetailFooter model={model} />}
        ListEmptyComponent={
          <View style={styles.block}>
            {model.loading ? (
              <ActivityIndicator color={colors.green} />
            ) : (
              !model.error && <Text style={ui.body}>Chưa có giao dịch trong tháng này.</Text>
            )}
          </View>
        }
        onEndReached={() => void model.loadMore()}
        onEndReachedThreshold={0.35}
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={{
          paddingBottom: 32,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
        }}
      />
      <DetailEditors model={model} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  block: { padding: 24, gap: 20 },
  item: { paddingHorizontal: 24, paddingBottom: 12 },
});
