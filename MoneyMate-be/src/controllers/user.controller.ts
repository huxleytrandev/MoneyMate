import type { RequestHandler } from 'express';
import type { userService } from '../services/user.service.ts';
import { authenticatedUser } from '../utils/controller.ts';
export function userController(service: ReturnType<typeof userService>) {
  const me: RequestHandler = (_request, response) => {
    response.json({ user: authenticatedUser(response) });
  };
  const remove: RequestHandler = async (request, response) => {
    const result = await service.remove({
      userId: authenticatedUser(response).id,
      body: request.body,
      headers: request.headers,
    });
    const cookies = result.headers.getSetCookie();
    if (cookies.length) response.setHeader('Set-Cookie', cookies);
    response.status(204).end();
  };
  const verifyPassword: RequestHandler = async (request, response) => {
    response.json(await service.verifyPassword({ body: request.body, headers: request.headers }));
  };
  const profile: RequestHandler = async (_request, response) => {
    response.json(await service.profile(authenticatedUser(response).id));
  };
  const updateProfile: RequestHandler = async (request, response) => {
    response.json(await service.updateProfile(authenticatedUser(response).id, request.body));
  };
  return { me, remove, verifyPassword, profile, updateProfile };
}
