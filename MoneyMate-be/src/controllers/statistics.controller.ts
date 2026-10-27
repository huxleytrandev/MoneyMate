import type { RequestHandler } from 'express';
import type { statisticsService } from '../services/statistics.service.ts';
import { authenticatedUser } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';

export function statisticsController(service: ReturnType<typeof statisticsService>) {
  const report: RequestHandler = async (req, res) => {
    const user = authenticatedUser(res);
    res.json(jsonSafe(await service.report(user.id, user.timezone, req.query)));
  };
  return { report };
}
