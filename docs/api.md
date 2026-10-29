# MoneyMate API

Base URL: /api. Swagger: /api/docs. Tiền VNĐ truyền bằng chuỗi số nguyên; timestamp ISO UTC.

## Xác thực và người dùng

Các endpoint xác thực do Better Auth xử lý tại /api/auth; frontend dùng better-auth/react và @better-auth/expo/client.

| Method | Path                      | Nhiệm vụ                                                                                    |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| POST   | /auth/sign-up/email       | name, email, password (12–128 ký tự), timezone tùy chọn; tạo tài khoản và danh mục mặc định |
| POST   | /auth/sign-in/email       | email, password; Better Auth cấp cookie phiên                                               |
| POST   | /auth/sign-out            | thu hồi phiên, Better Auth xóa cookie                                                       |
| GET    | /auth/get-session         | phiên hiện tại hoặc null khi chưa đăng nhập                                                 |
| POST   | /auth/update-user         | name; cập nhật tên                                                                          |
| POST   | /auth/change-email        | newEmail; email chưa xác minh được cập nhật ngay                                            |
| POST   | /auth/change-password     | currentPassword, newPassword, revokeOtherSessions                                           |
| GET    | /users/me                 | hồ sơ ứng dụng với displayName và timezone                                                  |
| POST   | /users/me/verify-password | password; gọi Better Auth server API để xác nhận mật khẩu                                   |
| DELETE | /users/me                 | password; xóa tài khoản và dữ liệu tài chính trong một transaction                          |

Web dùng credentials: include và cookie HttpOnly. Native dùng cookie lấy bằng authClient.getCookie(), credentials: omit và Origin: moneymate:// cho API tài chính. Expo plugin tự quản lý cookie trong SecureStore. Không dùng Bearer token tự tạo và không gửi userId.

Đăng ký/đăng nhập trả user.name theo Better Auth; frontend ánh xạ thành displayName. Bộ xử lý auth có định dạng lỗi {code,message}; API nghiệp vụ giữ {error,fields?}.

Đổi thông tin hồ sơ qua các endpoint Better Auth là các thao tác độc lập; nếu một bước sau lỗi, bước trước đã thành công vẫn được lưu. Email đã xác minh cần bổ sung dịch vụ gửi mail trước khi cho đổi email. Chưa cấu hình email verification, reset password qua mail hay OAuth.

## CRUD nghiệp vụ

Mỗi resource assets, categories, plans, transactions, transfers, adjustments có:

| Method | Path                      | Ghi chú                                                 |
| ------ | ------------------------- | ------------------------------------------------------- |
| GET    | /RESOURCE?page=1&limit=30 | {data,pagination}; limit tối đa 100                     |
| GET    | /RESOURCE/:id             | bản ghi thuộc chính người dùng                          |
| POST   | /RESOURCE                 | tạo; có thể kèm UUID id để chống tạo trùng cùng request |
| PUT    | /RESOURCE/:id             | gửi đầy đủ dữ liệu tạo + version hiện tại               |
| DELETE | /RESOURCE/:id             | JSON {version}; xóa mềm                                 |

Các thuộc tính nhận khi tạo:

- assets: name, type=cash/bank/other, openingValue, openingAt, note?, isArchived?.
- categories: name, kind=income/expense, icon?, color?, sortOrder?, isArchived?.
- plans: categoryId, kind, month=YYYY-MM-01, plannedAmount, note?.
- transactions: categoryId, kind, amount, title, occurredAt, note?, allocations=[{assetAccountId,amount}]. Tổng phân bổ phải đúng amount, không trùng nguồn.
- transfers: fromAssetAccountId, toAssetAccountId, amount, occurredAt, note?.
- adjustments: assetAccountId, deltaAmount khác 0 (có thể âm), reason=valuation/reconciliation, note bắt buộc, occurredAt.

POST /assets/:id/reconcile nhận {value,version,note?}; tính delta so với số dư mới nhất và ghi điều chỉnh atomically. Không được dùng số dư cũ để ghi đè thay đổi mới.

Allocations là thành phần của transaction; không có API sửa riêng để tránh làm lệch tổng phân bổ.

GET /state?month=YYYY-MM&limit=50 là luồng đọc mobile: assets có currentBalance, summary có tổng thu/chi và actualByCategory của toàn tháng; transactions chỉ là trang đầu. GET /transactions hỗ trợ categoryId, month, kind, assetType, search, limit và cursor; totals/dayTotals bao phủ toàn bộ bộ lọc. GET /adjustments?assetId=UUID&page=1&limit=30 trả lịch sử từng tài sản. Chi tiết hợp đồng và đo hiệu năng: [performance.md](performance.md).

GET /state không truyền month giữ snapshot toàn bộ lịch sử trong repeatable-read transaction để tương thích client cũ; frontend hiện tại không gọi luồng này.

GET /statistics?start=YYYY-MM-DD&end=YYYY-MM-DD&period=week|month|quarter|year trả series cuối kỳ, actual thu/chi, planned/actual từng danh mục trong tháng cuối khoảng, monthly và growthPercent. Tối đa 731 ngày; không tính mốc tài sản tương lai.

## Quy tắc

- Chỉ được dùng danh mục và tài sản đang hoạt động, thuộc tài khoản.
- Ngày phát sinh từ ngày bắt đầu tài sản, không ở tương lai.
- Không xóa tài sản/danh mục đang được dùng; dùng isArchived.
- Thay đổi loại hoặc giá trị mở đầu của tài sản đã có phát sinh bị chặn; dùng đối soát.
- version tăng khi sửa/xóa; thay đổi tài chính còn tăng version các tài sản liên quan.
- Không tự thử lại POST bằng id khác khi mất kết nối. Tải lại dữ liệu trước; trùng ID trả 409.
- Số dư âm được phép ghi nhận; đây là app ghi chép, không thực hiện thanh toán/chuyển tiền thật.

## Lỗi

401: phiên không hợp lệ. 403: origin không được phép. 404: không có dữ liệu hoặc không thuộc người dùng. 409: trùng/xung đột phiên bản/dữ liệu đang được sử dụng. 422: input hoặc quan hệ không hợp lệ. 429: quá nhiều lần đăng nhập. 500: lỗi nội bộ đã ẩn chi tiết database.

Lỗi validation trả error và fields=[{path,message}]. Không trả credential hash hay thông tin kết nối database.
