import type { RequestHandler } from 'express';
import type { FinanceControllerServices } from '../types/finance-controller.types.ts';
import type { ResourceController } from '../types/controller.types.ts';
import { idSchema } from '../schemas/common.schema.ts';
import { authenticatedUser } from '../utils/controller.ts';
import { jsonSafe } from '../utils/serialize.ts';

export function assetController({ commands, queries }: FinanceControllerServices) {
  const list: RequestHandler = async (request, response) => {
    const result = await queries.list({
      user: authenticatedUser(response),
      resource: 'assets',
      query: request.query,
    });
    response.json(jsonSafe(result));
  };
  const get: RequestHandler = async (request, response) => {
    const record = await queries.find({
      userId: authenticatedUser(response).id,
      resource: 'assets',
      id: idSchema.parse(request.params.id),
    });
    response.json(jsonSafe(record));
  };
  const create: RequestHandler = async (request, response) => {
    const record = await commands.create({
      userId: authenticatedUser(response).id,
      resource: 'assets',
      input: request.body,
    });
    response.status(201).json(jsonSafe(record));
  };
  const update: RequestHandler = async (request, response) => {
    const record = await commands.update({
      userId: authenticatedUser(response).id,
      resource: 'assets',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.json(jsonSafe(record));
  };
  const remove: RequestHandler = async (request, response) => {
    await commands.remove({
      userId: authenticatedUser(response).id,
      resource: 'assets',
      input: request.body,
      recordId: idSchema.parse(request.params.id),
    });
    response.status(204).end();
  };
  const reconcile: RequestHandler = async (request, response) => {
    const record = await commands.reconcile(
      authenticatedUser(response).id,
      idSchema.parse(request.params.id),
      request.body,
    );
    response.json(jsonSafe(record));
  };
  return { list, get, create, update, remove, reconcile } satisfies ResourceController & {
    reconcile: RequestHandler;
  };
}
