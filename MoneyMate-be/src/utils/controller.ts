import type { Response } from 'express';
import type { PublicUser } from '../types/auth.types.ts';

export function authenticatedUser(response: Response): PublicUser {
  return response.locals.user as PublicUser;
}
