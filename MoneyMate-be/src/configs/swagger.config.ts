import { profileSchema } from '../schemas/profile.schema.ts';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { createSchemas, RESOURCE_NAMES } from '../schemas/api.schema.ts';
import { registerValidation, loginValidation } from '../validations/auth.validation.ts';
const response = { description: 'Thành công. Tiền VNĐ được trả về dạng chuỗi số nguyên.' };
const security = [{ sessionCookie: [] }];
function body(schema: z.ZodType) {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });
  delete json.$schema;
  return { required: true, content: { 'application/json': { schema: json } } };
}
function authPost(summary: string, schema: z.ZodType) {
  return { post: { summary, requestBody: body(schema), responses: { 200: response } } };
}
const paths: Record<string, unknown> = {
  '/api/users/me/profile': {
    get: {
      summary: 'Hồ sơ cá nhân và ảnh đại diện của người dùng hiện tại',
      security,
      responses: { 200: response, 401: { description: 'Chưa đăng nhập' } },
    },
    put: {
      summary: 'Cập nhật tên, giới tính, ngày sinh và ảnh JPEG tối đa 128 KB',
      security,
      requestBody: body(profileSchema),
      responses: { 200: response, 422: { description: 'Thông tin không hợp lệ' } },
    },
  },
  '/api/health': { get: { summary: 'API health', responses: { 200: response } } },
  '/api/ready': {
    get: {
      summary: 'Database readiness',
      responses: { 200: response, 503: { description: 'Database unavailable' } },
    },
  },
  '/api/auth/sign-up/email': authPost(
    'Better Auth: đăng ký',
    z.object({
      name: registerValidation.shape.displayName,
      email: registerValidation.shape.email,
      password: registerValidation.shape.password,
      timezone: registerValidation.shape.timezone,
    }),
  ),
  '/api/auth/sign-in/email': authPost('Better Auth: đăng nhập', loginValidation),
  '/api/auth/sign-out': {
    post: {
      summary: 'Better Auth: đăng xuất',
      security,
      requestBody: body(z.object({})),
      responses: { 200: response },
    },
  },
  '/api/auth/get-session': {
    get: {
      summary: 'Better Auth: phiên hiện tại, null nếu chưa đăng nhập',
      responses: { 200: response },
    },
  },
  '/api/auth/update-user': {
    post: {
      summary: 'Better Auth: cập nhật tên',
      security,
      requestBody: body(z.object({ name: z.string() })),
      responses: { 200: response },
    },
  },
  '/api/auth/change-password': {
    post: {
      summary: 'Better Auth: đổi mật khẩu',
      security,
      requestBody: body(
        z.object({
          currentPassword: z.string(),
          newPassword: z.string(),
          revokeOtherSessions: z.boolean().default(true),
        }),
      ),
      responses: { 200: response },
    },
  },
  '/api/auth/change-email': {
    post: {
      summary: 'Better Auth: đổi email chưa xác minh',
      security,
      requestBody: body(z.object({ newEmail: z.email() })),
      responses: { 200: response },
    },
  },
  '/api/users/me/verify-password': {
    post: {
      summary: 'Xác nhận mật khẩu bằng Better Auth',
      security,
      requestBody: body(z.object({ password: z.string() })),
      responses: { 200: response },
    },
  },
  '/api/users/me': {
    get: { summary: 'Hồ sơ hiện tại', security, responses: { 200: response } },
    delete: {
      summary: 'Xóa tài khoản và dữ liệu tài chính trong transaction',
      security,
      requestBody: body(z.object({ password: z.string() })),
      responses: { 204: response },
    },
  },
  '/api/state': {
    get: {
      summary: 'Snapshot dữ liệu thuộc người dùng',
      security,
      parameters: [
        {
          in: 'query',
          name: 'month',
          schema: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}$' },
          description: 'Tháng theo múi giờ tài khoản',
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
      ],
      responses: { 200: response },
    },
  },
  '/api/statistics': {
    get: {
      summary: 'Thống kê planned/actual và tài sản',
      security,
      parameters: [
        { in: 'query', name: 'start', required: true, schema: { type: 'string', format: 'date' } },
        { in: 'query', name: 'end', required: true, schema: { type: 'string', format: 'date' } },
        {
          in: 'query',
          name: 'period',
          schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'], default: 'month' },
        },
      ],
      responses: { 200: response },
    },
  },
  '/api/assets/{id}/reconcile': {
    post: {
      summary: 'Đối soát tài sản, không tính vào thu chi',
      security,
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: body(
        z.object({
          version: z.number().int().positive(),
          value: z.string(),
          note: z.string().optional(),
        }),
      ),
      responses: { 200: response },
    },
  },
};

const transactionQueryParameters = [
  { in: 'query', name: 'categoryId', schema: { type: 'string', format: 'uuid' } },
  {
    in: 'query',
    name: 'month',
    schema: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}$' },
    description: 'Tháng theo múi giờ tài khoản',
  },
  {
    in: 'query',
    name: 'cursor',
    schema: { type: 'string' },
    description: 'Con trỏ trả về ở page.nextCursor',
  },
  { in: 'query', name: 'kind', schema: { type: 'string', enum: ['income', 'expense'] } },
  { in: 'query', name: 'assetType', schema: { type: 'string', enum: ['cash', 'bank', 'other'] } },
  { in: 'query', name: 'search', schema: { type: 'string', maxLength: 200 } },
];
const assetHistoryParameters = [
  { in: 'query', name: 'assetId', schema: { type: 'string', format: 'uuid' } },
];
for (const resource of RESOURCE_NAMES) {
  paths['/api/' + resource] = {
    get: {
      summary: 'Danh sách ' + resource + ' của người dùng',
      security,
      parameters: [
        ...(resource === 'transactions' ? transactionQueryParameters : []),
        ...(resource === 'adjustments' ? assetHistoryParameters : []),
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
        },
      ],
      responses: { 200: response },
    },
    post: {
      summary: 'Tạo ' + resource,
      security,
      requestBody: body(createSchemas[resource]),
      responses: { 201: response, 422: { description: 'Dữ liệu hoặc quan hệ không hợp lệ' } },
    },
  };
  const parameters = [
    { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
  ];
  paths['/api/' + resource + '/{id}'] = {
    get: {
      summary: 'Chi tiết ' + resource,
      security,
      parameters,
      responses: {
        200: response,
        404: { description: 'Không tồn tại hoặc không thuộc người dùng' },
      },
    },
    put: {
      summary: 'Thay thế ' + resource + '; gửi đầy đủ thuộc tính và version mới nhất',
      security,
      parameters,
      requestBody: body(
        createSchemas[resource].safeExtend({ version: z.number().int().positive() }),
      ),
      responses: { 200: response, 409: { description: 'Xung đột phiên bản' } },
    },
    delete: {
      summary: 'Xóa mềm ' + resource + '; yêu cầu version hiện tại',
      security,
      parameters,
      requestBody: body(z.object({ version: z.number().int().positive() })),
      responses: {
        204: response,
        409: { description: 'Dữ liệu đang được sử dụng hoặc đã thay đổi' },
      },
    },
  };
}

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MoneyMate API',
    version: '1.1.0',
    description:
      'Better Auth quản lý phiên bằng cookie ký số. Expo plugin lưu cookie trong SecureStore; web dùng HttpOnly cookie. Tiền là chuỗi số nguyên VNĐ. Các route /auth/register, /auth/login, /auth/logout cũ đã được thay thế.',
  },
  components: {
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'moneymate.session_token' },
    },
  },
  paths,
};
export { swaggerUi };
