import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { expo } from '@better-auth/expo';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import {
  UserModel,
  SessionModel,
  AuthAccountModel,
  AuthVerificationModel,
} from '../models/index.ts';
import { USER } from '../constants/user.constant.ts';
import { registerValidation, loginValidation } from '../validations/auth.validation.ts';
import { displayNameValidation, timezoneValidation } from '../validations/auth.validation.ts';
import { hashPassword, verifyPassword } from '../utils/password.ts';
import { authLifecycleService } from '../services/auth-lifecycle.service.ts';
import type { Database } from '../types/database.types.ts';
import type { AuthConfig } from '../types/auth.types.ts';

function validateSignUp(body: Record<string, unknown>) {
  const result = registerValidation.safeParse({
    email: body.email,
    password: body.password,
    displayName: body.name,
    timezone: body.timezone,
  });
  if (!result.success)
    throw new APIError('BAD_REQUEST', { message: result.error.issues[0].message });
  return { ...body, ...result.data, name: result.data.displayName };
}
function validateSignIn(body: Record<string, unknown>) {
  const result = loginValidation.safeParse({ email: body.email, password: body.password });
  if (!result.success)
    throw new APIError('BAD_REQUEST', { message: result.error.issues[0].message });
  return { ...body, ...result.data };
}
export function createAuth(database: Database, config: AuthConfig) {
  const lifecycle = authLifecycleService(database);
  return betterAuth({
    appName: 'MoneyMate',
    baseURL: config.baseURL,
    basePath: '/api/auth',
    secret: config.secret,
    database: drizzleAdapter(database, {
      provider: 'pg',
      transaction: true,
      schema: {
        user: UserModel,
        session: SessionModel,
        account: AuthAccountModel,
        verification: AuthVerificationModel,
      },
    }),
    trustedOrigins: [
      new URL(config.baseURL).origin,
      ...(config.frontendBaseUrl ? [new URL(config.frontendBaseUrl).origin] : []),
      'moneymate://',
      ...(!config.production ? ['exp://**'] : []),
    ],
    advanced: {
      database: { generateId: 'uuid' },
      cookiePrefix: 'moneymate',
      useSecureCookies: config.production,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: USER.passwordMin,
      maxPasswordLength: USER.passwordMax,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    user: {
      fields: { name: 'displayName' },
      additionalFields: {
        timezone: { type: 'string', required: false, defaultValue: USER.timezone },
      },
      changeEmail: { enabled: true, updateEmailWithoutVerification: true },
      // Account deletion is exposed through /users/me to delete financial records atomically.
      deleteUser: { enabled: false },
    },
    session: { expiresIn: 60 * 60 * 24 * USER.sessionDays, cookieCache: { enabled: false } },
    plugins: [expo()],
    rateLimit: { enabled: true, window: 60, max: 100 },
    logger: { disabled: true },
    databaseHooks: {
      user: {
        create: { after: (user) => lifecycle.seedCategories(user.id) },
        update: {
          before: async (data) => {
            const name =
              data.name === undefined ? undefined : displayNameValidation.safeParse(data.name);
            if (name && !name.success)
              throw new APIError('BAD_REQUEST', { message: 'Tên chưa hợp lệ.' });
            const timezone =
              data.timezone === undefined ? undefined : timezoneValidation.safeParse(data.timezone);
            if (timezone && !timezone.success)
              throw new APIError('BAD_REQUEST', { message: 'Múi giờ chưa hợp lệ.' });
            return { data: { ...data, ...(name?.success ? { name: name.data } : {}) } };
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path === '/sign-up/email')
          return { context: { body: validateSignUp(context.body) } };
        if (context.path === '/sign-in/email')
          return { context: { body: validateSignIn(context.body) } };
      }),
      after: createAuthMiddleware(async (context) => {
        if (context.path !== '/sign-in/email' || !context.context.newSession) return;
        await lifecycle.upgradeLegacyPassword(
          context.context.newSession.user.id,
          context.body.password,
        );
      }),
    },
  });
}
