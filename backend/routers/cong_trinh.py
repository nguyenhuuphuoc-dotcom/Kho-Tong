"""
routers/cong_trinh.py — API endpoints cho Công trình
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import supabase_client as db

router = APIRouter(prefix="/api/cong-trinh", tags=["cong_trinh"])


class CongTrinhCreate(BaseModel):
    ma_ct: str
    ten_ct: str
    dia_chi: Optional[str] = ""
    ghi_chu: Optional[str] = ""


@router.get("/")
def list_cong_trinh():
    """Lấy danh sách tất cả công trình."""
    try:
        rows = db.get_all_cong_trinh()
        return {"data": rows, "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy danh sách công trình: {str(e)}")


@router.get("/{id}")
def get_cong_trinh(id: int):
    """Lấy thông tin 1 công trình theo id."""
    try:
        row = db.get_cong_trinh_by_id(id)
        if not row:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy công trình id={id}")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy công trình: {str(e)}")


@router.post("/")
def create_cong_trinh(body: CongTrinhCreate):
    """Tạo hoặc cập nhật công trình."""
    try:
        row = db.upsert_cong_trinh(
            ma_ct=body.ma_ct,
            ten_ct=body.ten_ct,
            dia_chi=body.dia_chi or "",
            ghi_chu=body.ghi_chu or ""
        )
        if not row:
            raise HTTPException(status_code=500, detail="Không thể tạo công trình")
        return row
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo công trình: {str(e)}")
