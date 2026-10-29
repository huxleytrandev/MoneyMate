import { Snackbar, Portal } from 'react-native-paper';
import { colors } from '@/theme/colors';
import { FinanceBoundary } from '@/components/templates/FinanceBoundary';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useFinanceMutation } from '@/hooks/useFinanceMutation';
import { createFinanceActions } from '@/services/finance-actions.service';
import type { FinanceContextValue } from '@/types/finance-context.types';
import { createContext, useState, type PropsWithChildren } from 'react';

export const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const data = useFinanceData();
  const [notifying, setNotifying] = useState(false);
  const mutation = useFinanceMutation({
    refresh: data.refresh,
    setError: data.setError,
    onSaved: () => setNotifying(true),
  });
  const actions = createFinanceActions({
    getState: data.getState,
    getStateForMonth: data.getStateForMonth,
    execute: mutation.execute,
  });
  return (
    <FinanceContext.Provider
      value={{
        state: data.state,
        monthStates: data.monthStates,
        revision: data.revision,
        loadMonth: data.loadMonth,
        refresh: data.refresh,
        busy: mutation.busy,
        ...actions,
      }}
    >
      <FinanceBoundary loading={data.loading} error={data.error} onRetry={data.retry}>
        {children}
      </FinanceBoundary>
      <Portal>
        <Snackbar
          key={data.revision}
          visible={notifying}
          onDismiss={() => setNotifying(false)}
          duration={2500}
          style={{ backgroundColor: colors.ink }}
          action={{ label: 'Đóng', onPress: () => setNotifying(false), textColor: colors.lime }}
        >
          Đã lưu thay đổi.
        </Snackbar>
      </Portal>
    </FinanceContext.Provider>
  );
}
