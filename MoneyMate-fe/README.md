# MoneyMate frontend

React Native + Expo SDK 58 + TypeScript, Atomic Design. Dữ liệu lấy từ API thật, không có chế độ demo.

## Chạy

```powershell
npx.cmd pnpm install
npx.cmd pnpm start --clear
```

Khởi động backend trước. Điện thoại và máy tính cùng Wi-Fi. API URL tự lấy hostname web hoặc IP máy đang chạy Expo. Nếu cần, đặt EXPO_PUBLIC_API_URL trong .env rồi khởi động lại Expo. Chỉ đặt URL công khai, không đặt secret hay DATABASE_URL trong frontend.

Web cần FRONTEND_BASE_URL của backend khớp origin (mặc định http://localhost:8081). Dùng localhost trên điện thoại sẽ trỏ vào chính điện thoại, không phải máy tính.

## Tổ chức

app → routes → screens → components/atoms, molecules, organisms, templates.

- providers/AuthProvider: khôi phục phiên Better Auth; configs/auth.config.ts dùng better-auth/react và @better-auth/expo/client. Expo plugin quản lý SecureStore trên native; browser quản lý HttpOnly cookie trên web.
- providers/FinanceProvider: tải snapshot API; ghi thành công rồi mới tải lại dữ liệu. Không cập nhật số dư giả khi request thất bại.
- services: HTTP, auth và CRUD.
- helpers/api.ts: ánh xạ wire DTO tiền chuỗi sang số nguyên an toàn. Từ chối dữ liệu vượt giới hạn an toàn, không làm tròn âm thầm.
- helpers/date.ts: ngày/tháng và input theo múi giờ tài khoản.
- schemas: Zod kiểm tra form.
- types: interface TypeScript.
- configs/api.config.ts: địa chỉ API; theme/constants giữ thiết kế và hằng dùng chung.

## Luồng sử dụng

Đăng ký → tài khoản thật và danh mục mặc định → nhập tài sản ban đầu → đặt planned tháng → ghi actual.

Có thể thêm nhiều tài khoản ngân hàng. Chạm giao dịch để sửa hoặc xóa. Quản lý danh mục ở Ngân sách; đổi tên/lưu trữ tài sản và lịch sử đối soát ở Tài sản. Chuyển tiền nội bộ không tính actual. Hồ sơ ở Tổng quan hỗ trợ đổi tên/email/mật khẩu và xóa tài khoản có xác nhận.

Biểu đồ planned/actual, cơ cấu tài sản và biến động tài sản dùng dữ liệu thật. Trợ lý tóm tắt theo quy tắc từ snapshot, chưa gọi mô hình AI. Google/Apple và khôi phục mật khẩu qua email chưa hỗ trợ.

Dữ liệu được lưu Supabase qua backend và vẫn còn sau reload. Chưa có cache offline hoặc đồng bộ khi mất mạng. Session hết hạn cần đăng nhập lại.

## Kiểm tra

```powershell
npx.cmd pnpm check
npx.cmd pnpm test
npx.cmd pnpm exec expo export --platform android --platform web
```

Dữ liệu cố định chỉ tồn tại trong tests/fixtures; không import vào ứng dụng.

Sau migration Better Auth, cần đăng nhập lại một lần. Không lưu Bearer token thủ công. Cấu hình server và các giới hạn email ở ../docs/authentication.md.

## Hiệu năng với lịch sử lớn

Frontend gọi /state?month=YYYY-MM&limit=50, không tải toàn bộ lịch sử. Số dư tài sản, tổng thu/chi tháng và actual theo danh mục lấy từ các trường tổng hợp của server; các giá trị này không được suy ra từ trang giao dịch đang hiển thị.

Ngân sách giữ tối đa ba snapshot tháng và vô hiệu hóa cache sau khi ghi thành công. Giao dịch dùng truy vấn cursor riêng, debounce tìm kiếm 250 ms, hủy request cũ và SectionList ảo hóa. Khi sửa/xóa bản ghi ngoài snapshot đầu, gửi version của bản ghi đang mở.

Các helper thu/chi và số dư dùng Map/WeakMap; formatter ngày/tiền được tái sử dụng. tests/performance.test.ts kiểm tra 20.000 giao dịch, giới hạn formatter, độ chính xác của tổng tháng và tổng ngày khi phân trang.

Lịch sử đối soát trong từng tài sản dùng GET /adjustments?assetId=...&page=...&limit=30 với nút trang trước/sau. Không suy ra lịch sử tài sản từ danh sách điều chỉnh gần đây của dashboard; trước khi tải xong không hiển thị thông báo trống.
