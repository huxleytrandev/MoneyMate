# MoneyMate architecture

## Luồng backend

HTTP → routes → middlewares → controllers → services → repositories → Drizzle models → PostgreSQL.

Controller giữ xử lý giao tiếp HTTP. Service kiểm tra nghiệp vụ và điều phối transaction. Repository thực hiện truy vấn được ràng buộc chủ sở hữu, trạng thái xóa mềm và version. Model mô tả cấu trúc database; types mô tả kiểu TypeScript; schemas kiểm tra/chuẩn hóa runtime.

Các quy tắc đăng ký/đăng nhập nằm trong validations/auth.validation.ts và được schemas/user.schema.ts tái sử dụng. utils là hàm hỗ trợ dùng chung; constants tách theo user/finance.

src/app.ts lắp dependencies, kết nối database rồi mới mở cổng. configs/express.config.ts tạo app có thể inject database để kiểm thử.

## Phiên và quyền

Mật khẩu scrypt. Token phiên ngẫu nhiên, database lưu hash, hết hạn 7 ngày. Native lưu token trong SecureStore; web dùng cookie HttpOnly. Middleware đọc phiên và xác định userId; client không được quyết định chủ sở hữu.

Service không cho tham chiếu tài sản hoặc danh mục người khác. FK ghép bảo vệ thêm quan hệ chủ sở hữu. RLS không cấp mobile quyền gọi Supabase trực tiếp.

## Tài chính và đồng thời

VND nguyên, bigint ở server và chuỗi trong JSON. Frontend giới hạn số nguyên an toàn. Timestamps API chuẩn ISO UTC, kỳ lịch theo múi giờ tài khoản.

Giao dịch luôn có danh mục phù hợp và phân bổ đủ tổng tiền. Ghi/sửa transaction và allocations trong cùng transaction. Ghi cùng tài khoản được tuần tự hóa; version chặn update/delete và đối soát từ dữ liệu cũ.

Số dư tính từ nguồn dữ liệu hiện có, không duy trì cột balance dư thừa. Chuyển tiền là hai chiều giữa tài sản; không ghi thu/chi. Đối soát/định giá là delta tài sản; không cộng actual.

Planned theo category và tháng; 0 khác chưa lập kế hoạch. Actual lọc theo tháng occurredAt. Biểu đồ tài sản tính cuối kỳ và không cộng khoản ở tương lai. Khi số dư đầu khoảng bằng 0, growthPercent trả null.

Báo cáo được tính lại từ các bản ghi chưa xóa; đây không phải sổ cái bất biến. Sửa/xóa hoặc ghi lùi ngày có thể làm thay đổi báo cáo quá khứ.

## Frontend

app → routes → screens → Atomic Design components. App/layout và từng file route giữ nhẹ.

AuthProvider quản lý phiên thật. FinanceProvider nằm trên 5 tab để chia sẻ snapshot, phản hồi lỗi và ghi qua API; không dùng dữ liệu mẫu. Sau mutation thành công tải lại snapshot; khi chưa xác nhận lưu thành công không cập nhật số dư.

Các màn hình: Welcome, auth, Tổng quan, Giao dịch, Tài sản, Ngân sách và Trợ lý. Thành phần organisms có các form quản lý tài sản, category, kế hoạch, giao dịch, chuyển tiền, hồ sơ và thống kê.

Tài khoản mới có danh mục mặc định nhưng không có tài sản hoặc giao dịch giả. Người dùng nhập tiền đang có và ngày bắt đầu. Trợ lý hiện dùng quy tắc thống kê, chưa dùng LLM.

## Kiểm tra và giới hạn

Unit/HTTP tests cho validation, tiền, password/session và HTTP. Integration test riêng tạo tài khoản disposable trên PostgreSQL thật và dọn lại. Frontend có kiểm thử mapping API, múi giờ, phân bổ, chuyển tiền và planned/actual; export Android/web để kiểm tra cấu trúc Expo.

Chưa có offline/sync, OAuth, SMTP hoặc nhắc nhở đẩy. Chưa kiểm thử giao diện trên điện thoại vật lý trong môi trường này. Snapshot và báo cáo cần tối ưu SQL khi lịch sử lớn; rate limit cần shared storage khi chạy nhiều server.

Xem README từng package và docs/api.md.

## Phân chia controller

Controller tách theo auth, user, asset, category, plan, transaction, transfer, adjustment và statistics. finance.controller.ts chỉ xử lý snapshot /api/state. routes/resource.route.ts chỉ tái sử dụng mẫu URL CRUD, không chọn nghiệp vụ thay cho controller. Các controller dùng cùng service để giữ nguyên transaction, kiểm tra sở hữu và version.

### Small functions and explicit operations

Backend financial writes expose create, update and remove commands instead of a flag-driven write method. Resource preparers validate each domain; movement tracking and report calculations have dedicated functions. All writes retain the same user lock and database transaction.

Frontend providers compose loading, mutation coordination and API actions. Screen hooks own interaction state; helpers prepare payloads, search transactions and calculate planned/actual summaries without mutating source data. Larger dashboard, budget, asset and assistant sections render separately. Archive/restore and detail/allocation submission use explicit actions.

## Performance

Read paths use SQL pagination/aggregation through finance-read.service and repositories, independently of mutation commands. Writes never load a whole-user snapshot. Month windows expose authoritative balances/summary; frontend must not total a partial page. Cursor paging keeps timestamp microseconds plus id. See performance.md for measurements and contracts.

## Điều hướng và UI tài chính

FinanceProvider bao ngoài Stack trong (main). Stack chứa (tabs) với năm màn hình chính và category/[id] cho chi tiết danh mục. Các file src/app chỉ cấu hình/ủy quyền cho routes; screen và hook vẫn tách khỏi layout. Với Expo Router SDK 58, anchor được export từ layout thay vì truyền initialRouteName vào Stack.

Button/ConfirmDialog dùng React Native Paper, SheetTemplate dùng @expo/ui, MoneyInput dùng react-native-currency-input; theme giữ bảng màu chung. MoneyField chỉ định dạng hiển thị, không thay đổi đơn vị hoặc hợp đồng tiền nguyên VNĐ. Icon/màu danh mục được truyền đầy đủ qua types, schema và payload.

Bộ lọc categoryId thực hiện tại transaction-read.repository cùng bộ lọc chủ sở hữu/tháng/xóa mềm, dùng chung cho trang và tổng hợp. Trang chi tiết không lọc từ snapshot 50 giao dịch đầu. Không cần migration mới vì category.icon/color và index theo user/category/date đã có.
