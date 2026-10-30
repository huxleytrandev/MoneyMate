import { Text } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { CategoryAppearancePicker } from '@/components/molecules/CategoryAppearancePicker';
import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { useCategoryEditor } from '@/hooks/useCategoryEditor';
import { ui } from '@/theme/layout';
export function CategoryEditor(props: Parameters<typeof useCategoryEditor>[0]) {
  const model = useCategoryEditor(props);
  return (
    <SheetTemplate
      title="Chỉnh sửa danh mục"
      onClose={model.onClose}
      dirty={model.dirty}
      busy={model.busy}
    >
      <FormField
        label="Tên danh mục"
        value={model.name}
        onChangeText={model.setName}
        editable={!model.busy}
      />
      <CategoryAppearancePicker
        kind={model.category.kind}
        icon={model.icon}
        color={model.color}
        onIconChange={model.setIcon}
        onColorChange={model.setColor}
      />
      {!!model.error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {model.error}
        </Text>
      )}
      <Button
        title="Lưu danh mục"
        onPress={() => void model.persistCategory(model.category)}
        loading={model.busy}
      />
      <Button
        title={model.category.isArchived ? 'Sử dụng lại danh mục' : 'Lưu trữ danh mục'}
        variant="secondary"
        disabled={model.busy}
        onPress={model.category.isArchived ? model.restoreCategory : model.archiveCategory}
      />
      <Text style={ui.body}>Lưu trữ sẽ giữ nguyên giao dịch và thống kê trước đây.</Text>
      <ConfirmActionButton
        label="Xóa danh mục"
        title={'Xóa “' + model.category.name + '”?'}
        description="Chỉ xóa được danh mục chưa được sử dụng. Nếu đã có giao dịch hoặc kế hoạch, bạn có thể lưu trữ để giữ lịch sử."
        disabled={model.busy}
        onConfirm={model.removeCategory}
      />
    </SheetTemplate>
  );
}
