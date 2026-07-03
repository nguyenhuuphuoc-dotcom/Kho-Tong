"""
supabase_client.py — Kết nối Supabase cho KhoUNICE Web Backend
Dùng urllib thuần (không cần thư viện ngoài) để gọi Supabase REST API
Load config từ environment variable thay vì file txt
"""
import json, urllib.request, urllib.error, os
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

# ── Load config từ environment variable ─────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Thiếu SUPABASE_URL hoặc SUPABASE_KEY trong environment")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _request(method: str, path: str, data=None, params: str = "") -> list | dict:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += f"?{params}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read()
            return json.loads(raw) if raw else []
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f"Supabase {method} {path}: {e.code} — {err}")


# ── CRUD helpers ──────────────────────────────────────────────

def select(table: str, query: str = "*", filters: str = "", order: str = "") -> list:
    params = f"select={query}"
    if filters: params += f"&{filters}"
    if order:   params += f"&order={order}"
    return _request("GET", table, params=params)


def insert(table: str, data: dict | list) -> list:
    return _request("POST", table, data=data)


def update(table: str, data: dict, filters: str) -> list:
    return _request("PATCH", table, data=data, params=filters)


def delete(table: str, filters: str) -> list:
    return _request("DELETE", table, params=filters)


def rpc(func: str, params: dict = None) -> Any:
    """Gọi Postgres function / stored procedure"""
    return _request("POST", f"rpc/{func}", data=params or {})


# ── Công trình ────────────────────────────────────────────────

def get_all_cong_trinh() -> list:
    return select("cong_trinh", order="ten_ct.asc")


def get_cong_trinh_by_ma(ma_ct: str) -> Optional[dict]:
    rows = select("cong_trinh", filters=f"ma_ct=eq.{ma_ct}")
    return rows[0] if rows else None


def get_cong_trinh_by_id(id: int) -> Optional[dict]:
    rows = select("cong_trinh", filters=f"id=eq.{id}")
    return rows[0] if rows else None


def upsert_cong_trinh(ma_ct: str, ten_ct: str, dia_chi: str = "", ghi_chu: str = "") -> dict:
    existing = get_cong_trinh_by_ma(ma_ct)
    if existing:
        rows = update("cong_trinh", {"ten_ct": ten_ct, "dia_chi": dia_chi},
                      filters=f"ma_ct=eq.{ma_ct}")
    else:
        rows = insert("cong_trinh", {"ma_ct": ma_ct, "ten_ct": ten_ct,
                                      "dia_chi": dia_chi, "ghi_chu": ghi_chu})
    return rows[0] if rows else {}


# ── Phiếu ─────────────────────────────────────────────────────

def get_phieu_list(cong_trinh_id: int = None, loai: str = None,
                   search: str = None, limit: int = 200,
                   offset: int = 0,
                   date_from: str = None, date_to: str = None) -> list:
    extra = ""
    if cong_trinh_id:
        extra += f"&cong_trinh_id=eq.{cong_trinh_id}"
    if loai:
        extra += f"&loai=eq.{loai}"
    if search:
        extra += f"&or=(so_phieu.ilike.*{search}*,doi_tac.ilike.*{search}*)"
    if date_from:
        extra += f"&ngay=gte.{date_from}"
    if date_to:
        extra += f"&ngay=lte.{date_to}"
    page_size = min(limit, 1000)
    rows = select("phieu", query="*",
                  filters=f"limit={page_size}&offset={offset}{extra}",
                  order="ngay.desc")
    return rows


def push_phieu(cong_trinh_id: int, local_id: int, loai: str, so_phieu: str,
               ngay: str, doi_tac: str, ghi_chu: str = "",
               tong_tien: float = 0, nguon: str = "web") -> Optional[int]:
    """Push 1 phiếu lên Supabase. Trả về id cloud hoặc None nếu đã tồn tại."""
    existing = select("phieu",
                      filters=f"cong_trinh_id=eq.{cong_trinh_id}&local_id=eq.{local_id}")
    if existing:
        return existing[0]["id"]
    rows = insert("phieu", {
        "cong_trinh_id": cong_trinh_id, "local_id": local_id,
        "loai": loai, "so_phieu": so_phieu, "ngay": ngay,
        "doi_tac": doi_tac, "ghi_chu": ghi_chu,
        "tong_tien": tong_tien, "nguon": nguon,
    })
    return rows[0]["id"] if rows else None


def create_phieu(cong_trinh_id: int, loai: str, so_phieu: str,
                 ngay: str, doi_tac: str, ghi_chu: str = "",
                 tong_tien: float = 0, nguon: str = "web") -> Optional[dict]:
    """Tạo phiếu mới, trả về dict phiếu vừa tạo."""
    rows = insert("phieu", {
        "cong_trinh_id": cong_trinh_id,
        "loai": loai, "so_phieu": so_phieu, "ngay": ngay,
        "doi_tac": doi_tac, "ghi_chu": ghi_chu,
        "tong_tien": tong_tien, "nguon": nguon,
    })
    return rows[0] if rows else None


def push_chi_tiet(phieu_cloud_id: int, items: list):
    """Push danh sách chi tiết phiếu lên Supabase."""
    if not items:
        return
    data = [{"phieu_id": phieu_cloud_id,
             "ten_hang": it.get("ten_hang", ""),
             "dvt": it.get("dvt", "cái"),
             "so_luong": it.get("so_luong", 0),
             "don_gia": it.get("don_gia", 0),
             "thanh_tien": it.get("thanh_tien", 0),
             "ghi_chu": it.get("ghi_chu", "")} for it in items]
    insert("chi_tiet_phieu", data)


def delete_phieu(phieu_id: int):
    """Xóa phiếu và chi tiết phiếu theo id."""
    delete("chi_tiet_phieu", filters=f"phieu_id=eq.{phieu_id}")
    delete("phieu", filters=f"id=eq.{phieu_id}")


# ── Danh mục hàng hóa ────────────────────────────────────────

def get_all_hang_hoa(cong_trinh_id: int = None, search: str = None,
                     limit: int = 2000, offset: int = 0) -> list:
    """Lấy danh mục hàng hóa từ Supabase với pagination và filter."""
    filters = f"limit={limit}&offset={offset}"
    if cong_trinh_id:
        filters += f"&cong_trinh_id=eq.{cong_trinh_id}"
    if search:
        filters += f"&or=(ten_hang.ilike.*{search}*,ma_hang.ilike.*{search}*)"
    return select("hang_hoa",
                  query="ma_hang,ten_hang,dvt,nhom,cong_trinh_id",
                  filters=filters,
                  order="nhom.asc,ten_hang.asc")


def create_hang_hoa(data: dict) -> Optional[dict]:
    rows = insert("hang_hoa", data)
    return rows[0] if rows else None


def update_hang_hoa(ma_hang: str, data: dict) -> Optional[dict]:
    rows = update("hang_hoa", data, filters=f"ma_hang=eq.{ma_hang}")
    return rows[0] if rows else None


def delete_hang_hoa(ma_hang: str):
    delete("hang_hoa", filters=f"ma_hang=eq.{ma_hang}")


# ── Tồn kho (từ view) ─────────────────────────────────────────

def get_ton_kho_all() -> list:
    """Lấy tồn kho tổng hợp tất cả công trình từ view v_ton_kho"""
    return select("v_ton_kho", order="ma_ct.asc,nhom.asc,ten_hang.asc")


def get_ton_kho_by_ct(cong_trinh_id: int = None, ma_ct: str = None) -> list:
    if cong_trinh_id:
        return select("v_ton_kho", filters=f"cong_trinh_id=eq.{cong_trinh_id}",
                      order="nhom.asc,ten_hang.asc")
    if ma_ct:
        return select("v_ton_kho", filters=f"ma_ct=eq.{ma_ct}",
                      order="nhom.asc,ten_hang.asc")
    return get_ton_kho_all()


# ── Thống kê nhanh ────────────────────────────────────────────

def get_thong_ke_tong() -> dict:
    """Đếm nhanh số phiếu NK/XK và số công trình active"""
    cts = get_all_cong_trinh()
    phieus = select("phieu", query="loai,cong_trinh_id,tong_tien,ngay")
    nk = sum(1 for p in phieus if p["loai"] == "NK")
    xk = sum(1 for p in phieus if p["loai"] == "XK")
    tong_tien_nk = sum(p.get("tong_tien") or 0 for p in phieus if p["loai"] == "NK")
    tong_tien_xk = sum(p.get("tong_tien") or 0 for p in phieus if p["loai"] == "XK")
    return {
        "so_cong_trinh": len(cts),
        "so_phieu_nk": nk,
        "so_phieu_xk": xk,
        "tong_phieu": nk + xk,
        "tong_tien_nk": tong_tien_nk,
        "tong_tien_xk": tong_tien_xk,
    }


# ── Chi tiết phiếu ────────────────────────────────────────────

def get_chi_tiet_phieu(cloud_phieu_id: int) -> list:
    """Lấy danh sách hàng hóa của 1 phiếu theo cloud id."""
    return select("chi_tiet_phieu",
                  filters=f"phieu_id=eq.{cloud_phieu_id}",
                  order="id.asc")


def _fetch_all(table: str, query: str, order: str = "id.asc",
               page_size: int = 1000, max_rows: int = 100000) -> list:
    """Lấy toàn bộ dữ liệu với pagination — vượt qua giới hạn 1000 rows/lần."""
    all_rows = []
    offset   = 0
    while True:
        rows = select(table, query=query,
                      filters=f"limit={page_size}&offset={offset}",
                      order=order)
        all_rows.extend(rows)
        if len(rows) < page_size or len(all_rows) >= max_rows:
            break
        offset += page_size
    return all_rows


def get_all_chi_tiet() -> list:
    """Lấy toàn bộ chi tiết phiếu với pagination."""
    return _fetch_all(
        "chi_tiet_phieu",
        query="phieu_id,ten_hang,dvt,so_luong,don_gia,thanh_tien,ghi_chu",
        order="phieu_id.asc"
    )


def get_lich_su(phieu_list: list, limit: int = 20000) -> list:
    """
    Tạo lịch sử giao dịch bằng cách join chi_tiet_phieu với phieu_list.
    phieu_list: list dict có id, loai, so_phieu, ngay, doi_tac, cong_trinh_id
    """
    chi_tiets = get_all_chi_tiet()
    phieu_map = {p["id"]: p for p in phieu_list if p.get("id")}
    result = []
    for r in chi_tiets:
        pid = r.get("phieu_id")
        p   = phieu_map.get(pid, {})
        result.append({
            "ten_hang":      r.get("ten_hang", ""),
            "dvt":           r.get("dvt", ""),
            "so_luong":      r.get("so_luong", 0),
            "don_gia":       r.get("don_gia", 0),
            "thanh_tien":    r.get("thanh_tien", 0),
            "ghi_chu":       r.get("ghi_chu", ""),
            "loai":          p.get("loai", ""),
            "so_phieu":      p.get("so_phieu", ""),
            "ngay":          p.get("ngay", ""),
            "doi_tac":       p.get("doi_tac", ""),
            "cong_trinh_id": p.get("cong_trinh_id"),
        })
    return result[:limit]


# ── Test kết nối ─────────────────────────────────────────────

def test_connection() -> tuple[bool, str]:
    try:
        rows = select("cong_trinh", query="id", filters="limit=1")
        return True, f"Kết nối OK — {len(rows)} công trình"
    except Exception as e:
        return False, f"Lỗi: {e}"


if __name__ == "__main__":
    ok, msg = test_connection()
    print(msg)
