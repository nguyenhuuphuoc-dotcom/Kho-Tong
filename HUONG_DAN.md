# KhoUNICE Web App v2.0.0
## Hướng dẫn cài đặt và chạy

---

## Yêu cầu hệ thống

| Phần mềm | Phiên bản | Tải về |
|----------|-----------|--------|
| Python | 3.10 trở lên | https://python.org |
| Node.js | 18 trở lên | https://nodejs.org |
| Git (tùy chọn) | bất kỳ | https://git-scm.com |

---

## Cách chạy nhanh (Windows)

**Bước 1:** Mở thư mục `KhoUNICE_Web`

**Bước 2:** Double-click file `CHAY_WEB_APP.bat`

**Bước 3:** Điền Claude API Key khi được hỏi (chỉ cần lần đầu)

**Bước 4:** Trình duyệt tự mở tại `http://localhost:8000`

---

## Cài đặt thủ công

### 1. Cấu hình backend

Mở file `backend\.env`, điền API key:
```
SUPABASE_URL=https://avybsbcsuausongzqwtd.supabase.co
SUPABASE_KEY=... (đã điền sẵn)
CLAUDE_API_KEY=sk-ant-...      ← điền Claude API key
GEMINI_API_KEY=                ← để trống nếu không dùng
```

### 2. Cài thư viện Python

```bash
cd backend
pip install -r requirements.txt
```

### 3. Build frontend

```bash
cd frontend
npm install
npm run build
```

### 4. Chạy server

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Mở trình duyệt: **http://localhost:8000**

---

## Cấu trúc thư mục

```
KhoUNICE_Web/
├── backend/
│   ├── main.py              ← FastAPI app chính
│   ├── config.py            ← Load cấu hình từ .env
│   ├── supabase_client.py   ← Kết nối Supabase
│   ├── ai_reader.py         ← Đọc phiếu bằng AI
│   ├── pdf_splitter.py      ← Tách PDF theo phiếu
│   ├── routers/
│   │   ├── cong_trinh.py    ← API /api/cong-trinh
│   │   ├── phieu.py         ← API /api/phieu
│   │   ├── hang_hoa.py      ← API /api/hang-hoa
│   │   ├── ton_kho.py       ← API /api/ton-kho
│   │   ├── bao_cao.py       ← API /api/bao-cao
│   │   ├── ai_routes.py     ← API /api/ai
│   │   └── files.py         ← API /api/files
│   ├── .env                 ← Cấu hình (tạo từ .env.example)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           ← Tất cả 11 trang
│   │   ├── components/      ← Sidebar, Header, UI components
│   │   └── api/index.js     ← Tất cả API calls
│   ├── dist/                ← Build output (sau npm run build)
│   └── package.json
├── CHAY_WEB_APP.bat         ← Script chạy tự động (Windows)
└── HUONG_DAN.md             ← File này
```

---

## Tính năng

### App Tổng (Dashboard)
- Báo cáo tổng hợp: KPI cards, biểu đồ nhập-xuất-tồn, tỷ lệ nhập xuất
- Danh sách phiếu nhập kho / xuất kho có lọc theo công trình
- Tồn kho tổng hợp: tìm kiếm, lọc, xem lịch sử từng mặt hàng
- Báo cáo tháng: xuất Excel
- Danh mục hàng hóa (CRUD)
- Trạng thái đồng bộ app con

### App Unice (Nhập/Xuất kho)
- **Nhập tay**: form nhập phiếu NK/XK với autocomplete tên hàng
- **AI nhận diện**: upload ảnh/PDF → Claude/Gemini đọc tự động → xác nhận → lưu
- **Tách PDF**: tự động tách file nhiều phiếu → download ZIP
- Cài đặt: API key, AI model, chế độ đọc ngày

---

## Deploy lên cloud (Railway)

1. Tạo tài khoản tại https://railway.app

2. Tạo project mới, kết nối GitHub repo

3. Thêm environment variables:
   ```
   SUPABASE_URL=...
   SUPABASE_KEY=...
   CLAUDE_API_KEY=...
   ```

4. Railway tự động deploy — app chạy tại URL dạng `https://khounice-xxx.railway.app`

---

## API Documentation

Sau khi chạy server, truy cập:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

---

## Lưu ý

- Lần đầu `npm install` có thể mất 2-3 phút
- Nếu port 8000 bận, sửa trong `CHAY_WEB_APP.bat` và `vite.config.js`
- File PDF sau khi tách sẽ được download tự động về máy
- Dữ liệu đồng bộ thực từ Supabase khi có kết nối internet

---

*KhoUNICE Web v2.0.0 — HP Cons Việt Nam © 2026*
