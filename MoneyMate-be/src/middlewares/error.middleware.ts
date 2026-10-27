import type { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  const status =
    typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  if (status === 400) {
    response.status(400).json({ error: 'Invalid request body' });
    return;
  }
  if (status === 413) {
    response.status(413).json({ error: 'Request body too large' });
    return;
  }
  response.status(500).json({ error: 'Internal server error' });
};
