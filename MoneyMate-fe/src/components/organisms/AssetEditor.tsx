import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { FormField } from '@/components/molecules/FormField';
import { SheetTemplate } from '@/components/templates/SheetTemplate';
import { AssetAdjustmentHistory } from './AssetAdjustmentHistory';
import { useAssetEditor } from '@/hooks/useAssetEditor';
import { ui } from '@/theme/layout';
import { Text, View } from 'react-native';
export function AssetEditor(props: Parameters<typeof useAssetEditor>[0]) {
  const {
    asset,
    onClose,
    name,
    setName,
    type,
    setType,
    openingDate,
    setOpeningDate,
    busy,
    persistAsset,
    value,
    setValue,
    error,
    save,
    restoreAsset,
    archiveAsset,
    confirm,
    setConfirm,
    removeRecord,
    setError,
    history,
  } = useAssetEditor(props);
  return (
    <SheetTemplate title={asset ? 'Quản lý · ' + asset.name : 'Thêm tài sản'} onClose={onClose}>
      <FormField
        label="Tên tài sản"
        placeholder="Ví dụ: Vietcombank"
        value={name}
        onChangeText={setName}
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
            ).map((asset) => (
              <Chip
                key={asset.type}
                label={asset.label}
                selected={type === asset.type}
                onPress={() => setType(asset.type)}
              />
            ))}
          </View>
          <FormField
            label="Ngày bắt đầu (YYYY-MM-DD)"
            value={openingDate}
            onChangeText={setOpeningDate}
          />
        </>
      )}
      {asset && (
        <Button
          title="Lưu tên tài sản"
          variant="secondary"
          disabled={busy}
          onPress={() => asset && void persistAsset(asset)}
        />
      )}
      <FormField
        label={asset ? 'Giá trị thực tế hiện tại (VND)' : 'Giá trị ban đầu (VND)'}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
      />
      <Text style={ui.body}>
        {asset
          ? 'Đối soát ghi nhận chênh lệch tài sản; không tính vào thu nhập hoặc chi tiêu.'
          : 'Nhập số tiền bạn có ở ngày bắt đầu, sau đó ghi các giao dịch phát sinh từ ngày đó. Tài sản Khác dùng giá trị ước tính bằng VNĐ.'}
      </Text>
      {!!error && <Text style={ui.error}>{error}</Text>}
      <Button
        title={asset ? 'Lưu số dư đối soát' : 'Lưu tài sản'}
        onPress={() => void save()}
        loading={busy}
        disabled={asset?.isArchived}
      />
      {asset && (
        <>
          <Button
            title={asset.isArchived ? 'Sử dụng lại tài sản' : 'Lưu trữ tài sản'}
            variant="secondary"
            disabled={busy}
            onPress={asset.isArchived ? restoreAsset : archiveAsset}
          />
          <Button
            title={confirm ? 'Xác nhận xóa tài sản' : 'Xóa tài sản chưa sử dụng'}
            variant="text"
            disabled={busy}
            onPress={() => {
              if (!confirm) {
                setConfirm(true);
                return;
              }
              void removeRecord('assets', asset.id, asset.version)
                .then(onClose)
                .catch((failure) => setError(failure.message));
            }}
          />
          <Text style={ui.heading}>Lịch sử đối soát</Text>
          <AssetAdjustmentHistory
            history={history}
            busy={busy}
            onUndo={(adjustment) => {
              void removeRecord('adjustments', adjustment.id, adjustment.version)
                .then(onClose)
                .catch((failure) => setError(failure.message));
            }}
          />
        </>
      )}
    </SheetTemplate>
  );
}
