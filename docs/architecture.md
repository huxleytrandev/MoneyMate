# MoneyMate architecture

## Repository

- MoneyMate-fe: Expo SDK 58, React Native, TypeScript.
- MoneyMate-be: Express, PostgreSQL/Supabase, Drizzle ORM, Zod.
- Hai ứng dụng độc lập, có package.json và lockfile riêng.

## Frontend: Atomic Design

Luồng: app -> routes -> screens -> components.

- app/_layout.tsx: lắp AppProviders, StatusBar và Stack.
- app/index.tsx, login.tsx, register.tsx: nối welcome/auth đến route.
- app/(main)/: layout và 5 tab home, transactions, assets, budget, assistant. Từng file chỉ nối route.
- routes/main.route.tsx: bảo vệ phiên demo, bọc FinanceProvider và định nghĩa thanh tab. Đổi tab dùng chung dữ liệu; thoát demo hủy provider.
- routes: kiểm tra session và điều hướng. Chưa có xác thực thật.
- screens: kết nối dữ liệu và nội dung màn hình.
- components/atoms: Button, Chip, Brand.
- components/molecules: FormField, PasswordField, PlanCard.
- components/organisms: các biểu mẫu và danh sách hoàn chỉnh.
- components/templates: bố cục màn hình, auth và modal.
- types: interface TypeScript.
- schemas: Zod kiểm tra và chuẩn hóa dữ liệu nhập.
- hooks: hành vi form, đọc context.
- providers: session demo và state tài chính. Không cần Redux ở bước này.
- services: biên tích hợp backend. Auth chưa có API nên báo chưa khả dụng.
- helpers: hàm thuần tính tài sản, actual theo tháng và định dạng.
- configs/constants/theme: cấu hình, đường dẫn, dữ liệu mẫu và thiết kế.
  Không còn folder features hoặc utils trong frontend.

## Hành vi bản mẫu

- Đăng ký/đăng nhập có validation nhưng chưa tạo tài khoản hay token.
- Chế độ demo ghi nhãn rõ, không lưu mật khẩu, dữ liệu chỉ ở trong bộ nhớ.
- Tài sản gồm tiền mặt, tài khoản và Khác, tất cả VND.
- Giao dịch bắt buộc có danh mục và phân bổ đủ vào nguồn tiền.
- Không chọn nguồn thì mở bước phân bổ trước khi lưu.
- Planned theo danh mục/tháng, actual theo thời điểm phát sinh.
- Điều chỉnh tài sản không được tính thành thu/chi.
- Giao diện theo UXPilot: welcome, auth, tổng quan, giao dịch, tài sản, ngân sách, trợ lý và modal thêm giao dịch.
- Biểu đồ cơ cấu tài sản và planned/actual lấy dữ liệu trong phiên. Trợ lý chỉ tóm tắt local và ghi rõ bản xem trước, chưa có AI/nhắc nhở thật.
- Chưa có auth/CRUD backend, persistence, sync, biểu đồ lịch sử hay onboarding tài khoản thật.
  Xem MoneyMate-fe/README.md cho hướng dẫn thử và giới hạn.

## Backend

- src/app.ts là entry point duy nhất; chờ kết nối DB trước khi listen.
- configs: environment, secrets, pg pool + Drizzle, Express factory, Swagger, lifecycle.
- routes/index.ts: ghép router và đường dẫn; mỗi đối tượng có file route riêng.
- constants: giữ cho hằng dùng chung.
- models: bảng/cột Drizzle, PK/FK, index, check, mặc định và RLS.
- types: interface nghiệp vụ, DTO và cấu hình.
- schemas: Zod validate/normalize input.
- middlewares: xử lý lỗi JSON.
- drizzle/: migration SQL và snapshots sinh từ models.
- db:generate chỉ sinh SQL local; db:migrate thay đổi DB đích.
  Không tự áp dụng migration lên cloud ngoài phạm vi công việc.
- Backend chỉ có health/readiness và Swagger; chưa có auth hoặc CRUD.
- Service tương lai phải kiểm tra quyền, trạng thái tài sản, ngày và tổng phân bổ.
- Audit updatedAt/version và lọc soft-delete phải thực hiện trong query/service.
- RLS đã khai báo, chưa có policy cho mobile gọi Data API trực tiếp.
- Tiền bigint khi xuất JSON phải chuyển thành chuỗi.
- Không log mật khẩu hoặc DATABASE_URL.

## Kiểm tra

Frontend: pnpm check, pnpm test, Expo export Android/web.
Backend: pnpm check, pnpm test.
Kết nối DB thật: pnpm db:check từ backend với .env đã cấu hình.
