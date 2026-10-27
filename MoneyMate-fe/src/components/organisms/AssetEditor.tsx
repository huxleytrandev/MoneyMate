import { createDemoId } from '@/helpers/id';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useFinance } from '@/hooks/useFinance';
import { assetBalance } from '@/helpers/finance';
import { assetSchema, amountSchema } from '@/schemas/finance.schema';
import type { Asset, AssetKind } from '@/types/finance.types';
import { SheetTemplate } from '../templates/SheetTemplate';
import { FormField } from '../molecules/FormField';
import { Chip } from '../atoms/Chip';
import { Button } from '../atoms/Button';
import { ui } from '@/theme/layout';
export function AssetEditor({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const { state, addAsset, adjustAsset } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetKind>('cash');
  const [value, setValue] = useState(asset ? String(assetBalance(state, asset.id)) : '');
  const [error, setError] = useState('');
  function save() {
    if (asset) {
      const result = amountSchema.safeParse(value);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      adjustAsset(asset.id, result.data);
    } else {
      const result = assetSchema.safeParse({ name, type, openingValue: value });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      addAsset({ id: createDemoId(), ...result.data });
    }
    onClose();
  }
  return (
    <SheetTemplate title={asset ? 'Đối soát · ' + asset.name : 'Thêm tài sản'} onClose={onClose}>
      {!asset && (
        <>
          <FormField
            label="Tên tài sản"
            placeholder="Ví dụ: Techcombank"
            value={name}
            onChangeText={setName}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(
              [
                { key: 'cash', name: 'Tiền mặt' },
                { key: 'bank', name: 'Tài khoản' },
                { key: 'other', name: 'Khác' },
              ] as const
            ).map((a) => (
              <Chip
                key={a.key}
                label={a.name}
                selected={type === a.key}
                onPress={() => setType(a.key)}
              />
            ))}
          </View>
        </>
      )}
      <FormField
        label={asset ? 'Giá trị thực tế hiện tại (VND)' : 'Giá trị ban đầu (VND)'}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
      />
      <Text style={ui.body}>
        {asset
          ? 'Chênh lệch được ghi thành điều chỉnh tài sản, không tính vào thu nhập hoặc chi tiêu.'
          : 'Tài sản Khác được nhập theo giá trị ước tính bằng VND. Giá trị ban đầu không phải thu nhập.'}
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button title="Lưu tài sản" onPress={save} />
    </SheetTemplate>
  );
}
