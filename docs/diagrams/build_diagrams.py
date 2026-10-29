from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont
import json

OUT = Path(__file__).parent
FONT = Path('C:/Windows/Fonts')
INK = '#18332F'
MUTED = '#546761'
GREEN = '#15776B'
BLUE = '#386C9D'
LINE = '#C9D8D3'

class Canvas:
    def __init__(self, width, height, title, subtitle):
        self.w, self.h = width, height
        self.im = Image.new('RGB', (width, height), 'white')
        self.draw = ImageDraw.Draw(self.im)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">', '<rect width="100%" height="100%" fill="white"/>']
        self.text(55, 35, title, 38, INK, True)
        self.text(55, 91, subtitle, 21, MUTED)

    def text(self, x, y, value, size=20, color=INK, bold=False):
        font = ImageFont.truetype(str(FONT / ('arialbd.ttf' if bold else 'arial.ttf')), size)
        self.draw.text((x, y), value, font=font, fill=color)
        self.svg.append(f'<text x="{x}" y="{y+size}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(value)}</text>')

    def rect(self, x, y, w, h, fill='white', stroke=LINE, radius=13):
        self.draw.rounded_rectangle((x,y,x+w,y+h), radius, fill, stroke, 2)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')

    def line(self, points, color=GREEN, arrow=False, dashed=False):
        self.draw.line(points, fill=color, width=3)
        coords = ' '.join(f'{x},{y}' for x,y in points)
        dash = ' stroke-dasharray="8 7"' if dashed else ''
        self.svg.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="3"{dash}/>')
        if arrow:
            x,y = points[-1]; px,py = points[-2]
            if x == px:
                d = 1 if y>py else -1
                triangle = [(x,y),(x-7,y-12*d),(x+7,y-12*d)]
            else:
                d = 1 if x>px else -1
                triangle = [(x,y),(x-12*d,y-7),(x-12*d,y+7)]
            self.draw.polygon(triangle, fill=color)
            self.svg.append('<polygon points="'+' '.join(f'{a},{b}' for a,b in triangle)+f'" fill="{color}"/>')

    def relation(self, points, label, lx, ly):
        self.line(points, BLUE)
        self.text(lx, ly, label, 18, BLUE, True)

    def table(self, x,y,name,description,rows,w=630):
        h=95+len(rows)*31+16
        self.rect(x,y,w,h)
        self.rect(x,y,w,82, '#EAF4F1', '#B7D4CA')
        self.text(x+18,y+12,name,24,INK,True)
        self.text(x+18,y+47,description,18,MUTED)
        for i,(field,kind) in enumerate(rows):
            color=BLUE if kind.startswith('FK') else GREEN if kind.startswith('PK') else INK
            self.text(x+18,y+96+i*31,field,19,color,kind.startswith('PK'))
            self.text(x+w-153,y+96+i*31,kind,17,color)
        return h

    def note(self,x,y,w,title,lines):
        self.rect(x,y,w,61+len(lines)*29,'#F7FAF9')
        self.text(x+18,y+14,title,22,INK,True)
        for i,line in enumerate(lines): self.text(x+18,y+53+i*29,line,19,MUTED)

    def box(self,x,y,w,h,title,lines,fill='#F4F8F6'):
        self.rect(x,y,w,h,fill)
        self.text(x+20,y+15,title,23,INK,True)
        for i,line in enumerate(lines): self.text(x+20,y+56+i*28,line,19,MUTED)

    def save(self,name):
        self.svg.append('</svg>')
        (OUT/(name+'.svg')).write_text('\n'.join(self.svg),encoding='utf-8')
        self.im.save(OUT/(name+'.png'))

AUDIT=[('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL'),('version · integer = 1','NOT NULL'),('deleted_at · timestamptz','NULL')]
USER=[('id · uuid','PK'),('email · varchar(254)','UQ / NN'),('display_name · varchar(100)','NOT NULL'),('email_verified · boolean','NOT NULL'),('image · text','NULL'),('password_hash · text [legacy]','NULL'),('timezone · text','NOT NULL'),('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL')]
OWNER=('user_id · uuid → users.id','FK / NN')

# ERD 1: all financial tables; owner references are written in each row rather
# than drawing six crossing user edges through the detailed column lists.
c=Canvas(2260,2440,'MoneyMate · ERD tài chính','01 / 03   •   Theo Drizzle models hiện tại   •   Tên cột là tên vật lý trong PostgreSQL   •   Nền trắng')
c.relation([(685,240),(800,240)],'1 → 0..N',697,210)
c.relation([(1430,250),(1545,250)],'1 → 0..N',1440,220)
c.relation([(200,540),(200,790)],'1 → 0..N',215,680)
c.relation([(1100,643),(1100,790)],'1 → 0..N',1115,730)
c.relation([(1430,980),(1545,980)],'1 → 0..N',1440,950)
c.relation([(685,1110),(737,1110),(737,1410),(1850,1410),(1850,1118)],'asset 1 → 0..N allocations',1050,1370)
c.relation([(200,1273),(200,1570)],'1 → 0..N',215,1480)
c.relation([(685,1190),(710,1190),(710,1690),(800,1690)],'1 → 0..N (nguồn)',715,1510)
c.relation([(685,1240),(755,1240),(755,1760),(800,1760)],'1 → 0..N (đích)',775,1535)
c.table(55,160,'users','Người dùng · bảng gốc của quyền sở hữu',USER)
c.table(800,160,'categories','Danh mục thu nhập hoặc chi tiêu',[
('id · uuid','PK'),OWNER,('name · varchar(100)','NOT NULL'),('kind · income | expense','UQ* / NN'),('icon · varchar(50)','NULL'),('color · varchar(7)','NULL'),('sort_order · integer = 0','NOT NULL'),('is_archived · boolean = false','NOT NULL'),*AUDIT])
c.table(1545,160,'monthly_category_plans','Planned theo danh mục, mỗi tháng',[
('id · uuid','PK'),OWNER,('category_id · uuid','FK* / NN'),('kind · income | expense','FK* / NN'),('month · date (ngày 01)','NOT NULL'),('planned_amount · bigint ≥ 0','NOT NULL'),('note · text','NULL'),*AUDIT])
c.table(55,790,'asset_accounts','Tiền mặt / ngân hàng / tài sản khác',[
('id · uuid','PK'),OWNER,('name · varchar(100)','NOT NULL'),('type · cash | bank | other','NOT NULL'),('opening_value · bigint ≥ 0','NOT NULL'),('opening_at · timestamptz','NOT NULL'),('note · text','NULL'),('is_archived · boolean = false','NOT NULL'),*AUDIT])
c.table(800,790,'transactions','Giao dịch thực tế · Actual',[
('id · uuid','PK'),OWNER,('category_id · uuid','FK* / NN'),('kind · income | expense','FK* / NN'),('amount · bigint > 0','NOT NULL'),('title · varchar(200)','NOT NULL'),('note · text','NULL'),('occurred_at · timestamptz','NOT NULL'),*AUDIT])
c.table(1545,790,'transaction_allocations','Phân bổ giao dịch vào từng nguồn tiền',[
('id · uuid','PK'),OWNER,('transaction_id · uuid','FK* / NN'),('asset_account_id · uuid','FK* / NN'),('amount · bigint > 0','NOT NULL'),('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL')])
c.table(55,1570,'asset_adjustments','Điều chỉnh / đối soát số dư',[
('id · uuid','PK'),OWNER,('asset_account_id · uuid','FK* / NN'),('delta_amount · bigint ≠ 0','NOT NULL'),('reason · valuation | reconciliation','NOT NULL'),('note · text','NOT NULL'),('occurred_at · timestamptz','NOT NULL'),*AUDIT])
c.table(800,1570,'transfers','Chuyển nội bộ · không tính vào thu/chi',[
('id · uuid','PK'),OWNER,('from_asset_account_id · uuid','FK* / NN'),('to_asset_account_id · uuid','FK* / NN'),('amount · bigint > 0','NOT NULL'),('occurred_at · timestamptz','NOT NULL'),('note · text','NULL'),*AUDIT])
c.note(1545,1470,630,'Đọc ký hiệu và quan hệ',[
'PK: khóa chính. FK: khóa ngoại. UQ: duy nhất.',
'NN / NOT NULL: bắt buộc. NULL: có thể trống.',
'1 → 0..N: một bản ghi có thể có nhiều con.',
'Mỗi bản ghi con tham chiếu đúng một cha.',
'Mọi user_id đều có FK trực tiếp → users.id.',
'Các đường chủ sở hữu được rút gọn bằng nhãn.',
'FK*: thuộc khóa ngoại ghép; xem danh sách dưới.',
'UQ*: categories(user_id, id, kind) là duy nhất.',
'DB cho phép transaction chưa có allocation;',
'service bắt buộc ≥ 1 và tổng bằng amount.',
])
c.note(1545,1860,630,'Ràng buộc và số liệu tính toán',[
'UQ plan hoạt động: user + category + month.',
'UQ allocation: transaction + asset.',
'Nguồn và đích transfer phải khác nhau.',
'Tiền là bigint VNĐ; JSON truyền dạng chuỗi.',
'Actual = tổng transaction theo danh mục/tháng.',
'Số dư = mở đầu ± giao dịch ± chuyển + chỉnh.',
'Actual và currentBalance không phải cột lưu.',
])
c.text(55,2160,'Khóa ngoại ghép vật lý · ON DELETE RESTRICT cho toàn bộ quan hệ tài chính',25,INK,True)
for i,line in enumerate([
'transactions / monthly_category_plans: (user_id, category_id, kind) → categories(user_id, id, kind).',
'transaction_allocations: (user_id, transaction_id) → transactions(user_id, id); (user_id, asset_account_id) → asset_accounts(user_id, id).',
'asset_adjustments: (user_id, asset_account_id) → asset_accounts(user_id, id).',
'transfers: (user_id, from_asset_account_id) và (user_id, to_asset_account_id) → asset_accounts(user_id, id).',
'created_at / updated_at / version / deleted_at: audit, chống ghi đè và xóa mềm; allocations chỉ có created_at / updated_at.',
'Planned − Actual: với chi tiêu là ngân sách còn lại; với thu nhập là khoản còn cần đạt. Không có bảng riêng cho Actual.',
]): c.text(55,2206+i*32,line,21,MUTED)
c.save('01-erd-finance')

c=Canvas(2220,1590,'MoneyMate · ERD xác thực','02 / 03   •   Better Auth dùng PostgreSQL qua Drizzle adapter   •   Cùng bảng users với ERD tài chính')
c.relation([(660,265),(790,265)],'1 → 0..N',675,235)
c.relation([(660,330),(725,330),(725,710),(1510,710),(1510,345),(1535,345)],'1 → 0..N',1100,679)
c.relation([(300,550),(300,840)],'1 → 0..N · legacy',315,740)
c.table(40,160,'users','Tài khoản ứng dụng · không phải auth.users',USER,620)
c.table(790,160,'auth_sessions','Phiên đăng nhập hiện tại do Better Auth quản lý',[
('id · uuid','PK'),OWNER,('token · text','UQ / NN'),('expires_at · timestamptz','NOT NULL'),('ip_address · text','NULL'),('user_agent · text','NULL'),('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL')],620)
c.table(1535,160,'auth_accounts','Thông tin provider và mật khẩu đã hash',[
('id · uuid','PK'),OWNER,('account_id · text','NOT NULL'),('provider_id · text','NOT NULL'),('password · text (hash)','NULL'),('access_token · text','NULL'),('refresh_token · text','NULL'),('id_token · text','NULL'),('access_token_expires_at · timestamptz','NULL'),('refresh_token_expires_at · timestamptz','NULL'),('scope · text','NULL'),('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL')],620)
c.table(40,840,'sessions','Bảng phiên cũ · không dùng cho đăng nhập mới',[
('id · uuid','PK'),OWNER,('token_hash · text','UQ / NN'),('expires_at · timestamptz','NOT NULL'),('created_at · timestamptz','NOT NULL')],620)
c.table(790,840,'auth_verifications','Token xác minh · không có FK trực tiếp tới users',[
('id · uuid','PK'),('identifier · text','NOT NULL'),('value · text','NOT NULL'),('expires_at · timestamptz','NOT NULL'),('created_at · timestamptz','NOT NULL'),('updated_at · timestamptz','NOT NULL')],620)
c.note(1535,840,620,'Chú thích xác thực',[
'FK user_id → users.id: ON DELETE CASCADE.',
'UQ auth_accounts: (provider_id, account_id).',
'password lưu hash, không lưu mật khẩu rõ.',
'Token/provider có thể NULL tùy cách đăng nhập.',
'auth_verifications liên kết bằng identifier;',
'không tự suy diễn identifier là khóa ngoại.',
'users.password_hash là cột legacy còn giữ lại.',
'Phiên hoạt động dùng auth_sessions.',
'Supabase cung cấp PostgreSQL; xác thực app',
'hiện dùng Better Auth, không Supabase Auth.',
])
c.note(40,1300,1370,'Phạm vi sơ đồ',[
'12 bảng ứng dụng được định nghĩa trong src/models; không liệt kê bảng nội bộ Supabase / lịch sử migration.',
'Đây là tài liệu theo mã nguồn hiện tại, không phải ảnh chụp catalog database đang chạy.',
'Các bảng bật RLS trong model; API truy cập qua backend và luôn kiểm tra user_id / quyền sở hữu.',
'Không có giá trị token, mật khẩu, chuỗi kết nối hay dữ liệu người dùng trong tài liệu này.',
])
c.save('02-erd-auth')

c=Canvas(2220,2370,'MoneyMate · System flow','03 / 03   •   Luồng đang triển khai: giao diện → API → nghiệp vụ → PostgreSQL → giao diện')
for x,w,title,desc in [(40,640,'FRONTEND · MoneyMate-fe','Expo / React Native / TypeScript'),(780,670,'BACKEND · MoneyMate-be','Node.js / Express / Better Auth / Drizzle'),(1550,630,'DATABASE · Supabase','PostgreSQL · dữ liệu thật')]:
    c.rect(x,155,w,70,'#EAF4F1')
    c.text(x+18,165,title,25,INK,True);c.text(x+18,200,desc,18,MUTED)
c.box(40,260,640,145,'1. App, route và providers',[
'AppProviders → AuthProvider → Stack / Tabs',
'FinanceProvider cấp state và thao tác tài chính.',
'app → routes → screens → components.',
])
c.box(40,455,640,160,'2. Người dùng thao tác trên màn hình',[
'Form giao dịch, tài sản, danh mục, kế hoạch…',
'Hook quản lý state; Zod kiểm tra dữ liệu đầu vào.',
'UI có phân cách tiền; state giữ số nguyên VNĐ.',
])
c.box(40,665,640,145,'3. Service gọi HTTP API',[
'finance-actions → finance.service → api.service',
'POST /api/transactions + category + allocations',
'JSON tiền dạng chuỗi; gửi cookie xác thực.',
])
c.line([(360,405),(360,455)],arrow=True)
c.line([(360,615),(360,665)],arrow=True)
c.line([(680,735),(780,735)],arrow=True)
c.text(692,695,'HTTP',18,BLUE,True)
c.box(780,665,670,145,'4. Express và middlewares',[
'Helmet → CORS → parser JSON (API nghiệp vụ).',
'browserOrigin kiểm tra nguồn ghi; requireAuth',
'xác nhận phiên Better Auth và lấy user hiện tại.',
])
c.box(780,865,670,145,'5. Route → controller',[
'Route chọn endpoint của từng đối tượng.',
'Controller đọc params / body / user đã xác thực.',
'Chuyển yêu cầu sang service; trả status + JSON.',
])
c.box(780,1065,670,175,'6. Service · logic nghiệp vụ',[
'Zod kiểm tra lại input; kiểm tra owner, phiên bản,',
'nguồn tiền, danh mục, thời điểm và tổng phân bổ.',
'Ghi tài chính trong transaction + khóa theo user.',
'Lỗi bất kỳ → rollback, không lưu một phần.',
])
c.box(780,1295,670,145,'7. Repository → Drizzle models',[
'Repository đọc / ghi trực tiếp database.',
'Models định nghĩa bảng, cột, PK / FK và index.',
'SQL có user_id, lọc xóa mềm, truy vấn có giới hạn.',
])
for a,b in [(810,865),(1010,1065),(1240,1295)]:c.line([(1115,a),(1115,b)],arrow=True)
c.box(1550,1295,630,230,'8. PostgreSQL thực thi',[
'BEGIN + advisory lock theo user khi ghi tài chính.',
'Kiểm tra NOT NULL / CHECK / UNIQUE / FK.',
'INSERT transaction + allocations;',
'cập nhật phiên bản tài sản liên quan.',
'COMMIT khi thành công; ROLLBACK nếu lỗi.',
])
c.line([(1450,1365),(1550,1365)],arrow=True)
c.box(1550,1590,630,175,'9. Đọc dữ liệu · yêu cầu HTTP riêng',[
'GET /state?month=…&limit=50',
'GET /transactions: phân trang bằng cursor.',
'GET /statistics: SUM / GROUP BY trên SQL.',
'Số dư và actual lấy từ tổng đầy đủ, không cộng page.',
])
c.line([(1730,1525),(1730,1555),(1115,1555),(1115,1590)],arrow=True)
c.box(780,1590,670,175,'10. Response / lỗi thống nhất',[
'Controller serialize bigint thành chuỗi JSON.',
'200 đọc/sửa; 201 tạo; 204 xóa.',
'error.middleware: 401 / 403 / 409 / 422 / 500.',
'Không gửi thông tin kết nối database ra client.',
])
c.line([(1550,1675),(1450,1675)],arrow=True)
c.box(40,1590,640,175,'11. Frontend cập nhật giao diện',[
'Thành công: tải lại state, tăng revision, làm mới',
'danh sách / cache tháng và hiển thị thông báo.',
'Lỗi: giữ dữ liệu nhập để sửa; 409 tải lại dữ liệu.',
'401 xóa trạng thái đăng nhập và về màn hình auth.',
])
c.line([(780,1675),(680,1675)],arrow=True)
c.line([(360,1765),(360,1800),(1865,1800),(1865,1765)],BLUE,True,True)
c.text(600,1770,'Sau khi lưu: FE gọi GET /state qua cùng middleware → controller → read service → repository',18,BLUE)

# Authentication is a parallel route, not part of the financial service chain.
c.box(780,270,670,170,'Luồng riêng · đăng ký / đăng nhập',[
'FE authClient → /api/auth/* → Better Auth',
'Auth handler được gắn trước express.json().',
'Validations riêng cho register / login.',
'Đăng ký thành công: tạo danh mục mặc định.',
], '#EEF3FA')
c.box(1550,270,630,170,'Drizzle adapter cho Better Auth',[
'users / auth_accounts / auth_sessions',
'auth_verifications (khi có nghiệp vụ xác minh).',
'Web: cookie HttpOnly; native: Expo plugin',
'lưu cookie bằng SecureStore trên thiết bị.',
], '#EEF3FA')
c.line([(680,330),(780,330)],BLUE,True)
c.line([(1450,350),(1550,350)],BLUE,True)
c.line([(1865,440),(1865,520),(1115,520),(1115,665)],BLUE,True,True)
c.text(1170,540,'Cookie dùng lại cho các API đã bảo vệ',18,BLUE)
c.note(40,1840,2140,'Ví dụ cụ thể · tạo chi tiêu 150.000 VNĐ',[
'Người dùng chọn Ăn uống + tiền mặt → frontend validate → POST /api/transactions với amount="150000" và allocation="150000".',
'Backend kiểm tra danh mục cùng user và cùng loại expense; nguồn tiền còn hoạt động; ngày hợp lệ; tổng allocation bằng amount.',
'Trong một transaction: ghi transactions + transaction_allocations, cập nhật version tài sản → commit → trả 201.',
'Frontend gọi lại dữ liệu: số dư tiền mặt giảm 150.000; Actual Ăn uống tháng tăng 150.000; Planned giữ nguyên; chênh lệch tính lại.',
])
c.note(40,2070,2140,'Các thành phần hỗ trợ và giới hạn của luồng',[
'types: interface TypeScript. schemas: validate / chuẩn hóa runtime. constants: enum / thông báo. helpers / utils: hàm tái sử dụng.',
'GET dữ liệu dùng read/statistics service và truy vấn tổng hợp; không cần đi qua transaction ghi hoặc tải toàn bộ lịch sử.',
'Swagger /api/docs mô tả và thử API; /api/health và /api/ready phục vụ kiểm tra hoạt động, không đi qua luồng tài chính.',
'Sơ đồ thể hiện kiến trúc trong mã nguồn; kết nối điện thoại phụ thuộc API_URL, mạng và cấu hình origin thực tế.',
])
c.save('03-system-flow')

html='''<!doctype html><html lang="vi"><meta charset="utf-8"><title>MoneyMate · Database & system flow</title><style>
body{margin:0;background:#fff;color:#18332f;font:16px Arial,sans-serif}header{padding:28px 36px;border-bottom:1px solid #cad9d2}h1{margin:0 0 12px}p{line-height:1.6;max-width:1100px}nav a{display:inline-block;margin:8px 18px 8px 0;color:#15776b}section{padding:24px 30px;border-bottom:1px solid #cad9d2}img{display:block;width:100%;height:auto}a{color:#15776b}@media print{header,section{break-after:page}section{padding:0}}
</style><header><h1>MoneyMate · ERD và System flow</h1><p>Theo mã nguồn ngày 28/10/2026. Có 12 bảng ứng dụng. ERD tách tài chính và xác thực để đọc rõ từng thuộc tính; bảng users xuất hiện ở cả hai hình. Đây là tài liệu theo models, không phải xác minh catalog database trực tiếp.</p><nav>'''
for name,label in [('01-erd-finance','ERD tài chính'),('02-erd-auth','ERD xác thực'),('03-system-flow','System flow')]:html+=f'<a href="#{name}">{label}</a>'
html+='</nav></header>'
for name,label in [('01-erd-finance','ERD tài chính'),('02-erd-auth','ERD xác thực'),('03-system-flow','System flow')]:
    html+=f'<section id="{name}"><h2>{label}</h2><p><a href="{name}.svg">Mở SVG để phóng to</a> · <a href="{name}.png" download>Tải PNG</a></p><img src="{name}.svg" alt="{label}"></section>'
(OUT/'index.html').write_text(html,encoding='utf-8')
print(json.dumps({'output':str(OUT),'images':3,'formats':['SVG','PNG','HTML']},ensure_ascii=False))
