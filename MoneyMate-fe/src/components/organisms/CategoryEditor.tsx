import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { useCategoryEditor } from '@/hooks/useCategoryEditor';
import { ui } from '@/theme/layout';
import { Text } from 'react-native';
export function CategoryEditor(props: Parameters<typeof useCategoryEditor>[0]) {
  const {
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
  } = useCategoryEditor(props);
  return (
    <SheetTemplate title="Quản lý danh mục" onClose={onClose}>
      <FormField label="Tên danh mục" value={name} onChangeText={setName} />
      <Text style={ui.body}>
        Lưu trữ danh mục để ngừng sử dụng nhưng vẫn giữ lịch sử và thống kê.
      </Text>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button
        title="Lưu tên danh mục"
        onPress={() => void persistCategory(category)}
        loading={busy}
      />
      <Button
        title={category.isArchived ? 'Sử dụng lại danh mục' : 'Lưu trữ danh mục'}
        variant="secondary"
        disabled={busy}
        onPress={category.isArchived ? restoreCategory : archiveCategory}
      />
      <Button
        title={confirm ? 'Xác nhận xóa danh mục' : 'Xóa danh mục chưa sử dụng'}
        variant="text"
        disabled={busy}
        onPress={() => {
          if (!confirm) {
            setConfirm(true);
            return;
          }
          void removeRecord('categories', category.id, category.version)
            .then(onClose)
            .catch((failure) => setError(failure.message));
        }}
      />
    </SheetTemplate>
  );
}
