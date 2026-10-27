import type { RequestHandler } from 'express';
import type { financeService } from '../services/finance.service.ts';
import type { ResourceController } from '../types/controller.types.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { authenticatedUser, paginate, findRecord } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';

export function planController(service: ReturnType<typeof financeService>) {
  const list: RequestHandler = async (request, response) => {
    const rows = (await service.snapshot(authenticatedUser(response).id)).plans;
    response.json(jsonSafe(paginate(rows, request.query)));
  };
  const get: RequestHandler = async (request, response) => {
    const rows = (await service.snapshot(authenticatedUser(response).id)).plans;
    response.json(jsonSafe(findRecord(rows, request.params.id)));
  };
  const create: RequestHandler = async (request, response) => {
    const record = await service.create({
      userId: authenticatedUser(response).id,
      resource: 'plans',
      input: request.body,
    });
    response.status(201).json(jsonSafe(record));
  };
  const update: RequestHandler = async (request, response) => {
    const record = await service.update({
      userId: authenticatedUser(response).id,
      resource: 'plans',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.json(jsonSafe(record));
  };
  const remove: RequestHandler = async (request, response) => {
    await service.remove({
      userId: authenticatedUser(response).id,
      resource: 'plans',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.status(204).end();
  };
  return { list, get, create, update, remove } satisfies ResourceController;
}
