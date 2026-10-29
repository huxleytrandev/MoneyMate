import { MonthSwitcher } from '@/components/molecules/MonthSwitcher';
import { useRouter } from 'expo-router';
import { Button } from '@/components/atoms/Button';
import { PlanCard } from '@/components/molecules/PlanCard';
import { BudgetComparisonChart } from '@/components/organisms/BudgetComparisonChart';
import { BudgetSummary } from '@/components/organisms/BudgetSummary';
import { CategoryEditor } from '@/components/organisms/CategoryEditor';
import { NewBudgetCategory } from '@/components/organisms/NewBudgetCategory';
import { PlanEditor } from '@/components/organisms/PlanEditor';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useBudgetScreen } from '@/hooks/useBudgetScreen';
import { styles } from '@/screens/BudgetScreen/BudgetScreen.styles';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
export default function BudgetScreen() {
  const router = useRouter();
  const {
    loading,
    error,
    retry,
    setAddingCategory,
    setMonth,
    month,
    kind,
    setKind,
    plannedCount,
    planned,
    actual,
    overspent,
    complete,
    remaining,
    message,
    rows,
    maxValue,
    setCategoryEditor,
    setEditor,
    categoryEditor,
    editor,
    addingCategory,
  } = useBudgetScreen();
  return (
    <ScreenTemplate>
      <View style={ui.row}>
        <View style={{ gap: 5 }}>
          <Text style={ui.title}>Ngân sách</Text>
          <Text style={ui.body}>Chủ động từng khoản thu, chi.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm danh mục và kế hoạch"
          onPress={() => setAddingCategory(true)}
          style={styles.add}
        >
          <Ionicons name="add" size={25} color="white" />
        </Pressable>
      </View>

      <MonthSwitcher month={month} onChange={setMonth} />

      <View style={styles.segment}>
        {(
          [
            { value: 'expense', label: 'Chi tiêu' },
            { value: 'income', label: 'Thu nhập' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: kind === item.value }}
            onPress={() => setKind(item.value)}
            style={[styles.segmentButton, kind === item.value && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, kind === item.value && { color: 'white' }]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.green} />}
      {!!error && (
        <View style={{ gap: 12 }}>
          <Text style={ui.error}>{error}</Text>
          <Button title="Thử lại" onPress={retry} />
        </View>
      )}
      {!loading && !error && (
        <>
          <BudgetSummary
            plannedCount={plannedCount}
            planned={planned}
            actual={actual}
            overspent={overspent}
            complete={complete}
            remaining={remaining}
            message={message}
            categoryCount={rows.length}
          />

          <BudgetComparisonChart rows={rows} maxValue={maxValue} kind={kind} />

          <View style={ui.row}>
            <Text style={styles.sectionTitle}>Theo danh mục</Text>
            <Text style={styles.coverage}>{rows.length} danh mục</Text>
          </View>
          <View style={{ gap: 12 }}>
            {rows.map((row) => (
              <PlanCard
                key={row.category.id}
                category={row.category}
                planned={row.planned}
                actual={row.actual}
                onOpen={() =>
                  router.push({
                    pathname: '/category/[id]',
                    params: { id: row.category.id, month },
                  })
                }
                onEdit={() => setEditor(row.category)}
                onManage={() => setCategoryEditor(row.category)}
              />
            ))}
          </View>
        </>
      )}
      <Button
        title="+ Thêm danh mục và kế hoạch"
        variant="text"
        onPress={() => setAddingCategory(true)}
      />
      {categoryEditor && (
        <CategoryEditor category={categoryEditor} onClose={() => setCategoryEditor(null)} />
      )}
      {editor && <PlanEditor category={editor} month={month} onClose={() => setEditor(null)} />}
      {addingCategory && (
        <NewBudgetCategory kind={kind} month={month} onClose={() => setAddingCategory(false)} />
      )}
    </ScreenTemplate>
  );
}
