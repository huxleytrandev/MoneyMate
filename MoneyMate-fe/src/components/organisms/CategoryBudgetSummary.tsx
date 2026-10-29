import { ActivityIndicator, Text, View } from 'react-native';
import { planDescription } from '@/helpers/plan';
import { formatMoney } from '@/helpers/money';
import { colors } from '@/theme/colors';
import { ui } from '@/theme/layout';
import type { TransactionKind } from '@/types/finance.types';
interface Props {
  planned?: number;
  actual: number;
  kind: TransactionKind;
  loading: boolean;
  error: string;
}
export function CategoryBudgetSummary({ planned, actual, kind, loading, error }: Props) {
  if (loading) return <ActivityIndicator color={colors.green} />;
  if (error)
    return (
      <Text accessibilityRole="alert" style={ui.error}>
        {error}
      </Text>
    );
  const difference = planned === undefined ? undefined : planned - actual;
  const description = planDescription(kind, difference);
  const overBudget = kind === 'expense' && difference !== undefined && difference < 0;
  return (
    <View style={ui.card}>
      <Text style={ui.label}>DỰ KIẾN · PLANNED</Text>
      <Text style={ui.heading}>
        {planned === undefined ? 'Chưa đặt kế hoạch' : formatMoney(planned)}
      </Text>
      <Text style={ui.label}>THỰC TẾ · ACTUAL</Text>
      <Text style={ui.title}>{formatMoney(actual)}</Text>
      <Text style={{ color: overBudget ? colors.expense : colors.green }}>
        {description}
        {difference === undefined ? '' : formatMoney(Math.abs(difference))}
      </Text>
    </View>
  );
}
