import type { RecordMetadata } from './common.types.ts';

export interface Category extends RecordMetadata {
  name: string;
  kind: 'income' | 'expense';
  icon?: string;
  color?: string;
  sortOrder: number;
  isArchived: boolean;
}

export type CreateCategoryData = Omit<Category, keyof RecordMetadata | 'isArchived'>;
export type CreateCategoryInput = Omit<CreateCategoryData, 'sortOrder'> & { sortOrder?: number };
