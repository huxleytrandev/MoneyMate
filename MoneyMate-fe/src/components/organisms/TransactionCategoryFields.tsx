import { Button } from '@/components/atoms/Button';
import { CategoryOption } from '@/components/molecules/CategoryOption';
import { CategoryAppearancePicker } from '@/components/molecules/CategoryAppearancePicker';
import { FormField } from '@/components/molecules/FormField';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { ui } from '@/theme/layout';
import { Text, View } from 'react-native';
export function TransactionCategoryFields({
  model,
}: {
  model: Pick<
    ReturnType<typeof useTransactionForm>,
    | 'kind'
    | 'categories'
    | 'categoryId'
    | 'setCategory'
    | 'creatingCategory'
    | 'setCreatingCategory'
    | 'newCategory'
    | 'setNewCategory'
    | 'createCategory'
    | 'busy'
    | 'newIcon'
    | 'setNewIcon'
    | 'newColor'
    | 'setNewColor'
  >;
}) {
  const {
    categories,
    categoryId,
    setCategory,
    creatingCategory,
    setCreatingCategory,
    newCategory,
    setNewCategory,
    createCategory,
    busy,
  } = model;
  return (
    <>
      <Text style={ui.heading}>Danh mục bắt buộc</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <CategoryOption
            key={category.id}
            category={category}
            selected={categoryId === category.id}
            onPress={() => setCategory(category.id)}
          />
        ))}
      </View>
      <Button
        title={creatingCategory ? 'Ẩn tạo danh mục' : '+ Thêm danh mục'}
        variant="text"
        onPress={() => setCreatingCategory((value) => !value)}
      />
      {creatingCategory && (
        <View style={{ gap: 10 }}>
          <FormField
            label="Tên danh mục mới"
            placeholder="Ví dụ: Mua sắm"
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <CategoryAppearancePicker
            kind={model.kind}
            icon={model.newIcon}
            color={model.newColor}
            onIconChange={model.setNewIcon}
            onColorChange={model.setNewColor}
          />
          <Button
            title="Tạo danh mục"
            variant="secondary"
            onPress={() => void createCategory()}
            loading={busy}
          />
        </View>
      )}
    </>
  );
}
