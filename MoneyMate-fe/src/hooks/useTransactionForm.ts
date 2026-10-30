import { dateKey, localDateTime, timeKey } from '@/helpers/date';
import { availableSources, defaultSource, cashAllocations } from '@/helpers/payment-source';
import { assetBalance } from '@/helpers/finance';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { categorySchema, transactionSchema } from '@/schemas/finance.schema';
import { useDirtyFields } from './useDirtyFields';
import type { Category, Transaction, TransactionKind } from '@/types/finance.types';
import { useState } from 'react';
export function useTransactionForm({
  onClose,
  transaction,
  initialCategory,
  initialMonth,
}: {
  onClose: () => void;
  transaction?: Transaction;
  initialCategory?: Category;
  initialMonth?: string;
}) {
  const { state, saveTransaction, addCategory, removeRecord, busy } = useFinance();
  const [now] = useState(() => new Date(transaction?.occurredAt ?? Date.now()));
  const [recordId] = useState(() => transaction?.id ?? createId());
  const [kind, setKindValue] = useState<TransactionKind>(
    transaction?.kind ?? initialCategory?.kind ?? 'expense',
  );
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [date, setDate] = useState(
    initialMonth && !transaction && initialMonth !== dateKey(now).slice(0, 7)
      ? initialMonth + '-01'
      : dateKey(now),
  );
  const [time, setTime] = useState(timeKey(now));
  const [categoryId, setCategory] = useState(transaction?.categoryId ?? initialCategory?.id ?? '');
  const [chosenSource, setSource] = useState(
    transaction?.allocations.length === 1 ? transaction.allocations[0].assetId : '',
  );
  const [sourceType, setSourceType] = useState(
    state.assets.find((asset) => asset.id === transaction?.allocations[0]?.assetId)?.type ?? 'cash',
  );
  const [allocationMode, setAllocationMode] = useState<'source' | 'split'>(
    transaction && transaction.allocations.length > 1 ? 'split' : 'source',
  );
  const sources = availableSources(state.assets, sourceType);
  const source = allocationMode === 'split' ? '' : defaultSource(sources, chosenSource);
  const activeAssets = state.assets.filter((asset) => !asset.isArchived);
  const automaticCash = allocationMode === 'source' && sourceType === 'cash';
  const directSource = automaticCash || !!source;
  const balances = new Map(activeAssets.map((asset) => [asset.id, assetBalance(state, asset.id)]));
  function selectSourceType(type: typeof sourceType) {
    if (
      allocationMode === 'source' &&
      sourceType === type &&
      (!chosenSource || sources.some((asset) => asset.id === chosenSource))
    )
      return;
    setSourceType(type);
    setSource('');
    setAllocationMode('source');
    setError('');
  }
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [stage, setStage] = useState<'details' | 'allocation'>('details');
  const [shares, setShares] = useState<Record<string, string>>(
    Object.fromEntries(
      (transaction?.allocations ?? []).map((allocation) => [
        allocation.assetId,
        String(allocation.amount),
      ]),
    ),
  );
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [customIcon, setNewIcon] = useState('');
  function setKind(next: TransactionKind) {
    setKindValue(next);
    setNewIcon('');
  }
  const newIcon = customIcon || (kind === 'income' ? 'wallet' : 'receipt');
  const [newColor, setNewColor] = useState('#0F766E');
  const dirty = useDirtyFields({
    kind,
    title,
    amount,
    date,
    time,
    categoryId,
    source,
    sourceType,
    allocationMode,
    shares,
    newCategory,
    newIcon,
    newColor,
  });
  const categories = state.categories.filter(
    (category) => category.kind === kind && !category.isArchived,
  );

  function splitAllocations() {
    return activeAssets
      .filter((asset) => (shares[asset.id] ?? '').trim() !== '' && Number(shares[asset.id]) !== 0)
      .map((asset) => ({ assetId: asset.id, amount: shares[asset.id] }));
  }
  function submitDetails() {
    if (
      allocationMode === 'source' &&
      chosenSource &&
      !sources.some((asset) => asset.id === chosenSource)
    ) {
      setError('Nguồn tiền cũ không còn khả dụng. Hãy chọn lại loại nguồn tiền trước khi lưu.');
      return;
    }
    if (automaticCash) {
      if (!sources.length) {
        setError('Bạn chưa có tài sản tiền mặt. Hãy thêm tại màn hình Tài sản.');
        return;
      }
      void persistTransaction(
        cashAllocations({
          assets: source ? sources.filter((asset) => asset.id === source) : sources,
          amount: Number(amount),
          kind,
          balances,
        }),
      );
      return;
    }
    if (allocationMode === 'source' && !source) {
      setError(
        sources.length
          ? 'Chọn một tài khoản bên dưới hoặc chọn phân bổ nhiều nguồn.'
          : 'Bạn chưa có nguồn tiền loại này. Hãy thêm tài sản hoặc chọn nguồn khác.',
      );
      return;
    }
    if (!activeAssets.length) {
      setError('Thêm tài sản trước khi ghi giao dịch.');
      return;
    }
    if (source) {
      void persistTransaction([{ assetId: source, amount }]);
      return;
    }
    const validation = transactionSchema.safeParse({
      title,
      kind,
      categoryId,
      amount,
      date,
      time,
      allocations: [{ assetId: activeAssets[0]?.id ?? '', amount }],
    });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    setError('');
    setStage('allocation');
  }
  function submitAllocation() {
    void persistTransaction(splitAllocations());
  }
  async function persistTransaction(allocations: { assetId: string; amount: string }[]) {
    setError('');
    const result = transactionSchema.safeParse({
      title,
      kind,
      categoryId,
      amount,
      date,
      time,
      allocations,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    const occurredAt = localDateTime(date, time);
    if (!occurredAt) {
      setError('Ngày giờ không hợp lệ.');
      return;
    }
    if (Date.parse(occurredAt) > Date.now() + 60000) {
      setError('Ngày giờ phát sinh không được ở tương lai.');
      return;
    }
    const invalidSource = allocations.some((allocation) => {
      const asset = activeAssets.find((candidate) => candidate.id === allocation.assetId);
      return !asset || (asset.openingAt && Date.parse(asset.openingAt) > Date.parse(occurredAt));
    });
    if (invalidSource) {
      setError('Nguồn tiền không khả dụng hoặc ngày phát sinh trước ngày bắt đầu tài sản.');
      return;
    }
    const timestamp = new Date().toISOString();
    try {
      await saveTransaction({
        id: recordId,
        version: transaction?.version,
        title: result.data.title,
        kind,
        categoryId,
        amount: result.data.amount,
        occurredAt,
        createdAt: timestamp,
        updatedAt: timestamp,
        allocations: result.data.allocations,
      });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu giao dịch.');
    }
  }
  async function createCategory() {
    const result = categorySchema.safeParse({
      name: newCategory,
      kind,
      icon: newIcon,
      color: newColor,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (
      categories.some(
        (category) =>
          category.name.toLocaleLowerCase('vi') === result.data.name.toLocaleLowerCase('vi'),
      )
    ) {
      setError('Danh mục này đã có. Hãy chọn trong danh sách.');
      return;
    }
    const category = { id: createId(), ...result.data };
    try {
      const saved = await addCategory(category);
      setCategory(saved.id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể tạo danh mục.');
      return;
    }
    setNewCategory('');
    setCreatingCategory(false);
    setError('');
  }

  return {
    stage,
    transaction,
    onClose,
    kind,
    setKind,
    setCategory,
    setError,
    amount,
    setAmount,
    title,
    setTitle,
    date,
    setDate,
    time,
    setTime,
    categories,
    categoryId,
    creatingCategory,
    setCreatingCategory,
    newCategory,
    setNewCategory,
    createCategory,
    busy,
    sourceType,
    setSourceType: selectSourceType,
    allocationMode,
    setAllocationMode,
    sources,
    directSource,
    activeAssets,
    setSource,
    state,
    source,
    shares,
    setShares,
    setStage,
    error,
    submitAllocation,
    submitDetails,
    dirty,
    newIcon,
    setNewIcon,
    newColor,
    setNewColor,
    removeRecord,
  };
}
