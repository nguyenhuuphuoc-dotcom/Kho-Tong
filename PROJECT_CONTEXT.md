# PROJECT_CONTEXT.md — Hệ thống Quản lý Kho HPCons (KhoUNICE Web)

> File tóm tắt bối cảnh dự án để AI/dev mới nắm nhanh. Cập nhật lần cuối: 04/07/2026.

## 1. Tổng quan

Web app quản lý kho công trình cho **HP Cons** (người dùng chính: anh Phước — nguyenhuuphuoc@hpcons.com.vn, xưng hô "Sếp", giao tiếp tiếng Việt).

Kiến trúc đã chốt: **1 web app duy nhất trên cloud**, phân quyền theo công trình, KHÔNG làm đồng bộ offline (các kho đều có internet ổn định). Gồm 2 khu vực:

- **App Tổng** (`/`): dashboard báo cáo tổng hợp, quản lý phiếu nhập/xuất, tồn kho, danh mục hàng, công trình, người dùng, phân quyền, nhật ký. Admin dùng.
- **Trang công trình** (`/ct/:id`): nhập kho, xuất kho, tồn kho, danh mục — nhân viên thủ kho dùng, khóa theo công trình được phân quyền.

Chỉ 2 vai trò: **admin** (toàn quyền, xem tất cả/lọc theo CT) và **user = NV thủ kho** (chỉ thấy CT của mình qua bảng `user_congtrinh`).

Quy mô: nhỏ (<10 công trình, <30 user).

## 2. Tech stack

| Phần | Công nghệ |
|---|---|
| Backend | Python FastAPI (`backend/`), gọi Supabase qua REST (urllib thuần, `supabase_client.py`) |
| Database | Supabase PostgreSQL cloud (URL trong `backend/.env`) — bảng: `cong_trinh`, `phieu`, `chi_tiet_phieu`, `hang_hoa`, `app_users`, `user_congtrinh`, `activity_log`, view `v_ton_kho` |
| Frontend | React + Vite + Tailwind (`frontend/`), axios, react-router, chart.js, lucide-react |
| Auth | JWT tự chế (HMAC-SHA256, `routers/auth.py`), password PBKDF2. `JWT_SECRET`, `SETUP_KEY` trong `.env` |
| AI đọc hóa đơn | Claude API (`ai_reader.py`, `routers/ai_routes.py`), key `CLAUDE_API_KEY` trong `.env` |
| Chạy local | `CHAY_WEB_APP.bat` — tự pip/npm install, build frontend, chạy uvicorn port 8000 (serve cả dist) |
| Deploy | `render.yaml` có sẵn cho Render.com; GitHub remote: `nguyenhuuphuoc-dotcom/Kho-Tong` |

## 3. Điểm kiến trúc quan trọng

- **Tồn kho KHÔNG phải bảng riêng** — là view `v_ton_kho` tính từ phiếu (tổng nhập − tổng xuất theo `ten_hang` + `cong_trinh_id`). Muốn sửa tồn phải tạo phiếu.
- Mọi dữ liệu gắn `cong_trinh_id`. Sidebar chọn CT → context `CongTrinhContext` (`selectedCT`, `ctLoading` chống race condition) → mọi trang truyền `cong_trinh_id` vào API.
- Phiếu: `loai` = `'NK'` / `'XK'`. Các giá trị logic KHÔNG được đổi khi sửa text: `'NK'`, `'XK'`, `'admin'`, `'user'`, `'manual'`, `'ai'`, modal type `'them'/'sua'/'xoa'`.

## 4. Đã làm trong phiên 04/07/2026

1. **Chẩn đoán 3 lỗi Sếp báo**: (a) lọc công trình ở Báo cáo tổng hợp không ăn, (b) không có autocomplete tên hàng khi nhập tay, (c) tồn kho không thêm/sửa/xóa được.
   - Nguyên nhân (a)+(b): user chạy `frontend/dist` build từ 02/07, trong khi code sửa đã commit 03–04/07. **Chỉ cần build lại là hết** (bat tự build).
2. **Viết mới CRUD tồn kho** (lỗi c):
   - Backend `routers/ton_kho.py`: thêm `POST /api/ton-kho/them-hang` (tạo phiếu NK `TD-...`), `POST /api/ton-kho/dieu-chinh` (phiếu `DC-...`, NK nếu tăng/XK nếu giảm, giữ lịch sử), `DELETE /api/ton-kho/xoa-hang` (xóa mọi chi tiết phiếu của hàng đó trong CT — dùng khi tạo nhầm tên).
   - `supabase_client.py`: thêm `get_phieu_ids_by_ct()`, `delete_chi_tiet_by_hang()` (chunk 100 id, URL-encode tên hàng).
   - Frontend: `api/index.js` (+3 hàm), `pages/TonKho.jsx` và `pages/ct/CTTonKho.jsx` viết lại — nút "Thêm hàng" (datalist gợi ý từ danh mục), icon bút chì (điều chỉnh tồn), icon thùng rác (xóa có cảnh báo), ghi `user_email` vào nhật ký.
   - **Đã verify**: build vite full pass, python syntax pass.
3. **Đang dở — thêm dấu tiếng Việt cho toàn bộ UI** (chữ gốc viết không dấu):
   - ĐÃ XONG HOÀN TOÀN: `Sidebar.jsx`, `Header.jsx`, `Login.jsx`, `TonKho.jsx`, `pages/ct/CTLayout.jsx`, `pages/ct/CTDashboard.jsx`, `pages/ct/CTTonKho.jsx` (viết lại nguyên file), `pages/ct/CTNhapKho.jsx` (~26 edit, gồm cả đổi dvt mặc định 'cai' → 'cái').
   - ĐÃ XONG MỘT PHẦN: `Dashboard.jsx`, `exportExcel.js`, `CTAIReader.jsx` — cần rà lại các chuỗi còn sót.
   - CÒN LẠI CHƯA LÀM: `pages/ct/CTXuatKho.jsx` (đã đọc xong, cấu trúc giống hệt CTNhapKho — sửa các chuỗi: PHIEU XUAT KHO, phieu xuat, Tao phieu XK, Tim so phieu nguoi nhan, So phieu/Ngay/Nguoi nhan/Tong tien, Dang tai, Chua co phieu xuat kho, Tong (x phieu), Ten hang/DVT/Don gia/Thanh tien, dong, Tao Phieu Xuat Kho Moi, Nguoi nhan / Doi tac, Ten nguoi nhan, Ghi chu, Ten hang hoa, So luong, Them dong, Huy, Dang luu, Luu Phieu XK, ' ty'→' tỷ', dvt 'cai'→'cái' 3 chỗ, lỗi 'Vui long nhap so phieu va ngay', 'Can it nhat 1 dong hang hop le', 'Luu phieu xuat thanh cong!', 'Loi khi luu phieu'), `CTDanhMuc.jsx`, `CTImportData.jsx`, `BaoCao.jsx`, `AIReader.jsx`, `CongTrinh.jsx`, `ImportData.jsx`, `DanhMuc.jsx`, `CanhBao.jsx`, `NhatKy.jsx`, `PhanQuyen.jsx`, `NguoiDung.jsx`, `PhieuNhap.jsx`, `PhieuXuat.jsx`, `NhaCungCap.jsx`, `CaiDat.jsx`, `App.jsx`.
   - Chú ý khi sửa: giữ nguyên ' ty' → đổi ' tỷ' trong formatVND; ĐƯỢC đổi dvt mặc định `'cai'` → `'cái'` (là chữ hiển thị/lưu phiếu); KHÔNG đổi key logic ('NK','XK','them','sua','xoa','manual','ai','admin','user', key màu, route, className).
   - Quy tắc: CHỈ sửa chuỗi hiển thị (JSX text, placeholder, title, label, thông báo lỗi, label biểu đồ, cột Excel). KHÔNG đổi tên biến/key/className/route/API/giá trị logic (mục 3). Escape nháy đúng, UTF-8.

## 5. Việc tiếp theo (thứ tự)

1. Hoàn tất thêm dấu tiếng Việt cho các file còn lại (mục 4.3) — bắt đầu từ `CTXuatKho.jsx` (danh sách chuỗi cần sửa đã liệt kê sẵn ở mục 4.3).
2. Build kiểm tra lại toàn bộ frontend.
3. Đẩy code lên GitHub `nguyenhuuphuoc-dotcom/Kho-Tong` — **lưu ý:** git trong sandbox không thấy thay đổi (xem mục 6), nên tạo file bat cho Sếp chạy trên máy: `git add -A && git commit -m "..." && git push`.
4. Deploy Render.com: New Web Service → connect repo → tự đọc `render.yaml` → điền env vars `SUPABASE_URL`, `SUPABASE_KEY`, `CLAUDE_API_KEY` (lấy từ `backend/.env`; `JWT_SECRET` tự sinh, `SETUP_KEY` tự đặt). Có thể dùng Claude in Chrome điều khiển trình duyệt, Sếp tự đăng nhập. Gói free: app ngủ sau ~15 phút idle.
5. Test link web thật cùng Sếp.

## 6. Lưu ý kỹ thuật cho AI session sau (Cowork)

- **Mount sandbox KHÔNG tin được với file vừa sửa**: file sửa qua Write/Edit hiển thị bị CẮT CỤT trong `/sessions/.../mnt/KhoUNICE_Web`. File gốc trên máy (đọc qua tool Read) luôn đúng. Muốn build/kiểm tra: Read nội dung thật → heredoc vào `/tmp` trong sandbox → build ở đó. File MỚI tạo thì sync bình thường theo cả 2 chiều.
- Sandbox bị chặn kết nối Supabase (403) → không test API với DB thật được, chỉ kiểm tra cú pháp + build.
- `/tmp/fe` trong sandbox đã có sẵn frontend + node_modules cài xong (npm install ~5s nếu mất).
- Xóa file trên máy Sếp: rm bị chặn, phải gọi tool `allow_cowork_file_delete` trước.
- Session limit từng bị chạm khi spawn 6 subagent song song — cân nhắc làm trực tiếp hoặc ít agent hơn.
- `.gitignore` đã chặn `backend/.env` (chứa secrets) — không commit.

## 7. Lịch sử trước phiên này

App do Sếp tự build trước (~9.000 dòng, có sẵn AI reader, import Excel, phân quyền...). Các commit 03/07 đã sửa: race condition ctLoading, filter hàng hóa theo CT, autocomplete tên hàng NK/XK, phân trang >1000 rows PostgREST, sessionStorage thay localStorage. Mockup giao diện demo đã được Sếp duyệt trong chat (2 vai trò, menu trái bấm được).
