import type { RequestHandler } from 'express';
import type { financeReadService } from '../services/finance-read.service.ts';
import { authenticatedUser } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';
export function financeController(queries: ReturnType<typeof financeReadService>) {
  const state: RequestHandler = async (request, response) => {
    response.json(
      jsonSafe(await queries.state({ user: authenticatedUser(response), query: request.query })),
    );
  };
  return { state };
}
