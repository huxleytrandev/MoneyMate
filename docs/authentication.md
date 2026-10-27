# Xác thực MoneyMate bằng Better Auth

Backend dùng Better Auth 1.7.13, Drizzle adapter và @better-auth/expo; frontend dùng client React và Expo plugin chính thức. Helmet 8.3.0 bổ sung các HTTP security headers.

## Luồng xử lý

- /api/auth/* được gắn bằng toNodeHandler trước express.json().
- Better Auth xử lý mật khẩu, cookie ký số, phiên, chống CSRF/origin và giới hạn tần suất các endpoint auth.
- Middleware API gọi auth.api.getSession() bằng fromNodeHeaders(). Quyền sở hữu dữ liệu tài chính vẫn lấy từ user của phiên.
- Web dùng HttpOnly cookie. Native dùng Expo plugin + SecureStore và getCookie() khi gọi API tài chính.
- Không còn cookie-parser, session-cookie.ts, bộ tạo token ngẫu nhiên hay Bearer flow riêng.

## Database và chuyển đổi

Migration 0003_better_auth thêm auth_accounts, auth_sessions, auth_verifications; bổ sung email_verified/image vào users. ID người dùng và các bảng tài chính giữ nguyên.

Credential cũ được sao chép từ users.password_hash sang auth_accounts.password với provider credential. Cột password_hash được đặt null sau khi sao chép; retained column và bảng sessions cũ chỉ dành cho dọn schema ở migration riêng, không được dùng để xác thực. Các bảng auth mới bật RLS, không có policy cho client Supabase.

Legacy verifier chỉ nhận định dạng scrypt cũ đã lưu. Đăng ký và đổi mật khẩu dùng hasher Better Auth. Sau lần đăng nhập thành công bằng mật khẩu cũ, hash được nâng sang định dạng mới với điều kiện hash chưa đổi, tránh ghi đè một lần đổi mật khẩu đồng thời.

Các phiên cũ không được chấp nhận. Người dùng đăng nhập lại. Không cần đổi mật khẩu.

## Cấu hình

- BETTER_AUTH_SECRET: chuỗi ngẫu nhiên ít nhất 32 ký tự, chỉ nằm trong backend .env.
- BETTER_AUTH_URL: URL công khai của /api/auth; production bắt buộc HTTPS.
- FRONTEND_BASE_URL: origin web được tin cậy, cần khớp chính xác địa chỉ đang mở.
- moneymate:// được tin cậy cho native; exp:// chỉ được thêm trong môi trường phát triển.
- EXPO_PUBLIC_API_URL phía mobile/web vẫn là URL API kết thúc bằng /api.

Không đưa secret hoặc quyền quản trị Supabase vào frontend. Dùng cùng secret ổn định giữa các lần khởi động để các phiên Better Auth không bị vô hiệu hóa.

## Hồ sơ và xóa tài khoản

Tên, email và mật khẩu được cập nhật qua Better Auth. Giao diện kiểm tra mật khẩu hiện tại trước khi đổi email/mật khẩu. Đổi mật khẩu thu hồi các phiên khác rồi đăng xuất phiên hiện tại qua Better Auth.

DELETE /api/users/me là nghiệp vụ ứng dụng: Better Auth kiểm tra mật khẩu; backend khóa các credential, xóa dữ liệu tài chính và user trong cùng transaction. Foreign key cascade xóa account/session Better Auth. Cookie được xóa qua auth.api.signOut(), không dựng Set-Cookie thủ công. /api/auth/delete-user bị tắt để không bỏ qua việc xóa dữ liệu tài chính.

Email mới chỉ cập nhật ngay khi tài khoản chưa xác minh email. Chưa có mail provider nên chưa bật xác minh/khôi phục mật khẩu qua email. Các bước cập nhật hồ sơ là các request độc lập và có thể thành công một phần.

## Helmet và giới hạn

Helmet bật CSP, chống nhúng iframe, nosniff, referrer policy và các header mặc định khác. Development không ép nâng HTTP lên HTTPS; production bật HSTS. Swagger dùng tài nguyên cùng origin và vẫn hoạt động.

Better Auth rate limiting hiện dùng bộ nhớ của một process. Khi chạy nhiều backend instance, cần chuyển sang shared storage/gateway và cấu hình trusted proxy theo hạ tầng thực tế.

## Tài liệu chính thức

- [Express](https://better-auth.com/docs/integrations/express)
- [Expo](https://better-auth.com/docs/integrations/expo)
- [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)
- [Helmet](https://helmetjs.github.io/)

Các endpoint xác nhận mật khẩu/xóa tài khoản của ứng dụng dùng express-rate-limit (10 yêu cầu/phút/IP). Bộ giới hạn của Better Auth áp dụng cho auth handler. Cả hai đang dùng memory store; nhiều instance cần shared storage.
