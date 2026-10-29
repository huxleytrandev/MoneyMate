# MoneyMate — ERD và system flow

Cập nhật theo mã nguồn ngày **28/10/2026**, đối chiếu `MoneyMate-be/src/models`, routes, controllers, services, repositories và luồng frontend. Không truy vấn catalog Supabase và không thay đổi database.

Mở `index.html` để xem toàn bộ. Dùng SVG khi cần phóng to hoặc đưa vào tài liệu thiết kế; PNG để chèn vào báo cáo. Cả ba sơ đồ đều có nền trắng.

| File | Nội dung |
| --- | --- |
| `01-erd-finance.svg` / `.png` | 8 bảng tài chính và người dùng; thuộc tính, kiểu dữ liệu, PK/FK, nullable, khóa ghép và các ràng buộc chính. |
| `02-erd-auth.svg` / `.png` | `users` và 4 bảng xác thực; phân biệt Better Auth hiện tại và bảng phiên cũ. |
| `03-system-flow.svg` / `.png` | Frontend → API → nghiệp vụ → repository → PostgreSQL, đường trả kết quả/lỗi, luồng auth và tải lại dữ liệu sau ghi. |

Tổng cộng **12 bảng ứng dụng**, vì `users` xuất hiện trong cả hai ERD. Bảng nội bộ của Supabase và lịch sử migration không nằm trong phạm vi. `common.model.ts` định nghĩa các cột audit dùng chung, không tạo một bảng riêng.

## Cách đọc ERD

- **PK**: khóa chính; **FK**: khóa ngoại; **UQ**: duy nhất; **NN / NOT NULL**: bắt buộc; **NULL**: có thể trống.
- **1 → 0..N**: một bản ghi cha có thể có nhiều bản ghi con; mỗi bản ghi con tham chiếu đúng một cha.
- Mọi `user_id` đều có FK trực tiếp tới `users.id`. Để tránh đường nối chồng lên thuộc tính, một số đường sở hữu được thay bằng nhãn đích ngay tại cột.
- **FK\*** là thành phần khóa ngoại ghép. Dòng cuối hình tài chính liệt kê chính xác các cột nguồn và đích, bao gồm `user_id` để ngăn tham chiếu chéo người dùng.
- **UQ\*** ở `categories.kind` nói đến khóa duy nhất ghép `(user_id, id, kind)`, không có nghĩa `kind` tự nó là duy nhất hay là một FK.
- Tiền dùng `bigint`, đơn vị VNĐ; qua JSON truyền dạng chuỗi để giữ chính xác. `timestamptz` là PostgreSQL timestamp with time zone.

## Những điểm nghiệp vụ cần lưu ý

- `monthly_category_plans` lưu Planned. Actual được tổng hợp từ `transactions` theo danh mục và tháng, dựa trên múi giờ người dùng.
- Số dư hiện tại = số dư mở đầu + thu − chi + chuyển vào − chuyển ra + các điều chỉnh, với điều kiện thời điểm và xóa mềm phù hợp. `currentBalance` là dữ liệu trả từ truy vấn, không phải cột trong `asset_accounts`.
- `transaction_allocations` là bảng nối giữa giao dịch và nguồn tiền. Một giao dịch có thể phân bổ vào nhiều tài sản. Service bắt buộc ít nhất một phân bổ và tổng phân bổ bằng số tiền giao dịch; FK riêng lẻ không tự bảo đảm điều kiện tổng này.
- `transfers` chỉ chuyển tài sản nội bộ, không làm tăng thu nhập hoặc chi tiêu thống kê.
- Bảng tài chính có `version` để phát hiện chỉnh sửa đồng thời và `deleted_at` để xóa mềm; allocations không có hai cột này.
- `auth_sessions`, `auth_accounts`, `auth_verifications` thuộc Better Auth. `sessions` và `users.password_hash` là phần legacy còn giữ trong schema. Ứng dụng không sử dụng Supabase Auth để đăng nhập.
- RLS được bật trong models; sơ đồ không ngụ ý có policy cho phép frontend truy cập database trực tiếp. Frontend hiện gọi backend và backend kiểm tra quyền sở hữu.

## Nguồn đối chiếu

- Database: `MoneyMate-be/src/models/*.model.ts`.
- Backend: `src/configs/express.config.ts`, `src/configs/auth.config.ts`, `src/routes/api.route.ts`, middlewares, finance/read/statistics services và repositories.
- Frontend: `src/providers`, `src/hooks/useFinanceMutation.ts`, `src/hooks/useFinanceData.ts`, `src/services/finance-actions.service.ts`, `src/services/api.service.ts`, `src/services/auth.service.ts`.

`build_diagrams.py` là nguồn dựng SVG/PNG, cần Python và Pillow cùng font Arial của Windows. Khi đổi model hoặc luồng xử lý, cập nhật nội dung script rồi chạy lại. Script không tự trích xuất schema và không truy cập database.
