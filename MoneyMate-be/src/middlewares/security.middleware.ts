import { API_MESSAGES } from '../constants/http.constant.ts';
import type { RequestHandler } from 'express';
export function browserOrigin(frontendBaseUrl?: string): RequestHandler {
  const allowed = new Set([
    'moneymate://',
    ...(frontendBaseUrl ? [new URL(frontendBaseUrl).origin] : []),
  ]);
  return (request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      next();
      return;
    }
    const origin = request.headers.origin;
    const sameOrigin = request.protocol + '://' + request.get('host');
    if (
      (origin && !allowed.has(origin) && origin !== sameOrigin) ||
      (request.headers.cookie && !origin)
    ) {
      response.status(403).json({ error: API_MESSAGES.origin });
      return;
    }
    if (!request.is('application/json')) {
      response.status(415).json({ error: API_MESSAGES.json });
      return;
    }
    next();
  };
}
