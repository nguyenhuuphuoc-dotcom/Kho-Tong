"""
routers/ton_kho.py — API endpoints cho Tồn kho
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import supabase_client as db

router = APIRouter(prefix="/api/ton-kho", tags=["ton_kho"])


@router.get("/")
def get_ton_kho(
    cong_trinh_id: Optional[int] = Query(None, description="Lọc theo id công trình"),
    ma_ct: Optional[str] = Query(None, description="Lọc theo mã công trình"),
):
    """Lấy tồn kho. Nếu không có filter → trả về tất cả công trình."""
    try:
        if cong_trinh_id:
            rows = db.get_ton_kho_by_ct(cong_trinh_id=cong_trinh_id)
        elif ma_ct:
            rows = db.get_ton_kho_by_ct(ma_ct=ma_ct)
        else:
            rows = db.get_ton_kho_all()
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy tồn kho: {str(e)}")


@router.get("/lich-su/{ten_hang}")
def get_lich_su_hang(
    ten_hang: str,
    cong_trinh_id: Optional[int] = Query(None),
    limit: int = Query(200, ge=1, le=2000),
):
    """Lấy lịch sử nhập/xuất của 1 mặt hàng."""
    try:
        # Lấy phiếu list (có filter công trình nếu cần)
        phieu_list = db.get_phieu_list(
            cong_trinh_id=cong_trinh_id,
            limit=10000
        )
        # Lấy lịch sử và filter theo tên hàng
        lich_su = db.get_lich_su(phieu_list, limit=50000)
        filtered = [
            r for r in lich_su
            if ten_hang.lower() in r.get("ten_hang", "").lower()
        ][:limit]

        # Tính tổng nhập/xuất
        tong_nk = sum(r["so_luong"] for r in filtered if r.get("loai") == "NK")
        tong_xk = sum(r["so_luong"] for r in filtered if r.get("loai") == "XK")

        return {
            "ten_hang": ten_hang,
            "tong_nhap": tong_nk,
            "tong_xuat": tong_xk,
            "ton_kho": tong_nk - tong_xk,
            "lich_su": filtered,
            "total": len(filtered),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy lịch sử hàng: {str(e)}")
