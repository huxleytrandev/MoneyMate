# MoneyMate backend

Node.js + TypeScript + PostgreSQL (Supabase) + Drizzle ORM + Zod.

## Trách nhiệm

- models: bảng/cột PostgreSQL, kiểu lưu trữ, PK/FK, unique, check, index và mặc định. Đây là model ORM thực sự, không phải interface TypeScript.
- types: interface nghiệp vụ, metadata, cấu hình và DTO input/output.
- schemas: Zod validate/normalize request, dùng satisfies để đối chiếu types.
- configs: đọc môi trường, kết nối pg.Pool và khởi tạo Drizzle.
- drizzle/: SQL migration và metadata do Drizzle Kit sinh.

Types nghiệp vụ độc lập với database. SQL nullable trả null, còn DTO optional có thể là undefined;
repository sẽ cần ánh xạ khi triển khai API. Timestamp SQL trả chuỗi có timezone;
schema request chuẩn hóa ISO UTC. Tiền VND dùng bigint; JSON response phải đổi thành chuỗi.

## Models

UserModel, AssetAccountModel, CategoryModel, MonthlyPlanModel,
TransactionModel, TransactionAllocationModel, TransferModel, AssetAdjustmentModel.

Model khai báo 8 bảng với ràng buộc chủ sở hữu qua khóa ngoại ghép,
phân bổ không trùng tài sản, số tiền hợp lệ, kế hoạch tháng không trùng khi chưa xóa.
Actual và số dư được tính từ dữ liệu nguồn, không lưu thêm tổng dư thừa.

updatedAt/version hiện có mặc định lúc tạo; service cập nhật phải gán updatedAt và tăng version,
kèm điều kiện version khi cần optimistic locking. Soft delete là cột deletedAt,
không có middleware tự lọc: query phải lọc deletedAt IS NULL.

Tổng phân bổ bằng giao dịch đang được kiểm tra trong Zod.
Service tương lai phải ghi giao dịch + phân bổ trong cùng DB transaction.
Chưa có constraint trigger kiểm tra tổng liên bảng ở PostgreSQL.
Các kiểm tra tài sản đã archived, ngày giao dịch so với openingAt và xác thực user
phải triển khai trong service, không được chỉ dựa vào frontend.

## Kết nối

Copy .env.example sang .env nếu chưa có, điền DATABASE_URL Supabase.
Không ghi đè .env đã cấu hình. Không commit hoặc gửi mật khẩu.
Dùng chuỗi kết nối và TLS theo nhà cung cấp; không tắt kiểm tra chứng chỉ.
Node >=22.18, khuyến nghị Node 24 LTS.

```powershell
npx.cmd pnpm install
npx.cmd pnpm db:check
npx.cmd pnpm dev
```

configs/database.ts trả { pool, db }:

- pool quản lý kết nối; db thực hiện truy vấn ORM.
- src/app.ts kiểm tra kết nối trước khi mở cổng.
- GET /api/health kiểm tra process.
- GET /api/ready kiểm tra PostgreSQL.
- Chưa có CRUD hoặc đăng nhập.

## Migrations

```powershell
npx.cmd pnpm db:generate
```

Chỉ tạo SQL local, không kết nối hoặc thay đổi Supabase.

```powershell
npx.cmd pnpm db:migrate
```

Áp dụng các migration đang chờ lên database trong DATABASE_URL.
Chỉ chạy sau khi rà soát SQL và xác nhận đúng database đích.
Chưa chạy lệnh này trong bước chuyển cấu trúc.

Migration bật RLS cho cả 8 bảng, chưa có policy cho anon/authenticated.
Ứng dụng mobile chỉ gọi backend; không gọi Supabase Data API trực tiếp.
Backend cần role có quyền phù hợp; RLS không thay thế kiểm tra chủ sở hữu trong API.
Không expose passwordHash qua API.

## Kiểm tra

```powershell
npx.cmd pnpm format
npx.cmd pnpm check
npx.cmd pnpm test
```

Tests hiện kiểm tra Zod và HTTP readiness bằng stub, không phải integration PostgreSQL.
Các migrations chưa được thực thi trên database thực.

## Hằng cấu hình

configs/secret.ts đọc .env và xuất PORT, DATABASE_URL, các hằng thời hạn token, SALT_ROUNDS và URL.
Hiện chưa triển khai authentication nên không khai báo hoặc yêu cầu khóa JWT.
Backend có thể khởi động khi cấu hình database hợp lệ và database kết nối được.
ACCESS_EXPIRES_IN/REFRESH_EXPIRES_IN chỉ là cấu hình dự phòng, chưa thực hiện ký token.

## Express entry point

- src/app.ts là điểm khởi động duy nhất; server.ts đã được xóa.
- configs/express.config.ts tạo Express và lắp CORS, JSON parser (1 MB), cookie parser, docs, routes và xử lý lỗi.
- configs/lifecycle.config.ts xử lý tín hiệu dừng, đóng HTTP và database pool.
- configs/database.ts có connectDB để kiểm tra kết nối trước khi listen.
- configs/swagger.config.ts chứa OpenAPI spec hiện tại và Swagger UI.
- routes/index.ts chứa đường dẫn dùng chung.
- routes/index.ts khai báo health/readiness.
- middlewares/error.middleware.ts trả lỗi JSON, không lộ lỗi nội bộ.
- Swagger UI: /api/docs, OpenAPI JSON: /api/docs.json. Chỉ mô tả các API đã có.
- FRONTEND_BASE_URL cấu hình origin trình duyệt với credentials. Nếu chưa đặt thì không bật CORS cho trình duyệt. Native mobile không bị cơ chế CORS của trình duyệt kiểm soát.
- cookie-parser chỉ phân tích cookie, chưa tạo session/authentication hoặc cơ chế chống CSRF.
- Tests import factory Express, không import app.ts để tránh khởi động server/DB thật.

Routes được tổ chức theo đối tượng: routes/index.ts là đầu mối ghép router và đường dẫn; health.route.ts chứa health/readiness. Các route nghiệp vụ tương lai đặt user.route.ts, transaction.route.ts... constants/ được giữ bằng .gitkeep để thêm hằng dùng chung sau này.
