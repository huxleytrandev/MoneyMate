import { connectDB, checkDatabase } from './configs/database.ts';
import { createApplication } from './configs/express.config.ts';
import { configureLifecycle } from './configs/lifecycle.config.ts';

async function main() {
  const { SECRETS } = await import('./configs/secret.ts');
  const database = await connectDB(SECRETS);
  try {
    const app = createApplication({
      checkReadiness: () => checkDatabase(database),
      frontendBaseUrl: SECRETS.FRONTEND_BASE_URL,
      database: database.db,
      environment: SECRETS.NODE_ENV === 'production' ? 'production' : 'development',
      auth: {
        secret: SECRETS.BETTER_AUTH_SECRET,
        baseURL: SECRETS.BETTER_AUTH_URL,
        frontendBaseUrl: SECRETS.FRONTEND_BASE_URL,
        production: SECRETS.NODE_ENV === 'production',
      },
    });
    const server = app.listen(SECRETS.PORT, SECRETS.HOST, () => {
      console.log('PostgreSQL connected.');
      console.log('MoneyMate API: http://' + SECRETS.HOST + ':' + SECRETS.PORT + '/api');
      console.log('Swagger UI: http://' + SECRETS.HOST + ':' + SECRETS.PORT + '/api/docs');
    });
    configureLifecycle(server, () => database.pool.end());
  } catch {
    await database.pool.end();
    throw new Error('Cannot initialize MoneyMate API.');
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Backend startup failed.');
  process.exitCode = 1;
});
