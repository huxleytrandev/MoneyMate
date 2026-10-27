# MoneyMate

Ứng dụng quản lý tài sản và thu chi cá nhân: React Native/Expo → Express API → PostgreSQL trên Supabase.

## Chạy local

Mở hai terminal từ folder MoneyMate.

Backend:

```powershell
cd .\MoneyMate-be
npx.cmd pnpm install
npx.cmd pnpm dev
```

Frontend:

```powershell
cd .\MoneyMate-fe
npx.cmd pnpm install
npx.cmd pnpm start --clear
```

Database đã được tạo bằng migrations trong quá trình triển khai API. Khi thêm model hoặc đổi database đích, xem hướng dẫn migration trong MoneyMate-be/README.md.

Điện thoại dùng Expo Go SDK 58 và cùng Wi-Fi với máy tính. Backend cần HOST=0.0.0.0 trong MoneyMate-be/.env. Frontend tự lấy IP máy chạy Expo; có thể ghi đè bằng EXPO_PUBLIC_API_URL=http://IP_MAY_TINH:3000/api trong MoneyMate-fe/.env. Khởi động lại Expo sau khi đổi biến môi trường. Chạy Expo bằng tunnel không tự tạo tunnel cho backend.

Web mặc định chạy ở http://localhost:8081. FRONTEND_BASE_URL trong backend phải khớp origin đang mở. Swagger: http://localhost:3000/api/docs.

## Sử dụng

1. Đăng ký hoặc đăng nhập tài khoản thật.
2. Thêm tiền mặt, từng tài khoản ngân hàng và các tài sản Khác. Nhập số dư tại ngày bắt đầu.
3. Đặt kế hoạch tháng cho danh mục thu và chi.
4. Ghi giao dịch với danh mục và nguồn tiền cụ thể, hoặc chia đủ số tiền vào nhiều nguồn.
5. Chạm giao dịch để sửa/xóa; thay đổi cập nhật lại số dư và actual.
6. Chuyển tiền nội bộ chỉ ghi nhận giữa các nguồn, không thực hiện lệnh chuyển tiền ngân hàng.
7. Đối soát tài sản, xem biểu đồ tài sản và kế hoạch/thực tế.
8. Tải lại app vẫn đọc lại dữ liệu từ Supabase. Không còn nút vào demo hoặc số dư mẫu.

## Đọc code

- Backend: routes → controllers → services → repositories → models/database.
- Frontend: app → routes → screens → Atomic Design components.
- Xem docs/architecture.md, docs/api.md và README trong từng ứng dụng.
- Hai package dùng pnpm, có lockfile riêng. Không import source chéo frontend/backend.
- Không commit .env hoặc thông tin kết nối.

## Kiểm tra

Trong mỗi package: npx.cmd pnpm check và npx.cmd pnpm test.
Frontend: npx.cmd pnpm exec expo export --platform android --platform web.
Kiểm thử PostgreSQL thật được bật riêng trong backend bằng RUN_DB_TESTS=1; xem README backend.

Phần trợ lý hiện tóm tắt số liệu bằng quy tắc thống kê; chưa tích hợp mô hình AI, nhắc nhở đẩy, đăng nhập Google/Apple hay email khôi phục mật khẩu. Chưa có chế độ offline/sync.
