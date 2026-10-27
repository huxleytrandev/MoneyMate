// Shared domain record metadata. ORM tables live in models.
// All timestamps are ISO strings. Database adapters will map PostgreSQL rows separately.
export interface RecordMetadata {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  deletedAt: string | null;
}

export type MoneyInput = string | number;
