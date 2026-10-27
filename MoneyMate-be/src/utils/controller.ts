import type { Response } from 'express';
import type { PublicUser } from '../types/auth.types.ts';
import { listQuerySchema } from '../schemas/api.schema.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { API_MESSAGES } from '../constants/http.constant.ts';
import { AppError } from './app-error.ts';

export function authenticatedUser(response: Response): PublicUser {
  return response.locals.user as PublicUser;
}

export function paginate<T>(rows: T[], query: unknown) {
  const { page, limit } = listQuerySchema.parse(query);
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: rows.length },
  };
}

export function findRecord<T extends { id: string }>(rows: T[], value: unknown): T {
  const id = idSchema.parse(value);
  const record = rows.find((row) => row.id === id);
  if (!record) throw new AppError(404, API_MESSAGES.notFound);
  return record;
}
