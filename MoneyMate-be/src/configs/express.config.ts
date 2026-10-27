import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { json } from 'express';
import { swaggerSpec, swaggerUi } from './swagger.config.ts';
import createRoutes, { ROUTES } from '../routes/index.ts';
import { errorMiddleware } from '../middlewares/error.middleware.ts';

// Factory has no env/database side effects, so tests can supply a readiness check.
export function createApplication(checkReadiness: () => Promise<void>, frontendBaseUrl?: string) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin: frontendBaseUrl ? new URL(frontendBaseUrl).origin : false,
      credentials: Boolean(frontendBaseUrl),
    }),
  );
  app.use(json({ limit: '1mb' }));
  app.use(cookieParser());
  app.get(ROUTES.OPENAPI, (_request, response) => {
    response.json(swaggerSpec);
  });
  app.use(ROUTES.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(ROUTES.ROOT.PATH, createRoutes(checkReadiness));
  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });
  app.use(errorMiddleware);
  return app;
}
