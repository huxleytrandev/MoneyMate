import type { Server } from 'node:http';

export function configureLifecycle(server: Server, closeDatabase: () => Promise<void>) {
  let stopping = false;
  const close = async () => {
    if (stopping) return;
    stopping = true;
    try {
      await closeDatabase();
    } catch {
      process.exitCode = 1;
    }
  };
  const stop = () => {
    const timeout = setTimeout(() => server.closeAllConnections(), 10000);
    timeout.unref();
    server.close(() => {
      clearTimeout(timeout);
      void close();
    });
  };
  const onError = () => {
    console.error('Cannot start HTTP server. Check HOST and PORT.');
    process.exitCode = 1;
    void close();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  server.once('error', onError);
  server.once('close', () => {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  });
}
