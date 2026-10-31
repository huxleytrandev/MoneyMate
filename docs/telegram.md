# MoneyMate Telegram

## Chạy local

Mở ba terminal từ thư mục gốc MoneyMate (Node >=22.18, pnpm):

```powershell
pnpm --dir MoneyMate-ai dev
pnpm --dir MoneyMate-be dev
pnpm --dir MoneyMate-fe start
```

Nếu chưa có pnpm trong PATH, dùng npx pnpm thay pnpm. Cài dependencies riêng từng package bằng pnpm --dir <package> install. AI chạy ở 127.0.0.1:3001, backend gọi AI qua localhost; điện thoại chỉ cần gọi backend. Polling không cần public URL hay cùng Wi-Fi với Telegram.

## Liên kết

1. Đăng nhập MoneyMate bằng Better Auth → Hồ sơ → Telegram → Kết nối.
2. Bấm Mở bot và Start trong Telegram.
3. Trở lại Hồ sơ, kiểm tra tên, username và Telegram user ID rồi xác nhận cấp quyền.
4. Gửi /menu hoặc /help cho bot. Có thể thu hồi quyền trong app hoặc /unlink và xác nhận trong bot.

Đường dẫn chỉ có hiệu lực 10 phút và dùng một lần. Backend chỉ lưu hash token. Start chưa cấp quyền: phải xác nhận từ phiên Better Auth trong app. Username chỉ để hiển thị; quyền được kiểm tra bằng bot ID + numeric Telegram user ID + private chat ID. Không nhận lệnh từ group/channel. Đổi bot cần liên kết lại.

## Chức năng

- Danh sách phân trang, xem chi tiết, thêm/sửa/xóa giao dịch, tài sản, danh mục, kế hoạch tháng, chuyển tiền nội bộ, điều chỉnh tài sản.
- Lưu trữ/khôi phục tài sản và danh mục; đối soát số dư tài sản.
- Cập nhật tên, giới tính, ngày sinh và ảnh JPEG đại diện nhỏ hơn 128 KB.
- Xem tổng tài sản theo số dư thật, planned/actual và chênh lệch theo danh mục, báo cáo tuần/tháng/quý/năm và thanh biểu đồ trong tin nhắn.
- Các thao tác bảo mật như đổi email/mật khẩu, đăng xuất phiên app và xóa tài khoản yêu cầu quay lại app để xác thực lại. Không gửi mật khẩu cho bot.

Lệnh: /menu, /help, /cancel, /balance, /transactions, /assets, /categories, /plans, /transfers, /adjustments, /profile, /report 2026-10, /new transactions, /edit transactions <UUID>, /delete transactions <UUID>, /show transactions <UUID>, /unlink.

Ví dụ tiếng Việt: “ăn trưa 50k tiền mặt”, “nhận lương 15 triệu vào VCB”, “đặt ngân sách ăn uống tháng sau 2 triệu”, “xem số dư”, “báo cáo tháng này”. Bot hỏi tiếp khi thiếu/không rõ nguồn, danh mục hoặc bản ghi. Danh sách gợi ý có giới hạn; nhập tên chính xác hoặc UUID để tìm bản ghi chưa hiển thị. Nhiều nguồn: chọn Phân bổ nhiều nguồn hoặc nhập theo hướng dẫn tên nguồn:50k; nguồn khác:100k. Mỗi khoản tiền phải là số nguyên VND; tổng phân bổ phải bằng giá trị giao dịch.

Mọi thay đổi đều có bản xem trước và nút Xác nhận, hết hạn sau 10 phút. Hủy không sửa dữ liệu. Callback cũ, dữ liệu khác chủ, phiên bản bản ghi cũ và liên kết đã thu hồi đều bị từ chối. Ngày/giờ được kiểm tra theo múi giờ tài khoản kể cả thời điểm không tồn tại khi đổi DST.

## Kiến trúc

Telegram API → polling/webhook → inbox PostgreSQL → engine/conversation → services dùng chung với app → repositories/Drizzle → PostgreSQL → outbox → Telegram API.

App Hồ sơ → protected /api/telegram → auth-telegram.service → bảng liên kết. Không tạo hệ thống password/session thứ hai.

MoneyMate-ai nhận text + ngày hiện tại + múi giờ, trả đề xuất intent; không có database credential, token bot hay quyền thực thi. Backend kiểm tra schema, ownership, business rules và yêu cầu xác nhận trước khi ghi.

Hiện AI dùng bộ phân tích luật tiếng Việt/Anh cục bộ, không cần khóa trả phí. Đây chưa phải LLM hội thoại tổng quát: câu ngoài phạm vi có thể cần menu/hỏi bổ sung. Điểm mở rộng LLM là dịch vụ interpret; đề xuất từ LLM tương lai vẫn phải qua cùng hàng rào kiểm tra và xác nhận.

## Cấu hình

Trong MoneyMate-be/.env: TELEGRAM_BOT_TOKEN, TELEGRAM_MODE=polling (mặc định), AI_SERVICE_URL=http://127.0.0.1:3001. Không commit token. Không cần sửa cấu hình Better Auth.

Trong MoneyMate-ai/.env có thể đặt AI_HOST=127.0.0.1, AI_PORT=3001 và AI_SERVICE_TOKEN. Nếu đặt token phải giống AI_SERVICE_TOKEN ở backend. Khi tách AI sang máy khác, dùng HTTPS, token mạnh và kiểm soát truy cập mạng; không public dịch vụ không có xác thực.

pnpm --dir MoneyMate-be telegram:check kiểm tra danh tính bot/webhook mà không in token. telegram:setup đăng ký command menu. Chỉ chạy một backend worker cho mỗi bot (advisory session lock). Kết nối PostgreSQL cho worker phải giữ session (direct hoặc Supabase Session pooler), không dùng Transaction pooler cho advisory session lock. Không chạy polling đồng thời với một webhook đang tồn tại.

Webhook tùy chọn: TELEGRAM_MODE=webhook, TELEGRAM_PUBLIC_URL=https://<backend>, TELEGRAM_WEBHOOK_SECRET ngẫu nhiên ít nhất 32 ký tự; telegram:setup đăng ký /api/telegram/webhook và secret header. Polling là lựa chọn đơn giản cho local. Chuyển ngược từ webhook cần chủ động gỡ webhook trên Telegram; ứng dụng không tự gỡ.

## Dữ liệu và độ tin cậy

Migration 0006–0008 bổ sung links, link_requests, conversations, actions, inbox, outbox, bot_state và index; đã áp dụng theo sự đồng ý của người dùng. Các bảng bật RLS, chỉ backend credential được truy cập; không cấp quyền anon/frontend đọc trực tiếp.

Inbox khử trùng theo bot/update ID, lưu cursor trước khi Telegram xác nhận cập nhật. Transaction bao gồm thao tác tài chính, trạng thái xác nhận và outbox; khóa theo user + khóa action ngăn ghi trùng khi xác nhận lại. Lỗi trước commit rollback toàn bộ. Telegram gửi tin có thể trùng khi mạng mất sau khi Telegram nhận nhưng trước khi backend đánh dấu; không tuyên bố gửi tin exactly-once. Ghi tài chính được khử trùng bằng action lưu bền vững.

Hàng đợi có retry/backoff, tôn trọng retry_after, giữ failed để điều tra. Cleanup hàng giờ: yêu cầu/hội thoại hết hạn; actions sau 7 ngày; inbox đã xử lý/thất bại sau 7 ngày; outbox đã gửi/thất bại sau 1 ngày. Không xóa pending bằng cleanup này. Payload chat/preview có thể chứa dữ liệu tài chính và ảnh: hạn chế quyền DB, bảo vệ backup. Thu hồi liên kết xóa draft/action theo cascade; bản sao queue theo retention nói trên. Thu hồi quyền cũng chặn giao tin riêng tư đang chờ.

## Kiểm tra

pnpm --dir MoneyMate-be check; pnpm --dir MoneyMate-be test; pnpm --dir MoneyMate-ai check; pnpm --dir MoneyMate-ai test. Đặt RUN_DB_TESTS=1 để chạy kiểm thử Supabase bằng tài khoản fixture được dọn trong finally. Không chạy thử trên tài khoản người dùng thật. Frontend: typecheck, test và Expo export Android/web.

Tài liệu Telegram chính thức: https://core.telegram.org/bots/api và https://core.telegram.org/bots/features#deep-linking.


## Xóa tài khoản và bản sao Telegram

Migration 0009–0010 thêm user_id và index vào inbox/outbox, tham chiếu users với ON DELETE CASCADE. Backend gắn chủ sở hữu khi nhận update và kế thừa chủ sở hữu khi tạo outbox, để việc ngắt/đổi liên kết không làm mất dấu quyền sở hữu bản sao. Dữ liệu cũ được gắn chủ từ liên kết hiện có và inbox tương ứng khi xác định được.

Sau khi Better Auth kiểm tra đúng mật khẩu, xóa bản sao Telegram và dữ liệu tài khoản chạy trong cùng transaction; lỗi sẽ rollback. Chỉ xóa bản sao thuộc tài khoản được xác thực, không xóa hàng đợi của người khác hay dữ liệu khác bot theo danh tính trùng. Engine dùng cùng khóa user để tránh ghi trả lời tài chính đồng thời lúc xóa tài khoản. Không gọi API xóa chat/tin nhắn trên Telegram. Dữ liệu cũ không xác định được chủ vẫn theo retention; không đoán chủ để xóa nhầm.
