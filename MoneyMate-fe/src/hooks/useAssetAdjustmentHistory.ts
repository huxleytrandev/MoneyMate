import { useEffect, useState } from 'react';
import { useFinance } from './useFinance';
import { fetchAssetAdjustments } from '@/services/finance.service';
import { mapAdjustment } from '@/helpers/api';
import type { Adjustment } from '@/types/finance.types';
import type { ApiPagination } from '@/types/api.types';
interface LoadedHistory {
  key: string;
  records: Adjustment[];
  pagination: ApiPagination;
  error: string;
}
const historyPageSize = 30;
export function useAssetAdjustmentHistory(assetId?: string) {
  const { revision } = useFinance();
  const [selection, setSelection] = useState({ assetId, page: 1 });
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedHistory | null>(null);
  const page = selection.assetId === assetId ? selection.page : 1;
  const key = [assetId, page, revision, attempt].join(':');
  useEffect(() => {
    if (!assetId) return;
    const controller = new AbortController();
    fetchAssetAdjustments({ assetId, page }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(result.pagination.total / historyPageSize));
        if (page > lastPage) {
          setSelection({ assetId, page: lastPage });
          return;
        }
        setLoaded({
          key,
          records: result.data.map(mapAdjustment),
          pagination: result.pagination,
          error: '',
        });
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted)
          setLoaded({
            key,
            records: [],
            pagination: { page, limit: historyPageSize, total: 0 },
            error: failure.message,
          });
      });
    return () => controller.abort();
  }, [assetId, page, key]);
  const matches = loaded?.key === key;
  const records = matches ? loaded.records : [];
  const error = matches ? loaded.error : '';
  const total = matches ? loaded.pagination.total : 0;
  return {
    records,
    error,
    loading: Boolean(assetId) && !matches,
    page,
    total,
    pageCount: Math.max(1, Math.ceil(total / historyPageSize)),
    hasPrevious: page > 1,
    hasNext: page * historyPageSize < total,
    previous: () => setSelection({ assetId, page: Math.max(1, page - 1) }),
    next: () => setSelection({ assetId, page: page + 1 }),
    retry: () => setAttempt((value) => value + 1),
  };
}
