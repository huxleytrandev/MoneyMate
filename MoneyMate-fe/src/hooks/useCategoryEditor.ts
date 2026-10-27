import { useFinance } from '@/hooks/useFinance';
import { categorySchema } from '@/schemas/finance.schema';
import type { Category } from '@/types/finance.types';
import { useState } from 'react';
export function useCategoryEditor({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const { name: initial } = category;
  const [name, setName] = useState(initial);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const { updateCategory, removeRecord, busy } = useFinance();
  async function persistCategory(nextCategory: Category) {
    const parsed = categorySchema.safeParse({ name, kind: category.kind });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await updateCategory({ ...nextCategory, name: parsed.data.name });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    }
  }

  function archiveCategory() {
    void persistCategory({ ...category, isArchived: true });
  }
  function restoreCategory() {
    void persistCategory({ ...category, isArchived: false });
  }

  return {
    onClose,
    name,
    setName,
    error,
    persistCategory,
    category,
    busy,
    restoreCategory,
    archiveCategory,
    confirm,
    setConfirm,
    removeRecord,
    setError,
  };
}
