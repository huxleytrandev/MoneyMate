import type { RequestHandler } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import type { Authentication } from '../types/auth.types.ts';
import { USER } from '../constants/user.constant.ts';
import { publicUser } from '../utils/user.ts';
export function requireAuth(auth: Authentication): RequestHandler {
  return async (request, response, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
      if (!session) {
        response.status(401).json({ error: USER.messages.unauthorized });
        return;
      }
      response.locals.user = publicUser(session.user);
      next();
    } catch (error) {
      next(error);
    }
  };
}
