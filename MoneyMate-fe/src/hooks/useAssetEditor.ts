import { dateKey, localDateTime } from '@/helpers/date';
import { assetBalance } from '@/helpers/finance';
import { createId } from '@/helpers/id';
import { useFinance } from '@/hooks/useFinance';
import { amountSchema, assetSchema } from '@/schemas/finance.schema';
import type { Asset, AssetKind } from '@/types/finance.types';
import { useState } from 'react';
export function useAssetEditor({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const { state, addAsset, adjustAsset, updateAsset, removeRecord, busy } = useFinance();
  const [id] = useState(() => asset?.id ?? createId());
  const [name, setName] = useState(asset?.name ?? '');
  const [type, setType] = useState<AssetKind>(asset?.type ?? 'cash');
  const [value, setValue] = useState(asset ? String(assetBalance(state, asset.id)) : '');
  const [openingDate, setOpeningDate] = useState(dateKey(new Date()));
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  async function createAsset() {
    const result = assetSchema.safeParse({ name, type, openingValue: value });
    if (!result.success) throw new Error(result.error.issues[0].message);
    const openingAt = localDateTime(openingDate, '00:00');
    if (!openingAt) throw new Error('Ngày bắt đầu chưa hợp lệ.');
    await addAsset({ id, ...result.data, openingAt });
  }
  async function reconcileBalance() {
    if (!asset) return;
    const result = amountSchema.safeParse(value);
    if (!result.success) throw new Error(result.error.issues[0].message);
    await adjustAsset(asset.id, result.data, asset.version);
  }
  async function save() {
    try {
      await (asset ? reconcileBalance() : createAsset());
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu tài sản.');
    }
  }
  async function persistAsset(nextAsset: Asset) {
    const parsed = assetSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setError('Tên tài sản chưa hợp lệ.');
      return;
    }
    try {
      await updateAsset({ ...nextAsset, name: parsed.data });
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
    confirm,
    setConfirm,
    removeRecord,
    setError,
    state,
  };
}
