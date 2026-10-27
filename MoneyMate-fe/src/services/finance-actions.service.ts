import {
  assetPayload,
  categoryPayload,
  preparePlan,
  transactionPayload,
  transferPayload,
} from '@/helpers/finance-payload';
import type { ApiCategory } from '@/types/api.types';
import type {
  FinanceActionDependencies,
  FinanceActions,
  FinanceResource,
  PlanInput,
} from '@/types/finance-context.types';
import type { Asset, Category, Transaction, Transfer } from '@/types/finance.types';
import * as financeApi from './finance.service';

async function persistTransaction(
  dependencies: FinanceActionDependencies,
  transaction: Transaction,
) {
  const existing = dependencies
    .getState()
    .transactions.find((record) => record.id === transaction.id);
  const body = transactionPayload(transaction);
  if (!existing) {
    await financeApi.createRecord('transactions', { ...body, id: transaction.id });
    return;
  }
  await financeApi.updateRecord('transactions', transaction.id, {
    ...body,
    version: transaction.version ?? existing.version,
  });
}
async function persistPlan(dependencies: FinanceActionDependencies, input: PlanInput) {
  const { existing, body } = preparePlan(dependencies.getState(), input);
  if (!existing?.id) {
    await financeApi.createRecord('plans', body);
    return;
  }
  await financeApi.updateRecord('plans', existing.id, {
    ...body,
    version: input.expectedVersion ?? existing.version,
  });
}
async function persistTransfer(dependencies: FinanceActionDependencies, transfer: Transfer) {
  const body = transferPayload(transfer);
  const exists = dependencies.getState().transfers?.some((record) => record.id === transfer.id);
  if (!exists) {
    await financeApi.createRecord('transfers', { ...body, id: transfer.id });
    return;
  }
  await financeApi.updateRecord('transfers', transfer.id, { ...body, version: transfer.version });
}
async function reconcileAsset(
  dependencies: FinanceActionDependencies,
  input: { assetId: string; value: number; expectedVersion?: number },
) {
  const asset = dependencies.getState().assets.find((record) => record.id === input.assetId);
  if (!asset?.version) throw new Error('Hãy tải lại tài sản.');
  await financeApi.reconcile(input.assetId, input.expectedVersion ?? asset.version, input.value);
}
async function removeFinanceRecord(
  dependencies: FinanceActionDependencies,
  input: { resource: FinanceResource; id: string; expectedVersion?: number },
) {
  const record = dependencies
    .getState()
    [input.resource]?.find((candidate) => candidate.id === input.id);
  if (!record?.version) throw new Error('Hãy tải lại dữ liệu.');
  await financeApi.deleteRecord(input.resource, input.id, input.expectedVersion ?? record.version);
}
async function createAsset(asset: Asset) {
  await financeApi.createRecord('assets', {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    openingValue: String(asset.openingValue),
    openingAt: asset.openingAt ?? new Date().toISOString(),
  });
}
async function updateAsset(asset: Asset) {
  await financeApi.updateRecord('assets', asset.id, assetPayload(asset));
}
async function updateCategory(category: Category) {
  await financeApi.updateRecord('categories', category.id, categoryPayload(category));
}
export function createFinanceActions(dependencies: FinanceActionDependencies): FinanceActions {
  const { execute } = dependencies;
  return {
    saveTransaction: (transaction) => execute(() => persistTransaction(dependencies, transaction)),
    savePlan: (categoryId, month, amount, expectedVersion) =>
      execute(() => persistPlan(dependencies, { categoryId, month, amount, expectedVersion })),
    saveTransfer: (transfer) => execute(() => persistTransfer(dependencies, transfer)),
    addCategory: (category) =>
      execute(() =>
        financeApi.createRecord<ApiCategory>('categories', {
          id: category.id,
          name: category.name,
          kind: category.kind,
        }),
      ),
    addAsset: (asset) => execute(() => createAsset(asset)),
    adjustAsset: (assetId, value, expectedVersion) =>
      execute(() => reconcileAsset(dependencies, { assetId, value, expectedVersion })),
    removeRecord: (resource, id, expectedVersion) =>
      execute(() => removeFinanceRecord(dependencies, { resource, id, expectedVersion })),
    updateAsset: (asset) => execute(() => updateAsset(asset)),
    updateCategory: (category) => execute(() => updateCategory(category)),
  };
}
