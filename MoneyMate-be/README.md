# MoneyMate backend

Express 5 + TypeScript + PostgreSQL/Supabase + Drizzle + Zod.

## Trách nhiệm từng folder

- routes: định tuyến HTTP; mỗi đối tượng có file route riêng.
- controllers: đọc request, gọi service, tạo HTTP status/JSON; Better Auth quản lý cookie.
- services: nghiệp vụ, quyền sở hữu, ngày phát sinh, số dư, thống kê và transaction.
- repositories: đọc/ghi bằng Drizzle, lọc userId/deletedAt, cập nhật version/updatedAt.
- models: bảng/cột, kiểu lưu trữ, PK/FK, index/check/unique và RLS.
- types: interface TypeScript, DTO, kiểu database và kết quả truy vấn.
- schemas: Zod kiểm tra và chuẩn hóa dữ liệu đầu vào.
- validations/auth.validation.ts: quy tắc email, mật khẩu, tên, múi giờ và đăng ký/đăng nhập. user.schema.ts tái sử dụng/re-export, không nhân đôi quy tắc.
- middlewares: xác thực phiên, giới hạn đăng nhập, kiểm tra origin, JSON và xử lý lỗi.
- utils: tương thích mật khẩu cũ, lỗi ứng dụng, JSON bigint/ISO, tính số dư và mốc lịch.
- constants: lựa chọn nghiệp vụ, danh mục mặc định và thông báo theo nhóm.
- configs: môi trường, secret, kết nối database, Express, Swagger và lifecycle.
- drizzle: SQL migrations và metadata.
- tests: unit/HTTP tests và integration test PostgreSQL.

## Database và xác thực

12 bảng: users, auth_accounts, auth_sessions, auth_verifications, sessions (legacy), asset_accounts, categories, monthly_category_plans, transactions, transaction_allocations, transfers, asset_adjustments.

Xác thực dùng Better Auth + Drizzle + Expo plugin. Better Auth quản lý mật khẩu, cookie ký số, phiên, CSRF/origin và auth rate limiting. Web dùng HttpOnly cookie; native dùng cookie do Expo plugin lưu trong SecureStore. Chi tiết cấu hình, migration và giới hạn: [authentication.md](../docs/authentication.md).

Đây là tài khoản ứng dụng trong public.users, không phải Supabase Auth users. Không có email xác minh/khôi phục hoặc Google/Apple OAuth.

Mọi dữ liệu tài chính được lọc theo userId lấy từ phiên, không nhận userId do client gửi. API tiền dùng chuỗi số nguyên VNĐ để giữ chính xác bigint; timestamps trả ISO UTC.

Các mutation cùng một người dùng được tuần tự hóa bằng PostgreSQL advisory transaction lock. Giao dịch và toàn bộ phân bổ được ghi atomically. Sửa/xóa yêu cầu version mới nhất; mỗi thay đổi ảnh hưởng số dư tăng version tài sản để chặn đối soát từ dữ liệu cũ. Snapshot đọc trong repeatable-read transaction.

Tài sản/danh mục đang được dùng không được xóa tùy tiện hoặc đổi loại; dùng isArchived. Giao dịch/chuyển tiền/điều chỉnh/kế hoạch được xóa mềm. Xóa tài khoản yêu cầu mật khẩu và xóa toàn bộ dữ liệu của chính người dùng.

Số dư = giá trị mở đầu + thu − chi + chuyển vào − chuyển ra + điều chỉnh. Chuyển tiền và điều chỉnh không nằm trong actual thu/chi. Hệ thống có thể ghi nhận số dư âm; không thực hiện chuyển tiền ngân hàng thật.

## Cấu hình và chạy

Dùng Node >=22.18. Tạo .env từ .env.example nếu chưa có; giữ nguyên DATABASE_URL đã cấu hình.

```powershell
npx.cmd pnpm install
npx.cmd pnpm db:check
npx.cmd pnpm dev
```

HOST=0.0.0.0 cho điện thoại cùng LAN. FRONTEND_BASE_URL=http://localhost:8081 cho web local; phải khớp origin frontend. Native dùng Expo plugin và gửi cookie cùng Origin: moneymate:// khi gọi API tài chính. Cookie web yêu cầu frontend/API cùng site; khi triển khai cần HTTPS và cấu hình domain phù hợp.

Swagger: /api/docs; JSON đặc tả: /api/docs.json. Xem ../docs/api.md.

## Migrations

```powershell
npx.cmd pnpm db:generate
npx.cmd pnpm db:migrate
```

generate tạo SQL local. migrate thay đổi database trong DATABASE_URL; rà soát SQL và đúng đích trước khi chạy. Các migration 0000–0003 đã được áp dụng lên Supabase, gồm chuyển đổi Better Auth.

RLS bật cho các bảng, chưa cấp policy cho anon/authenticated. App chỉ gọi backend. Backend phải dùng role có quyền phù hợp; không đưa DATABASE_URL hoặc quyền quản trị Supabase xuống frontend.

## Kiểm tra

```powershell
npx.cmd pnpm check
npx.cmd pnpm test
```

Unit/HTTP tests không cần database. Integration test mặc định bỏ qua, bật riêng:

```powershell
$env:RUN_DB_TESTS='1'
npx.cmd pnpm test
Remove-Item Env:RUN_DB_TESTS
```

Integration test tạo hai tài khoản riêng với email example.invalid, chạy HTTP API với Supabase thật và xóa các tài khoản đó trong finally. Không dùng tài khoản người dùng để kiểm thử.

Giới hạn đăng nhập hiện lưu trong bộ nhớ process; khi chạy nhiều instance cần giới hạn tập trung ở gateway/Redis. Báo cáo/snapshot hiện tải dữ liệu của người dùng để tính toán; cần tổng hợp SQL và phân trang snapshot khi quy mô lịch sử lớn.

## Controllers theo đối tượng

- auth: endpoint do Better Auth handler quản lý; không có controller cookie tự làm.
- user: đọc hồ sơ, xác nhận mật khẩu bằng Better Auth và xóa tài khoản cùng dữ liệu tài chính.
- asset, category, plan, transaction, transfer, adjustment: CRUD riêng từng đối tượng; asset còn có reconcile.
- statistics: báo cáo thống kê.
- finance: chỉ snapshot tổng hợp /api/state để frontend tải dữ liệu ban đầu.

Mỗi route nối với controller tương ứng. utils/controller.ts dùng chung việc lấy người dùng đã xác thực, phân trang và tìm bản ghi; configs/auth.config.ts giữ cấu hình Better Auth. Logic nghiệp vụ và transaction vẫn nằm trong service/repository.

Integration test dùng thời gian chờ kết nối/truy vấn 30 giây để chịu được độ trễ Supabase cloud; cấu hình truy vấn mặc định của API vẫn là 5 giây.

BETTER_AUTH_SECRET là bắt buộc và phải giữ riêng trong .env. BETTER_AUTH_URL mặc định http://localhost:3000/api/auth; dùng HTTPS ở production. Helmet bảo vệ HTTP headers cho API và Swagger. Cookie/token cũ yêu cầu đăng nhập lại.

Các endpoint xác nhận mật khẩu/xóa tài khoản của ứng dụng dùng express-rate-limit (10 yêu cầu/phút/IP). Bộ giới hạn của Better Auth áp dụng cho auth handler. Cả hai đang dùng memory store; nhiều instance cần shared storage.
