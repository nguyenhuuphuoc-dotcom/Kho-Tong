"""
routers/bao_cao.py — API endpoints cho Báo cáo & Thống kê
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import date, datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import supabase_client as db

router = APIRouter(prefix="/api/bao-cao", tags=["bao_cao"])


def _parse_date(s: str) -> Optional[date]:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            pass
    return None


@router.get("/tong-hop")
def bao_cao_tong_hop(
    cong_trinh_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None, description="Từ ngày YYYY-MM-DD"),
    date_to:   Optional[str] = Query(None, description="Đến ngày YYYY-MM-DD"),
):
    """
    Thống kê tổng hợp: 5 KPI cards + top vật tư + bảng công trình + cảnh báo tồn kho thấp.
    Nếu có cong_trinh_id thì filter theo công trình đó.
    """
    try:
        # ── Phiếu ────────────────────────────────────────────
        phieu_list = db.get_phieu_list(
            cong_trinh_id=cong_trinh_id, limit=5000,
            date_from=date_from, date_to=date_to
        )

        # ── KPI cơ bản ───────────────────────────────────────
        if cong_trinh_id:
            nk = [p for p in phieu_list if p.get("loai") == "NK"]
            xk = [p for p in phieu_list if p.get("loai") == "XK"]
            thong_ke = {
                "so_cong_trinh": 1,
                "so_phieu_nk": len(nk),
                "so_phieu_xk": len(xk),
                "tong_phieu": len(phieu_list),
                "tong_tien_nk": sum(float(p.get("tong_tien") or 0) for p in nk),
                "tong_tien_xk": sum(float(p.get("tong_tien") or 0) for p in xk),
            }
        else:
            thong_ke = db.get_thong_ke_tong()

        # ── Tồn kho ──────────────────────────────────────────
        if cong_trinh_id:
            ton_kho = db.get_ton_kho_by_ct(cong_trinh_id=cong_trinh_id)
        else:
            ton_kho = db.get_ton_kho_all()
        canh_bao = [r for r in ton_kho if (r.get("ton_cuoi") or 0) <= 0]

        # Đếm mặt hàng từ bảng hang_hoa, filter theo CT nếu có
        try:
            so_mat_hang_dm = len(db.get_all_hang_hoa(cong_trinh_id=cong_trinh_id))
        except Exception:
            so_mat_hang_dm = len(ton_kho)

        # ── Top vật tư ───────────────────────────────────────
        # phieu_list đã lấy ở trên
        chi_tiets  = db.get_all_chi_tiet()
        phieu_map  = {p["id"]: p for p in phieu_list if p.get("id")}

        hang_nk: dict = {}
        hang_xk: dict = {}
        for r in chi_tiets:
            pid = r.get("phieu_id")
            p   = phieu_map.get(pid, {})
            ten = r.get("ten_hang", "")
            sl  = float(r.get("so_luong") or 0)
            tt  = float(r.get("thanh_tien") or 0)
            if p.get("loai") == "NK":
                hang_nk[ten] = hang_nk.get(ten, {"so_luong": 0, "thanh_tien": 0})
                hang_nk[ten]["so_luong"]  += sl
                hang_nk[ten]["thanh_tien"] += tt
            elif p.get("loai") == "XK":
                hang_xk[ten] = hang_xk.get(ten, {"so_luong": 0, "thanh_tien": 0})
                hang_xk[ten]["so_luong"]  += sl
                hang_xk[ten]["thanh_tien"] += tt

        top_nk = sorted(
            [{"ten_hang": k, **v} for k, v in hang_nk.items()],
            key=lambda x: x["thanh_tien"], reverse=True
        )[:10]
        top_xk = sorted(
            [{"ten_hang": k, **v} for k, v in hang_xk.items()],
            key=lambda x: x["thanh_tien"], reverse=True
        )[:10]

        # ── Bảng công trình ──────────────────────────────────
        # Nếu filter theo 1 CT cụ thể thì chỉ show CT đó; admin xem tất cả
        cts = db.get_all_cong_trinh() if not cong_trinh_id else \
              db.select("cong_trinh", filters=f"id=eq.{cong_trinh_id}")
        ct_map: dict = {}
        for p in phieu_list:
            cid = p.get("cong_trinh_id")
            if not cid:
                continue
            if cid not in ct_map:
                ct_map[cid] = {"so_phieu_nk": 0, "so_phieu_xk": 0,
                                "tong_tien_nk": 0, "tong_tien_xk": 0}
            loai = p.get("loai")
            tien = float(p.get("tong_tien") or 0)
            if loai == "NK":
                ct_map[cid]["so_phieu_nk"] += 1
                ct_map[cid]["tong_tien_nk"] += tien
            elif loai == "XK":
                ct_map[cid]["so_phieu_xk"] += 1
                ct_map[cid]["tong_tien_xk"] += tien

        bang_ct = []
        for ct in cts:
            cid = ct.get("id")
            stats = ct_map.get(cid, {"so_phieu_nk": 0, "so_phieu_xk": 0,
                                      "tong_tien_nk": 0, "tong_tien_xk": 0})
            bang_ct.append({**ct, **stats})

        return {
            "kpi": {
                **thong_ke,
                "so_mat_hang": so_mat_hang_dm,
                "so_canh_bao": len(canh_bao),
            },
            "top_vat_tu_nk": top_nk,
            "top_vat_tu_xk": top_xk,
            "bang_cong_trinh": bang_ct,
            "canh_bao_ton_thap": canh_bao[:20],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi báo cáo tổng hợp: {str(e)}")


@router.get("/theo-thang")
def bao_cao_theo_thang(
    year: int  = Query(..., description="Năm, ví dụ: 2026"),
    month: int = Query(..., ge=1, le=12, description="Tháng 1-12"),
    cong_trinh_id: Optional[int] = Query(None),
):
    """Báo cáo chi tiết trong 1 tháng: tổng nhập, xuất, top hàng hóa."""
    try:
        from_date = f"{year}-{month:02d}-01"
        if month == 12:
            to_date = f"{year+1}-01-01"
        else:
            to_date = f"{year}-{month+1:02d}-01"

        # Lấy phiếu trong tháng
        all_phieu = db.get_phieu_list(cong_trinh_id=cong_trinh_id, limit=10000)
        phieu_thang = [
            p for p in all_phieu
            if p.get("ngay") and from_date <= p["ngay"] < to_date
        ]

        phieu_nk = [p for p in phieu_thang if p.get("loai") == "NK"]
        phieu_xk = [p for p in phieu_thang if p.get("loai") == "XK"]

        tong_tien_nk = sum(float(p.get("tong_tien") or 0) for p in phieu_nk)
        tong_tien_xk = sum(float(p.get("tong_tien") or 0) for p in phieu_xk)

        # Chi tiết hàng hóa trong tháng
        phieu_ids = {p["id"] for p in phieu_thang if p.get("id")}
        all_ct    = db.get_all_chi_tiet()
        ct_thang  = [r for r in all_ct if r.get("phieu_id") in phieu_ids]

        phieu_map = {p["id"]: p for p in phieu_thang}
        hang_stats: dict = {}
        for r in ct_thang:
            pid  = r.get("phieu_id")
            p    = phieu_map.get(pid, {})
            ten  = r.get("ten_hang", "")
            sl   = float(r.get("so_luong") or 0)
            tt   = float(r.get("thanh_tien") or 0)
            loai = p.get("loai", "")
            if ten not in hang_stats:
                hang_stats[ten] = {"dvt": r.get("dvt",""), "nk": 0, "xk": 0,
                                   "tien_nk": 0, "tien_xk": 0}
            if loai == "NK":
                hang_stats[ten]["nk"] += sl
                hang_stats[ten]["tien_nk"] += tt
            elif loai == "XK":
                hang_stats[ten]["xk"] += sl
                hang_stats[ten]["tien_xk"] += tt

        chi_tiet_hang = sorted(
            [{"ten_hang": k, **v} for k, v in hang_stats.items()],
            key=lambda x: x["tien_nk"] + x["tien_xk"], reverse=True
        )

        return {
            "thang": month,
            "nam": year,
            "cong_trinh_id": cong_trinh_id,
            "tong_phieu_nk": len(phieu_nk),
            "tong_phieu_xk": len(phieu_xk),
            "tong_tien_nk": tong_tien_nk,
            "tong_tien_xk": tong_tien_xk,
            "phieu_nk": phieu_nk,
            "phieu_xk": phieu_xk,
            "chi_tiet_hang": chi_tiet_hang,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi báo cáo theo tháng: {str(e)}")


@router.get("/bieu-do")
def bieu_do_nhap_xuat(
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    period:    str            = Query("month", description="day hoặc month"),
    cong_trinh_id: Optional[int] = Query(None),
):
    """
    Data cho biểu đồ nhập-xuất-tồn theo ngày hoặc tháng.
    Trả về list [{period, tong_nk, tong_xk, tong_tien_nk, tong_tien_xk}]
    """
    try:
        all_phieu = db.get_phieu_list(cong_trinh_id=cong_trinh_id, limit=10000)

        # Filter theo ngày nếu có
        if from_date:
            all_phieu = [p for p in all_phieu
                         if p.get("ngay") and p["ngay"] >= from_date]
        if to_date:
            all_phieu = [p for p in all_phieu
                         if p.get("ngay") and p["ngay"] <= to_date]

        # Nhóm theo period
        buckets: dict = {}
        for p in all_phieu:
            ngay = p.get("ngay", "")
            if not ngay:
                continue
            if period == "day":
                key = ngay[:10]
            else:  # month
                key = ngay[:7]  # YYYY-MM

            if key not in buckets:
                buckets[key] = {"period": key,
                                 "tong_nk": 0, "tong_xk": 0,
                                 "tong_tien_nk": 0, "tong_tien_xk": 0}
            loai = p.get("loai", "")
            tien = float(p.get("tong_tien") or 0)
            if loai == "NK":
                buckets[key]["tong_nk"] += 1
                buckets[key]["tong_tien_nk"] += tien
            elif loai == "XK":
                buckets[key]["tong_xk"] += 1
                buckets[key]["tong_tien_xk"] += tien

        data = sorted(buckets.values(), key=lambda x: x["period"])
        return {"period_type": period, "data": data, "total_points": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy data biểu đồ: {str(e)}")
