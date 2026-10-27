import { connectDB, checkDatabase } from './configs/database.ts';
import { createApplication } from './configs/express.config.ts';
import { configureLifecycle } from './configs/lifecycle.config.ts';

async function main() {
  const { SECRETS } = await import('./configs/secret.ts');
  const database = await connectDB(SECRETS);
  try {
    const app = createApplication(() => checkDatabase(database), SECRETS.FRONTEND_BASE_URL);
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
