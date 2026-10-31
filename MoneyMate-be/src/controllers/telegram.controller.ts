import type { RequestHandler } from 'express';
import type { authTelegramService } from '../services/auth-telegram.service.ts';
import { authenticatedUser } from '../utils/controller.ts';
export function telegramController(service: ReturnType<typeof authTelegramService>) {
  const status: RequestHandler = async (_request, response) => {
    response.json(await service.status(authenticatedUser(response).id));
  };
  const issue: RequestHandler = async (_request, response) => {
    response.json(await service.issue(authenticatedUser(response).id));
  };
  const confirm: RequestHandler = async (request, response) => {
    response.json(await service.confirm(authenticatedUser(response).id, request.body));
  };
  const revoke: RequestHandler = async (_request, response) => {
    await service.revoke(authenticatedUser(response).id);
    response.sendStatus(204);
  };
  return { status, issue, confirm, revoke };
}
