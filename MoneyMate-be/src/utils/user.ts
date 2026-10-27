import type { PublicUser } from '../types/auth.types.ts';
export function publicUser(user: {
  id: string;
  email: string;
  name: string;
  timezone?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    timezone: user.timezone ?? 'Asia/Ho_Chi_Minh',
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  };
}
