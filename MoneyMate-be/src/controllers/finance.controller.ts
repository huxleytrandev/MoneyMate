import type { RequestHandler } from 'express';
import type { financeService } from '../services/finance.service.ts';
import { authenticatedUser } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';

// Snapshot across resources for initial frontend loading; CRUD lives in domain controllers.
export function financeController(service: ReturnType<typeof financeService>) {
  const state: RequestHandler = async (_req, res) => {
    res.json(jsonSafe(await service.snapshot(authenticatedUser(res).id)));
  };
  return { state };
}
