import { useRef, useState } from 'react';
import { useAssetAdjustmentHistory } from './useAssetAdjustmentHistory';
import { useDirtyFields } from './useDirtyFields';
import { dateKey, localDateTime } from '@/helpers/date';
import { assetBalance } from '@/helpers/finance';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { balanceSchema, assetSchema } from '@/schemas/finance.schema';
import type { Asset, AssetKind } from '@/types/finance.types';
export function useAssetEditor({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const { state, addAsset, adjustAsset, updateAsset, removeRecord, busy } = useFinance();
  const history = useAssetAdjustmentHistory(asset?.id);
  const [id] = useState(() => asset?.id ?? createId());
  const [name, setName] = useState(asset?.name ?? '');
  const [type, setType] = useState<AssetKind>(asset?.type ?? 'cash');
  const [value, setValue] = useState(asset ? String(assetBalance(state, asset.id)) : '');
  const [openingDate, setOpeningDate] = useState(dateKey(new Date()));
  const [error, setError] = useState('');
  const saved = useRef({ name: asset?.name ?? '', value, version: asset?.version });
  const newAssetDirty = useDirtyFields({ name, type, value, openingDate });
  const dirty = asset
    ? name !== saved.current.name || value !== saved.current.value
    : newAssetDirty;
  async function createAsset() {
    const result = assetSchema.safeParse({ name, type, openingValue: value });
    if (!result.success) throw new Error(result.error.issues[0].message);
    const openingAt = localDateTime(openingDate, '00:00');
    if (!openingAt) throw new Error('Ngày bắt đầu chưa hợp lệ.');
    await addAsset({ id, ...result.data, openingAt });
  }
  async function saveExistingAsset() {
    if (!asset) return;
    const identity = assetSchema.shape.name.safeParse(name);
    const balance = balanceSchema.safeParse(value);
    if (!identity.success) throw new Error(identity.error.issues[0].message);
    if (!balance.success) throw new Error(balance.error.issues[0].message);
    const nextName = identity.data;
    const nextValue = balance.data;
    if (asset.isArchived && value !== saved.current.value)
      throw new Error('Sử dụng lại tài sản trước khi đối soát.');
    if (nextName !== saved.current.name) {
      await updateAsset({ ...asset, name: nextName, version: saved.current.version });
      saved.current.name = nextName;
      if (saved.current.version !== undefined) saved.current.version++;
    }
    if (value !== saved.current.value) {
      try {
        await adjustAsset(asset.id, nextValue, saved.current.version);
      } catch (failure) {
        throw new Error(
          'Số dư chưa được lưu. Tên tài sản đã lưu vẫn được giữ. ' +
            (failure instanceof Error ? failure.message : 'Vui lòng thử lại.'),
        );
      }
    }
  }
  async function save() {
    setError('');
    try {
      if (asset) await saveExistingAsset();
      else await createAsset();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu tài sản.');
    }
  }
  async function persistAsset(nextAsset: Asset) {
    try {
      await updateAsset({ ...nextAsset, name: saved.current.name, version: saved.current.version });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.');
    }
  }
  function archiveAsset() {
    if (asset) void persistAsset({ ...asset, isArchived: true });
  }
  function restoreAsset() {
    if (asset) void persistAsset({ ...asset, isArchived: false });
  }
  return {
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
    dirty,
    removeRecord,
    setError,
    history,
  };
}
