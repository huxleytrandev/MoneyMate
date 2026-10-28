import type { RequestHandler } from 'express';
import type { FinanceControllerServices } from '../types/finance-controller.types.ts';
import type { ResourceController } from '../types/controller.types.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { authenticatedUser } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';

export function transactionController({ commands, queries }: FinanceControllerServices) {
  const list: RequestHandler = async (request, response) => {
    const result = await queries.list({
      user: authenticatedUser(response),
      resource: 'transactions',
      query: request.query,
    });
    response.json(jsonSafe(result));
  };
  const get: RequestHandler = async (request, response) => {
    const record = await queries.find({
      userId: authenticatedUser(response).id,
      resource: 'transactions',
      id: idSchema.parse(request.params.id),
    });
    response.json(jsonSafe(record));
  };
  const create: RequestHandler = async (request, response) => {
    const record = await commands.create({
      userId: authenticatedUser(response).id,
      resource: 'transactions',
      input: request.body,
    });
    response.status(201).json(jsonSafe(record));
  };
  const update: RequestHandler = async (request, response) => {
    const record = await commands.update({
      userId: authenticatedUser(response).id,
      resource: 'transactions',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.json(jsonSafe(record));
  };
  const remove: RequestHandler = async (request, response) => {
    await commands.remove({
      userId: authenticatedUser(response).id,
      resource: 'transactions',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.status(204).end();
  };
  return { list, get, create, update, remove } satisfies ResourceController;
}
