import { rateLimit } from 'express-rate-limit';
export function sensitiveActionLimit() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Quá nhiều yêu cầu xác nhận mật khẩu. Vui lòng thử lại sau.' },
  });
}
