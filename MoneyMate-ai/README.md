# MoneyMate AI

Dịch vụ TypeScript độc lập phân tích câu tiếng Việt/Anh thành intent cho MoneyMate. Hiện dùng bộ luật cục bộ, chưa kết nối LLM; không đọc/ghi database và không thực hiện giao dịch. Backend luôn validate và yêu cầu xác nhận.

## Chạy

```powershell
pnpm install
pnpm dev
```

GET /health; POST /interpret với JSON {text,today,timezone}. Mặc định chỉ listen 127.0.0.1:3001. Có giới hạn kích thước body, thời gian request và rate limit. Nếu dùng AI_SERVICE_TOKEN, backend phải gửi cùng bearer token. Non-loopback bắt buộc token; dùng HTTPS khi qua mạng.

Các lớp: server xử lý HTTP; schemas kiểm tra input; services diễn giải ý định; helpers xử lý tiền/ngày/text; types định nghĩa giao thức. Không import mã nguồn frontend/backend.

pnpm check và pnpm test để kiểm tra. Hướng dẫn sử dụng, giới hạn và luồng cấp quyền: [docs/telegram.md](../docs/telegram.md).
