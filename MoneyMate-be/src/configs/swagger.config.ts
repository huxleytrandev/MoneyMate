import swaggerUi from 'swagger-ui-express';
import { ROUTES } from '../routes/index.ts';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: { title: 'MoneyMate API', version: '0.1.0' },
  paths: {
    [ROUTES.ROOT.PATH + ROUTES.HEALTH]: {
      get: {
        summary: 'Check API process health',
        responses: { '200': { description: 'API is running' } },
      },
    },
    [ROUTES.ROOT.PATH + ROUTES.READY]: {
      get: {
        summary: 'Check PostgreSQL readiness',
        responses: {
          '200': { description: 'Database is connected' },
          '503': { description: 'Database is unavailable' },
        },
      },
    },
  },
};
export { swaggerUi };
