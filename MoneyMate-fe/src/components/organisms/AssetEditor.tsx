import { DateSelectField } from '@/components/molecules/DateSelectField';
import { dateKey } from '@/helpers/date';
import { Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { FormField } from '@/components/molecules/FormField';
import { MoneyField } from '@/components/molecules/MoneyField';
import { ConfirmActionButton } from '@/components/molecules/ConfirmActionButton';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { useAssetEditor } from '@/hooks/useAssetEditor';
import { ui } from '@/theme/layout';
import { AssetAdjustmentHistory } from './AssetAdjustmentHistory';
export function AssetEditor(props: Parameters<typeof useAssetEditor>[0]) {
  const model = useAssetEditor(props);
  const { asset, busy } = model;
  async function removeAsset() {
    if (!asset) return;
    await model.removeRecord('assets', asset.id, asset.version);
    model.onClose();
  }
  return (
    <SheetTemplate
      title={asset ? asset.name : 'Thêm tài sản'}
      onClose={model.onClose}
      dirty={model.dirty}
      busy={busy}
    >
      <FormField
        label="Tên tài sản"
        placeholder="Ví dụ: Vietcombank"
        value={model.name}
        onChangeText={model.setName}
        editable={!busy && !asset?.isArchived}
      />
      {!asset && (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                { type: 'cash', label: 'Tiền mặt' },
                { type: 'bank', label: 'Ngân hàng' },
                { type: 'other', label: 'Khác' },
              ] as const
            ).map((option) => (
              <Chip
                key={option.type}
                label={option.label}
                selected={model.type === option.type}
                onPress={() => model.setType(option.type)}
              />
            ))}
          </View>
          <DateSelectField
            label="Ngày bắt đầu"
            value={model.openingDate}
            onChange={model.setOpeningDate}
            maximum={dateKey(new Date())}
          />
        </>
      )}
      <MoneyField
        label={asset ? 'Số dư thực tế hiện tại' : 'Giá trị ban đầu'}
        value={model.value}
        onChangeText={model.setValue}
        sign={asset ? 'signed' : 'positive'}
        editable={!busy && !asset?.isArchived}
      />
      <Text style={ui.body}>
        {asset
          ? 'Đối soát cập nhật số dư thực tế, không tính vào thu nhập hoặc chi tiêu.'
          : 'Nhập số tiền bạn có ở ngày bắt đầu. Tài sản Khác dùng giá trị ước tính bằng VNĐ.'}
      </Text>
      {!!model.error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {model.error}
        </Text>
      )}
      <Button title="Lưu tài sản" onPress={() => void model.save()} loading={busy} />
      {asset && (
        <>
          <Button
            title={asset.isArchived ? 'Sử dụng lại tài sản' : 'Lưu trữ tài sản'}
            variant="secondary"
            disabled={busy || model.dirty}
            onPress={asset.isArchived ? model.restoreAsset : model.archiveAsset}
          />
          <ConfirmActionButton
            label="Xóa tài sản"
            title={'Xóa “' + asset.name + '”?'}
            disabled={busy}
            description="Chỉ xóa được tài sản chưa có phát sinh. Tài sản đã dùng nên được lưu trữ để giữ đúng lịch sử tài chính."
            onConfirm={removeAsset}
          />
          <Text style={ui.heading}>Lịch sử đối soát</Text>
          <AssetAdjustmentHistory
            history={model.history}
            busy={busy}
            onUndo={async (adjustment) => {
              await model.removeRecord('adjustments', adjustment.id, adjustment.version);
              model.onClose();
            }}
          />
        </>
      )}
    </SheetTemplate>
  );
}
