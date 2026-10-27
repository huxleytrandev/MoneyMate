# MoneyMate frontend

Expo SDK 58 + React Native + TypeScript. Cấu trúc Atomic Design.

## Chạy

```powershell
npx.cmd pnpm install
npx.cmd pnpm start --clear
```

Quét QR bằng Expo Go SDK 58. Xem web: npx.cmd pnpm web.

## Trách nhiệm folder

- app/: Expo Router nhận diện URL; chỉ nối route và lắp AppProviders ở _layout.tsx.
- routes/: điều kiện truy cập và chuyển hướng. Có welcome, auth, layout chung và route cho từng tab.
- screens/: bố cục/nội dung welcome, đăng nhập, đăng ký, tổng quan, tài sản, ngân sách, giao dịch và trợ lý.
- components/atoms: Button, Chip, Brand.
- components/molecules: FormField, PasswordField, PlanCard.
- components/organisms: AuthForm, TransactionForm, TransactionList, AssetEditor, PlanEditor.
- components/templates: ScreenTemplate, AuthTemplate, SheetTemplate.
- schemas/: Zod validate/normalize email, mật khẩu, ngày giờ, tiền và phân bổ.
- types/: interface TypeScript; không chứa runtime validation.
- hooks/: custom hooks cho form và đọc context.
- providers/: AuthProvider, FinanceProvider và AppProviders, không dùng Redux khi chưa cần.
- services/: hợp đồng gọi auth. Chưa có endpoint backend nên trả thông báo chưa khả dụng, không tạo tài khoản giả.
- helpers/: tính tài sản, actual theo tháng, định dạng ngày/tiền.
- configs/: cấu hình VND và thông tin chế độ bản mẫu.
- constants/: đường dẫn và dữ liệu mẫu theo tháng hiện tại.
- theme/: bảng màu và style chung.

## Cách thử

1. Mở Welcome, chọn Bắt đầu ngay để xem đăng ký hoặc Đăng nhập. Có thể vào bản trải nghiệm trực tiếp.
2. Thử email không hợp lệ, mật khẩu dưới 12 ký tự, xác nhận không khớp.
3. Quay lại đăng nhập và chọn Khám phá bản trải nghiệm.
4. Xem tiền mặt, tài khoản, tài sản Khác, tổng tài sản.
5. Ghi thu/chi: chọn danh mục và nguồn tiền. Nếu không chọn nguồn, đi qua bước phân bổ rồi mới lưu.
6. Có thể tạo danh mục ngay trong form. Tổng phân bổ phải bằng giao dịch.
7. Actual cập nhật theo tháng phát sinh; planned đặt riêng cho mỗi danh mục/tháng. Chạm danh mục để sửa planned.
8. Chọn tháng trước/sau, chuyển Thu nhập/Chi tiêu để so sánh.
9. Thêm tài sản hoặc chạm tài sản để cập nhật giá trị ước tính. Chênh lệch được ghi vào adjustments, không tính vào actual.
10. Thoát demo ở Tổng quan quay về Welcome; mở lại demo tạo dữ liệu mẫu mới.

## Giới hạn rõ ràng

- Đây là bản UI có nghiệp vụ local; dữ liệu mất khi reload/thoát demo.
- Đăng ký/đăng nhập có validation nhưng chưa gọi API, chưa có tài khoản thật hay token.
- Không lưu mật khẩu hoặc session vào local storage; dùng dữ liệu giả để thử form.
- Backend hiện chỉ có health/readiness; chưa có auth/CRUD. Không gửi request đến endpoint không tồn tại.
- Chưa triển khai onboarding tài sản cho tài khoản thật, sửa/xóa giao dịch, chuyển tiền nội bộ hoặc đồng bộ offline.
- Chưa có biểu đồ lịch sử tuần/quý/năm; cần dữ liệu lịch sử thật để thực hiện chính xác.
- Các ID và dữ liệu demo chưa phải DTO để gửi thẳng vào backend; cần mapping khi tích hợp.
- Frontend dùng số nguyên an toàn và giới hạn từng khoản 1 nghìn tỷ VND; backend dùng bigint và API cần truyền tiền bằng chuỗi.
- Kiểm tra phía frontend không thay thế kiểm tra quyền và nghiệp vụ ở backend.

## Kiểm tra

```powershell
npx.cmd pnpm check
npx.cmd pnpm test
npx.cmd pnpm exec expo export --platform android --platform web
```

8 bài kiểm tra thuần TypeScript: auth, phân bổ, tài sản, tháng, điều chỉnh giá trị và tóm tắt trợ lý.
Mỗi lần thêm file trong app/, chạy Expo để cập nhật typed routes trước khi typecheck.

## Giao diện UXPilot

Tham chiếu: https://uxpilot.ai/s/8d71f97007e7c8800063ed3e30f880c6

- Nền kem, màu teal và thẻ trắng bo tròn; giao diện React Native dùng chung trên Expo Go và web.
- Welcome và auth ở root. Nhóm app/(main) chứa 5 tab: Tổng quan, Giao dịch, Tài sản, Ngân sách, Trợ lý AI.
- routes/main.route.tsx bảo vệ phiên demo và lắp FinanceProvider dùng chung cho các tab. Đổi tab giữ dữ liệu; thoát demo hủy phiên.
- Thêm giao dịch bằng modal: nhập VNĐ nguyên, danh mục bắt buộc, chọn loại nguồn rồi chọn tài sản cụ thể hoặc phân bổ nhiều nguồn trước khi lưu.
- Biểu đồ tài sản và ngân sách tính từ dữ liệu trong phiên, không gán số tăng trưởng hoặc lịch sử giả.
- Trợ lý AI là giao diện xem trước: các câu gợi ý được tóm tắt bằng hàm local dựa trên số liệu hiện có. Chưa có mô hình AI, thông báo đẩy hoặc kết nối dịch vụ bên ngoài.
- Google/Apple hiển thị trạng thái chưa khả dụng; quên mật khẩu giải thích trạng thái hiện tại. Không có đăng nhập thành công giả.
- Hình welcome được lưu kèm app tại assets/images/welcome-illustration.png, lấy từ thiết kế công khai do người dùng cung cấp.
