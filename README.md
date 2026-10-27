# MoneyMate

MoneyMate is your personal finance companion, built around your life and aspirations.

## Cấu trúc

- MoneyMate-fe/: ứng dụng mobile React Native + Expo SDK 58 + TypeScript.
- MoneyMate-be/: API server Node.js + TypeScript; kết nối DB sẽ được triển khai ở đây.
- docs/: tài liệu kiến trúc chung.
- .git/: một repo quản lý cả hai phần.

Hai ứng dụng có package.json, tsconfig.json, node_modules và pnpm-lock.yaml riêng.
Chạy lệnh trong đúng thư mục. Repo gốc không phải ứng dụng Node.

## Yêu cầu
Node.js LTS (backend cần ít nhất 22.18; khuyến nghị 24 LTS), npm/npx.
Sau khi cài Node, mở lại terminal VS Code.

## Frontend
Mở terminal tại thư mục MoneyMate:

~~~powershell
cd .\MoneyMate-fe
npx.cmd pnpm install
npx.cmd pnpm start --clear
~~~

Quét QR bằng Expo Go SDK 58. Điện thoại và máy tính cùng Wi-Fi.
Nếu cổng cũ đang bận, dừng terminal Expo cũ bằng Ctrl+C rồi chạy lại.
Xem nhanh web: npx.cmd pnpm web.

## Backend
Mở terminal thứ hai tại thư mục MoneyMate:

~~~powershell
cd .\MoneyMate-be
npx.cmd pnpm install
# T?o .env t? .env.example v? ?i?n DATABASE_URL cloud tr??c
npx.cmd pnpm db:check
npx.cmd pnpm dev
~~~

Mở http://127.0.0.1:3000/api/health để kiểm tra:
~~~json
{"status":"ok","service":"MoneyMate-be"}
~~~

Backend mặc định chỉ lắng nghe trên máy tính. Chưa có API thu chi hoặc kết nối DB.
Frontend hiện chưa gọi backend và vẫn chạy độc lập bằng dữ liệu mẫu.
Khi kết nối điện thoại thật, cần dùng IP LAN của máy tính, cấu hình HOST,
và API URL phù hợp; localhost trên điện thoại là chính điện thoại đó.

## Kiểm tra
Trong từng thư mục con: npx.cmd pnpm typecheck.
Trong MoneyMate-fe:
~~~powershell
npx.cmd pnpm exec expo export --platform android --platform web
~~~

## Đọc code frontend

Frontend hiện dùng Atomic Design: app → routes → screens → components.
Xem MoneyMate-fe/README.md cho cấu trúc, hướng dẫn thử ba màn hình và giới hạn bản mẫu.
Đăng nhập/đăng ký chưa kết nối API; dùng Khám phá bản trải nghiệm để xem trang chính.

## Giới hạn bản mẫu
Giao dịch chỉ tồn tại trong state, mất khi khởi động lại.
Bước tiếp theo: thiết kế DB và API trong backend, rồi frontend gọi API.
Nếu cần offline, sẽ thiết kế bộ nhớ đệm và đồng bộ riêng.


## ESLint và Prettier

Chạy trong thư mục backend hoặc frontend:

~~~powershell
npx.cmd pnpm lint
npx.cmd pnpm lint:fix
npx.cmd pnpm format
npx.cmd pnpm format:check
npx.cmd pnpm check
~~~

- ESLint phát hiện lỗi và các vấn đề code; lint:fix chỉ sửa những lỗi có thể tự sửa.
- Prettier chuẩn hóa format: 2 spaces, dấu chấm phẩy, single quotes, độ rộng 100, xuống dòng LF.
- check chạy lint, format:check và typecheck; không thay đổi file.
- Mỗi ứng dụng có eslint.config.*, .prettierrc.json và .prettierignore riêng.
- Bỏ qua thư viện, kết quả build, cache Expo, tài nguyên và lockfile khi format.
- VS Code: cài extension ESLint (Microsoft) và Prettier; cấu hình tự format và sửa lint khi lưu đã có.
- Có thể mở repo gốc hoặc riêng một thư mục con, cấu hình editor hỗ trợ cả hai.
- Frontend dùng ESLint 9 với eslint-config-expo 58: plugin React hiện chưa chạy được trên ESLint 10.
- Backend dùng ESLint 10 với typescript-eslint. Kiểm tra lại tương thích khi nâng cấp.
- Prettier chạy riêng; eslint-config-prettier tắt các quy tắc format xung đột.
