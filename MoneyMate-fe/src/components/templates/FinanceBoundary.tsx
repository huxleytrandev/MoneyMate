import { Button } from '@/components/atoms/Button';
import { colors } from '@/theme/colors';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface FinanceBoundaryProps extends PropsWithChildren {
  loading: boolean;
  error: string;
  onRetry: () => Promise<void>;
}
export function FinanceBoundary({ children, loading, error, onRetry }: FinanceBoundaryProps) {
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  if (error)
    return (
      <View style={styles.error}>
        <Text>{error}</Text>
        <Button title="Tải lại dữ liệu" onPress={() => void onRetry()} />
      </View>
    );
  return children;
}
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
    backgroundColor: colors.background,
  },
});
