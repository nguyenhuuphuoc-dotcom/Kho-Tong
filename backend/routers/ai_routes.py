"""
routers/ai_routes.py — API endpoints cho AI đọc phiếu
"""
import os, tempfile, shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header, Query
from typing import Optional
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import ai_reader
from config import get_settings

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _resolve_api_key(provider: str,
                     api_key_query: Optional[str],
                     x_api_key: Optional[str]) -> str:
    """Lấy API key theo thứ tự ưu tiên: query param → header → config."""
    key = api_key_query or x_api_key
    if not key:
        settings = get_settings()
        if provider == "gemini":
            key = settings.GEMINI_API_KEY
        else:
            key = settings.CLAUDE_API_KEY
    if not key:
        raise HTTPException(
            status_code=400,
            detail=f"Thiếu API key cho provider '{provider}'. "
                   "Truyền qua query ?api_key=... hoặc header X-API-Key"
        )
    return key


@router.post("/doc-phieu")
async def doc_phieu(
    file: UploadFile = File(..., description="File ảnh hoặc PDF phiếu"),
    loai: str        = Form("NK",   description="NK hoặc XK"),
    provider: str    = Form("claude", description="claude hoặc gemini"),
    date_mode: str   = Form("auto",  description="auto | signature | signature_priority"),
    api_key: Optional[str] = Query(None, description="API key (tùy chọn)"),
    x_api_key: Optional[str] = Header(None, description="API key qua header"),
):
    """
    Upload 1 file ảnh hoặc PDF, AI đọc và trả về thông tin phiếu.
    Response: {so_phieu, ngay, doi_tac, ghi_chu, items[]}
    """
    key = _resolve_api_key(provider, api_key, x_api_key)

    # Lưu file tạm
    suffix = os.path.splitext(file.filename or "upload.pdf")[1] or ".pdf"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        result = ai_reader.doc_phieu(
            file_path=tmp_path,
            loai=loai,
            api_key=key,
            provider=provider,
            date_mode=date_mode,
        )
        return result

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc phiếu: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/doc-phieu-multi")
async def doc_phieu_multi(
    file: UploadFile = File(..., description="PDF chứa nhiều phiếu"),
    loai: str        = Form("NK",    description="NK hoặc XK"),
    provider: str    = Form("claude", description="claude hoặc gemini"),
    date_mode: str   = Form("auto",   description="auto | signature | signature_priority"),
    api_key: Optional[str] = Query(None),
    x_api_key: Optional[str] = Header(None),
):
    """
    Upload PDF nhiều phiếu, AI nhận diện và trả về list phiếu.
    Response: [{so_phieu, ngay, doi_tac, ghi_chu, items[]}]
    """
    key = _resolve_api_key(provider, api_key, x_api_key)

    suffix = os.path.splitext(file.filename or "upload.pdf")[1] or ".pdf"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        results = ai_reader.doc_phieu_multi(
            file_path=tmp_path,
            loai=loai,
            api_key=key,
            provider=provider,
            date_mode=date_mode,
        )
        return {"count": len(results), "phieu_list": results}

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc nhiều phiếu: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
