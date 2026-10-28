import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { CategoryModel } from '../models/index.ts';
import { repositories } from './finance.repository.ts';
import type { ResourceName } from '../schemas/api.schema.ts';
import type { Executor } from '../types/database.types.ts';

interface MovementReference {
  assetIds: string[];
  occurredAt: string;
  categoryId?: string;
  kind?: 'income' | 'expense';
}
export function financeWriteRepository(database: Executor, userId: string) {
  const finance = repositories(database);
  async function findRecord(resource: ResourceName, recordId: string) {
    const record = await finance[resource].find(userId, recordId);
    if (!record || resource !== 'transactions') return record;
    const allocations = await finance.allocations.forTransactions(userId, [recordId]);
    return { ...record, allocations };
  }
  async function assetIsUsed(assetId: string) {
    const result = await database.execute<{ used: boolean }>(sql`
      select exists (
        select 1 from transaction_allocations allocation
        join transactions movement on movement.id = allocation.transaction_id
          and movement.user_id = allocation.user_id
        where allocation.user_id = ${userId} and allocation.asset_account_id = ${assetId}
          and movement.deleted_at is null
      ) or exists (
        select 1 from transfers transfer where transfer.user_id = ${userId}
          and transfer.deleted_at is null
          and (transfer.from_asset_account_id = ${assetId} or transfer.to_asset_account_id = ${assetId})
      ) or exists (
        select 1 from asset_adjustments adjustment where adjustment.user_id = ${userId}
          and adjustment.asset_account_id = ${assetId} and adjustment.deleted_at is null
      ) as used
    `);
    return result.rows[0].used;
  }
  async function categoryIsUsed(categoryId: string) {
    const result = await database.execute<{ used: boolean }>(sql`
      select exists (
        select 1 from transactions movement where movement.user_id = ${userId}
          and movement.category_id = ${categoryId} and movement.deleted_at is null
      ) or exists (
        select 1 from monthly_category_plans plan where plan.user_id = ${userId}
          and plan.category_id = ${categoryId} and plan.deleted_at is null
      ) as used
    `);
    return result.rows[0].used;
  }
  async function categoryNameExists(input: {
    name: string;
    kind: 'income' | 'expense';
    excludeId?: string;
  }) {
    const matches = await database
      .select({ id: CategoryModel.id })
      .from(CategoryModel)
      .where(
        and(
          eq(CategoryModel.userId, userId),
          eq(CategoryModel.kind, input.kind),
          isNull(CategoryModel.deletedAt),
          sql`lower(${CategoryModel.name}) = lower(${input.name})`,
          input.excludeId ? ne(CategoryModel.id, input.excludeId) : undefined,
        ),
      )
      .limit(1);
    return matches.length > 0;
  }
  async function activeCategory(reference: { categoryId: string; kind: 'income' | 'expense' }) {
    const category = await finance.categories.find(userId, reference.categoryId);
    return category?.kind === reference.kind && !category.isArchived;
  }
  async function movementReferences(reference: MovementReference) {
    const assetIds = [...new Set(reference.assetIds)];
    if (!assetIds.length) return { categoryValid: false, assetCount: 0, openingValid: false };
    const identifiers = sql.join(
      assetIds.map((assetId) => sql`${assetId}::uuid`),
      sql`, `,
    );
    const categoryValid = reference.categoryId
      ? sql`exists (
      select 1 from categories category where category.user_id = ${userId}
        and category.id = ${reference.categoryId} and category.kind = ${reference.kind}
        and category.deleted_at is null and not category.is_archived
    )`
      : sql`true`;
    const result = await database.execute<{
      categoryValid: boolean;
      assetCount: number;
      openingValid: boolean;
    }>(sql`
      select ${categoryValid} as "categoryValid", count(*)::integer as "assetCount",
        coalesce(bool_and(asset.opening_at <= ${reference.occurredAt}::timestamptz), false) as "openingValid"
      from asset_accounts asset where asset.user_id = ${userId}
        and asset.id in (${identifiers}) and asset.deleted_at is null and not asset.is_archived
    `);
    return result.rows[0];
  }
  async function assetBalance(assetId: string, cutoff: string) {
    const result = await database.execute<{ balance: string }>(sql`
      select (case when asset.opening_at > ${cutoff}::timestamptz then 0 else
        asset.opening_value + coalesce((
          select sum(case when movement.kind = 'income' then allocation.amount else -allocation.amount end)
          from transaction_allocations allocation
          join lateral (
            -- Avoid owner-index rescans when PostgreSQL has stale estimates for a fresh user.
            select entry.kind, entry.user_id, entry.deleted_at, entry.occurred_at
            from transactions entry where entry.id = allocation.transaction_id offset 0
          ) movement on movement.user_id = ${userId}
            and movement.deleted_at is null and movement.occurred_at <= ${cutoff}::timestamptz
          where allocation.user_id = ${userId} and allocation.asset_account_id = asset.id
        ), 0) + coalesce((
          select sum(transfer.amount) from transfers transfer
          where transfer.user_id = ${userId} and transfer.to_asset_account_id = asset.id
            and transfer.deleted_at is null and transfer.occurred_at <= ${cutoff}::timestamptz
        ), 0) - coalesce((
          select sum(transfer.amount) from transfers transfer
          where transfer.user_id = ${userId} and transfer.from_asset_account_id = asset.id
            and transfer.deleted_at is null and transfer.occurred_at <= ${cutoff}::timestamptz
        ), 0) + coalesce((
          select sum(adjustment.delta_amount) from asset_adjustments adjustment
          where adjustment.user_id = ${userId} and adjustment.asset_account_id = asset.id
            and adjustment.deleted_at is null and adjustment.occurred_at <= ${cutoff}::timestamptz
        ), 0) end)::text as balance
      from asset_accounts asset where asset.user_id = ${userId}
        and asset.id = ${assetId} and asset.deleted_at is null
    `);
    return BigInt(result.rows[0]?.balance ?? '0');
  }
  return {
    findRecord,
    assetIsUsed,
    categoryIsUsed,
    categoryNameExists,
    activeCategory,
    movementReferences,
    assetBalance,
  };
}
