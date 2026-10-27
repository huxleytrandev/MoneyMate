import type { ApplicationConfig } from '../types/application.types.ts';
import cors from 'cors';
import express, { json } from 'express';
import { swaggerSpec, swaggerUi } from './swagger.config.ts';
import createRoutes, { ROUTES } from '../routes/index.ts';
import { errorMiddleware } from '../middlewares/error.middleware.ts';
import { createAuth } from './auth.config.ts';
import { mountAuthRoutes } from '../routes/auth.route.ts';
import { securityHeaders } from './helmet.config.ts';

export function createApplication(options: ApplicationConfig) {
  const { checkReadiness, frontendBaseUrl, database } = options;
  const app = express();
  app.use(securityHeaders(options.environment ?? 'development'));
  app.use(
    cors({
      origin: frontendBaseUrl ? new URL(frontendBaseUrl).origin : false,
      credentials: Boolean(frontendBaseUrl),
    }),
  );
  if (database && !options.auth) throw new Error('Better Auth configuration is required.');
  const auth =
    database && options.auth
      ? createAuth(database, { ...options.auth, frontendBaseUrl })
      : undefined;
  // Better Auth reads the request stream before express.json().
  if (auth) mountAuthRoutes(app, auth);
  app.use(json({ limit: '1mb' }));
  app.get(ROUTES.OPENAPI, (_request, response) => {
    response.json(swaggerSpec);
  });
  app.use(ROUTES.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(ROUTES.ROOT.PATH, createRoutes(checkReadiness, database, frontendBaseUrl, auth));
  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found' });
  });
  app.use(errorMiddleware);
  return app;
}
