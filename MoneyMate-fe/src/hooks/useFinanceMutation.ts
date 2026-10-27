import { ApiError } from '@/services/api.service';
import { useRef, useState } from 'react';

interface MutationDependencies {
  refresh: () => Promise<void>;
  setError: (message: string) => void;
}
export function useFinanceMutation({ refresh, setError }: MutationDependencies) {
  const writing = useRef(false);
  const [busy, setBusy] = useState(false);
  async function refreshAfterSave() {
    try {
      await refresh();
    } catch {
      setError('Đã lưu nhưng chưa tải lại được dữ liệu. Hãy kết nối lại trước khi thao tác tiếp.');
    }
  }
  async function refreshAfterConflict(failure: unknown) {
    if (!(failure instanceof ApiError) || failure.status !== 409) return;
    try {
      await refresh();
    } catch {
      setError('Chưa thể tải lại dữ liệu. Vui lòng thử lại.');
    }
  }
  async function execute<Result>(operation: () => Promise<Result>) {
    if (writing.current) throw new Error('Một thay đổi đang được lưu. Vui lòng chờ.');
    writing.current = true;
    setBusy(true);
    try {
      const result = await operation();
      await refreshAfterSave();
      return result;
    } catch (failure) {
      await refreshAfterConflict(failure);
      throw failure;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }
  return { busy, execute };
}
