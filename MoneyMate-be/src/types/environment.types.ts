export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  HOST: string;
  PORT: number;
  DATABASE_URL: string;
  DB_POOL_MAX: number;
  DB_CONNECTION_TIMEOUT_MS: number;
}
