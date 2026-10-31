import { createServer } from 'node:http';
import { timingSafeEqual, createHash } from 'node:crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { interpret } from './services/intent.service.ts';
config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const host = process.env.AI_HOST ?? '127.0.0.1';
const port = Number(process.env.AI_PORT ?? 3001);
const token = process.env.AI_SERVICE_TOKEN;
if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535 ||
  (!['127.0.0.1', 'localhost', '::1'].includes(host) && (!token || token.length < 32))
)
  throw new Error('Invalid AI service configuration. Non-loopback requires AI_SERVICE_TOKEN.');
const schema = z.strictObject({
  text: z.string().min(1).max(4096),
  today: z.iso.date(),
  timezone: z.string().max(100),
});
const rates = new Map<string, { count: number; until: number }>();
const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  const send = (status: number, body: unknown) => {
    response.writeHead(status);
    response.end(JSON.stringify(body));
  };
  if (request.url === '/health' && request.method === 'GET') {
    send(200, { status: 'ok', engine: 'vietnamese-local-v1', externalProvider: false });
    return;
  }
  if (request.url !== '/interpret' || request.method !== 'POST') {
    send(404, { error: 'Not found' });
    return;
  }
  if (token) {
    const hash = (value: string) => createHash('sha256').update(value).digest();
    if (!timingSafeEqual(hash(request.headers.authorization ?? ''), hash('Bearer ' + token))) {
      send(401, { error: 'Unauthorized' });
      return;
    }
  }
  const remote = request.socket.remoteAddress ?? '';
  const now = Date.now();
  const rate = rates.get(remote);
  if (!rate || rate.until < now) rates.set(remote, { count: 1, until: now + 60000 });
  else if (++rate.count > 120) {
    send(429, { error: 'Too many requests' });
    return;
  }
  if (rates.size > 1000) for (const [key, entry] of rates) if (entry.until < now) rates.delete(key);
  if (!request.headers['content-type']?.startsWith('application/json')) {
    send(415, { error: 'JSON required' });
    return;
  }
  let bytes = 0;
  const chunks: Buffer[] = [];
  try {
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > 16384) {
        send(413, { error: 'Too large' });
        return;
      }
      chunks.push(Buffer.from(chunk));
    }
    const input = schema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!input.success) {
      send(422, { error: 'Invalid input' });
      return;
    }
    send(200, interpret(input.data));
  } catch {
    if (!response.headersSent) send(400, { error: 'Invalid JSON' });
  }
});
server.requestTimeout = 10000;
server.headersTimeout = 10000;
server.listen(port, host, () =>
  console.log('MoneyMate AI local interpreter: http://' + host + ':' + port),
);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close());
