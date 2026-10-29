import { useState } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { useDirtyFields } from '@/hooks/useDirtyFields';
import { categorySchema } from '@/schemas/finance.schema';
import { categoryIconName, categoryColor } from '@/helpers/category';
import type { Category } from '@/types/finance.types';
export function useCategoryEditor({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(categoryIconName(category));
  const [color, setColor] = useState(categoryColor(category));
  const [error, setError] = useState('');
  const { updateCategory, removeRecord, busy } = useFinance();
  const dirty = useDirtyFields({ name, icon, color });
  async function persistCategory(nextCategory: Category) {
    const parsed = categorySchema.safeParse({ name, icon, color, kind: category.kind });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await updateCategory({ ...nextCategory, ...parsed.data });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu danh mục.');
    }
  }
  function archiveCategory() {
    void persistCategory({ ...category, isArchived: true });
  }
  function restoreCategory() {
    void persistCategory({ ...category, isArchived: false });
  }
  async function removeCategory() {
    await removeRecord('categories', category.id, category.version);
    onClose();
  }
  return {
    name,
    setName,
    icon,
    setIcon,
    color,
    setColor,
    error,
    dirty,
    busy,
    category,
    onClose,
    persistCategory,
    archiveCategory,
    restoreCategory,
    removeCategory,
  };
}
