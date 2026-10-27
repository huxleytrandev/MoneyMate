import { APIError } from 'better-auth/api';
import { API_MESSAGES } from '../constants/http.constant.ts';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.ts';
export const errorMiddleware: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ZodError) {
    res.status(422).json({
      error: API_MESSAGES.validation,
      fields: error.issues.map((failure) => ({
        path: failure.path.join('.'),
        message: failure.message,
      })),
    });
    return;
  }
  if (error instanceof APIError) {
    res.status(error.statusCode).json({ error: error.body?.message ?? 'Authentication failed.' });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  const failure = error as { code?: string; cause?: { code?: string }; status?: number };
  const code = failure?.code ?? failure?.cause?.code;
  if (code === '23505') {
    res.status(409).json({ error: API_MESSAGES.duplicate });
    return;
  }
  if (code === '23503' || code === '23514' || code === '22003') {
    res.status(422).json({ error: API_MESSAGES.reference });
    return;
  }
  if (failure?.status === 400) {
    res.status(400).json({ error: API_MESSAGES.invalidBody });
    return;
  }
  if (failure?.status === 413) {
    res.status(413).json({ error: API_MESSAGES.tooLarge });
    return;
  }
  res.status(500).json({ error: API_MESSAGES.internal });
};
