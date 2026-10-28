# Tối ưu hiệu năng MoneyMate

## Kết quả đo

Fixture riêng trên Supabase: 20.000 giao dịch đang hoạt động, 8 tài sản, 32 danh mục, khoảng 366 ngày. Tài khoản và dữ liệu benchmark đã được xóa sau khi đo; không dùng tài khoản thật.

| Thao tác                  |        Tham chiếu trước tối ưu |              Sau tối ưu |
| ------------------------- | -----------------------------: | ----------------------: |
| Tải dữ liệu đầu màn hình  | 16.504,50 ms / 13.911.503 byte | 129,95 ms / 63.231 byte |
| Thêm giao dịch            |                    8.953,37 ms |               791,15 ms |
| Xóa giao dịch             |                   11.131,17 ms |               694,12 ms |
| Báo cáo khoảng một năm    |                   41.636,47 ms |               226,27 ms |
| Trang giao dịch           |                              — |               111,94 ms |
| Trang giao dịch tiếp theo |                              — |               108,18 ms |
| Tìm kiếm trong tháng      |                              — |               146,72 ms |

Phép đo gồm xử lý service và kết nối PostgreSQL từ máy phát triển, chưa gồm HTTP auth hay render/mạng điện thoại. Mốc trước chạy một lượt bằng thuật toán tham chiếu giữ riêng; mốc sau là trung vị ba lượt trên cùng fixture. Tải màn hình sau tối ưu trả 50 giao dịch cùng tổng hợp đầy đủ, thay cho toàn bộ lịch sử. Dung lượng giảm khoảng 99,55%. Không dùng Redis hoặc cache kết quả báo cáo để đạt các số này. Thời gian thực tế còn phụ thuộc mạng và môi trường database.

Bản snapshot toàn lịch sử dành cho tương thích vẫn tồn tại: sau tối ưu Map mất khoảng 3.973 ms và vẫn có payload 13,9 MB. Frontend không gọi luồng này.

Số đo chi tiết và các lượt đo: [performance-benchmark.json](performance-benchmark.json).

Benchmark CPU độc lập 20.000 giao dịch, 365 ngày, 3 tài sản: thuật toán tham chiếu khoảng 13.340 ms, bản quét sự kiện khoảng 364 ms, kết quả trùng hoàn toàn. Đây là phép đo khác, không cộng hoặc so trực tiếp với thời gian SQL ở bảng trên.

## Kiểm chứng sau lần nạp dữ liệu mới

Chạy lại benchmark với một user mới và 20.000 giao dịch vừa nạp, không chạy ANALYZE thủ công:

| Thao tác                          |        Trung vị ba lượt |
| --------------------------------- | ----------------------: |
| Tải cửa sổ màn hình               | 168,32 ms / 60.020 byte |
| Trang giao dịch                   |               108,99 ms |
| Báo cáo một năm                   |               246,84 ms |
| Thêm giao dịch                    |               812,16 ms |
| Sửa giao dịch                     |               992,77 ms |
| Xóa giao dịch                     |               716,26 ms |
| Đọc phiên bản và đối soát tài sản |               796,53 ms |

Lần kiểm chứng này phát hiện một điểm nghẽn khác: thống kê PostgreSQL chưa cập nhật cho user mới khiến planner ước lượng khoảng 2 dòng thay vì 20.000 và chọn nested loop, loại gần 200 triệu cặp khi nối. EXPLAIN ANALYZE đo riêng SQL tải màn hình mất 22.445 ms. Các lookup giao dịch trong tính số dư và phân trang hiện dùng khóa chính qua LATERAL với OFFSET 0 làm rào cản tối ưu hóa có chủ đích; lọc owner/trạng thái/thời gian vẫn nằm trong cùng statement. SQL trên một fixture mới tương đương còn 68,739 ms, ngay cả khi ước lượng số dòng vẫn sai. Không ép enable_nestloop hoặc thay cấu hình toàn database.

Kết quả này thuộc một fixture mới cùng quy mô, tách khỏi phép so sánh cùng fixture ở bảng đầu. Mọi fixture được dọn sau đo. Các số không bao gồm auth HTTP hay render điện thoại.

Kiểm tra cuối: backend pnpm check và 54/54 tests đạt, gồm Supabase thực tế; frontend TypeScript, Prettier, 21/21 tests và export Android/web đạt. ESLint frontend trong môi trường kiểm tra hiện vướng ERR_DLOPEN_FAILED của native unrs-resolver trên Windows; chưa đổi cấu hình lint để bỏ qua lỗi.

## Các điểm nghẽn đã loại bỏ

1. Trước đây mỗi mutation tải cả assets/categories/plans/transactions/transfers/adjustments/allocations. CRUD hiện chỉ đọc bản ghi cần sửa, các reference và kiểm tra tồn tại. Đối soát dùng SUM trong PostgreSQL.
2. Ghép transactions với allocations từng lần filter toàn mảng có chi phí O(T×A). Snapshot tương thích hiện lập Map theo transactionId, chi phí O(T+A).
3. Báo cáo trước đây quét lại lịch sử cho từng tài sản, từng ngày. Production hiện dùng một SQL statement tổng hợp wealth events, actual theo ngày/tháng/danh mục rồi Node quét các ngày của báo cáo.
4. List/detail trước đây tải snapshot rồi slice/find trong Node. Hiện database lọc userId/deletedAt, sắp xếp và LIMIT trước khi gửi kết quả.
5. Frontend trước đây tải toàn bộ lịch sử sau mỗi lần ghi và render danh sách dài. Hiện tải cửa sổ tháng, dùng cursor/SectionList và debounce tìm kiếm.

Bản tính thuần dùng Map để gom sự kiện và tổng theo ngày/danh mục; tái sử dụng Intl.DateTimeFormat. Cache định dạng có giới hạn; các index frontend dùng WeakMap theo snapshot/múi giờ để không giữ lịch sử cũ vô hạn.

## Hợp đồng đọc mới

### GET /api/state?month=YYYY-MM&limit=50

- assets chứa currentBalance là chuỗi số nguyên VNĐ, tính từ toàn lịch sử.
- categories đầy đủ; plans của tháng đang chọn.
- transactions chỉ là trang đầu, kèm page.nextCursor và page.hasMore.
- summary.month, income, expense, transactionCount, actualByCategory bao phủ toàn bộ tháng.
- transfers và adjustments là metadata gần đây, tối đa limit dòng.

Không lấy số dư hoặc actual bằng cách cộng trang giao dịch giới hạn. Frontend đọc currentBalance/summary từ server. Các mutation thành công tải lại một cửa sổ nhỏ và vô hiệu hóa cache tháng liên quan.

Không truyền month sẽ giữ snapshot cũ phục vụ tương thích. Không dùng endpoint toàn lịch sử này cho màn hình mobile.

### GET /api/transactions

Hỗ trợ month, kind, assetType, search, limit, cursor. page/limit vẫn được hỗ trợ cho client cũ; cursor được ưu tiên khi duyệt lịch sử dài.

Kết quả: data, page, pagination, totals và dayTotals. Tổng là của mọi bản ghi khớp bộ lọc, không chỉ trang hiện tại. Cursor giữ nguyên microsecond của PostgreSQL và sắp theo occurred_at DESC, id DESC để không trùng hoặc bỏ dòng cùng thời điểm.

Tìm kiếm chuẩn hóa tiếng Việt không dấu, escape ký tự LIKE %, _ và backslash. Điều kiện tìm kiếm đắt được materialize một lần; không dùng truy vấn động nối đầu vào người dùng.

### GET /api/adjustments?assetId=UUID&page=1&limit=30

Lịch sử từng tài sản lọc tại database. Giao diện tải khi mở editor, có trang trước/sau và giữ tối đa 30 dòng. Metadata global gần đây không được dùng để kết luận tài sản không có lịch sử.

## Database và tính đúng đắn

Migration 0004_finance_query_indexes đã áp dụng: index composite/partial cho giao dịch theo user/ngày/id/kind, allocations theo user/transaction, kế hoạch theo user/tháng, lịch sử chuyển/điều chỉnh và tên danh mục đang hoạt động. Không xóa hay thay đổi dữ liệu tài chính của người dùng.

Tất cả đọc/ghi vẫn được giới hạn theo chủ sở hữu; tiền vẫn tính bằng bigint/NUMERIC và trả chuỗi. Mutation giữ transaction, advisory lock theo người dùng và optimistic version. Sửa/xóa giao dịch cập nhật version các nguồn tiền cũ/mới.

Phân trang/tổng hợp được thực hiện trong cùng SQL statement để tránh số trang và tổng thuộc hai snapshot khác nhau. Các biên tháng dùng IANA/Intl nhất quán, gồm DST lặp nửa đêm. Alias múi giờ được canonicalize, offset cố định dùng overload interval của PostgreSQL để không bị đảo dấu POSIX.

Báo cáo giữ planned/actual cả tháng cuối khoảng, mở/đóng kỳ và growthPercent. Kiểm thử đối chiếu thuật toán tham chiếu với SQL gồm DST, offset, alias, xóa mềm, tài sản lưu trữ và số tiền vượt 2^53.

## Chạy lại

Trong MoneyMate-be:

```powershell
pnpm benchmark:statistics
```

Chạy benchmark database sẽ tạo một user riêng và 20.000 giao dịch, rồi dọn trong finally:

```powershell
$env:RUN_DB_BENCHMARK='1'
pnpm benchmark:finance
Remove-Item Env:RUN_DB_BENCHMARK
```

Backend: pnpm check, pnpm test; bật RUN_DB_TESTS=1 cho kiểm thử Supabase. Frontend: pnpm check, pnpm test và export Android/web.

Khi lịch sử lên hàng triệu bản ghi, nên đo EXPLAIN ANALYZE và cân nhắc daily rollups/batch import theo workload thực tế. Kết quả hiện tại chưa phải benchmark nhiều người dùng đồng thời; ghi cùng người dùng vẫn tuần tự hóa để giữ tính đúng của tài chính.

## Tài liệu nền tảng

- [PostgreSQL multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
- [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Drizzle Select, aggregation và pagination](https://orm.drizzle.team/docs/select)
