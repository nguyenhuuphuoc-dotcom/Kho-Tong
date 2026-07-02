import base64, json, re, urllib.request, urllib.error
from pathlib import Path


def _file_to_base64(path):
    p = Path(path); s = p.suffix.lower()
    if s == '.pdf': mt = 'application/pdf'
    elif s in ('.jpg','.jpeg'): mt = 'image/jpeg'
    elif s == '.png': mt = 'image/png'
    elif s == '.webp': mt = 'image/webp'
    else: mt = 'image/jpeg'
    with open(path,'rb') as f: data = base64.b64encode(f.read()).decode()
    return data, mt


def _render_pages_fitz(file_path, max_pages=8, scale=3.0):
    """Render tung trang PDF thanh anh PNG 3x bang fitz. Tra ve [] neu khong co fitz."""
    try:
        import fitz
        doc = fitz.open(str(file_path))
        pages = []
        for i in range(min(len(doc), max_pages)):
            page = doc[i]
            mat = fitz.Matrix(scale, scale)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            pages.append(pix.tobytes("png"))
        doc.close()
        return pages
    except Exception:
        return []


def _build_prompt(loai, date_mode='auto'):
    loai_text = "NHAP KHO" if loai == "NK" else "XUAT KHO"
    dt = "nha cung cap (NCC/NTP) da giao hang" if loai == "NK" else "noi nhan / cong trinh nhan hang"
    if date_mode == 'signature':
        dn = "Ngay: CHI lay tu vung chu ky (goc duoi phieu). Neu khong co thi de rong."
    elif date_mode == 'signature_priority':
        dn = "Ngay: UU TIEN lay tu vung chu ky (cuoi phieu). Neu khong co moi lay o dau phieu."
    else:
        dn = "Ngay dinh dang YYYY-MM-DD. Neu nam chi 2 chu so (vi du 26) thi them 2000. Neu khong ro thi de rong."
    return (
        f"Day la phieu {loai_text} cua cong ty xay dung HP Cons Viet Nam.\n"
        "Phieu co the viet tay, scan, hoac chu viet tay xen chu in — hay doc ky ca chu viet tay nho.\n"
        "Cau truc phieu gom: tieu de, so phieu, ngay, ten NCC/nguoi nhan, bang hang hoa chi tiet.\n"
        "Neu co ca Phieu Nhap Kho (PNK) va Phieu Giao Hang/Hoa Don NCC (PGH) trong file:\n"
        "  - Lay so_phieu, ngay, doi_tac tu PHIEU NHAP KHO\n"
        "  - Lay items (chi tiet hang hoa) UU TIEN tu PGH/hoa don (so lieu chinh xac hon)\n"
        "  - Neu khong co PGH thi lay items tu chinh PNK\n\n"
        "CHI TRA VE JSON THUAN, KHONG CO BAT KY TEXT NAO KHAC, KHONG MARKDOWN:\n"
        "{\"so_phieu\":\"\",\"ngay\":\"YYYY-MM-DD\",\"doi_tac\":\"\",\"ghi_chu\":\"\","
        "\"items\":[{\"ten_hang\":\"\",\"dvt\":\"\",\"so_luong\":0,\"don_gia\":0}]}\n"
        "Luu y quan trong:\n"
        f"- {dn}\n"
        f"- doi_tac = {dt}\n"
        "- ten_hang: giu nguyen tieng Viet co dau, day du thong so ky thuat (kich thuoc, mac, loai, quy cach)\n"
        "- dvt: don vi tinh (cai, met, kg, m2, m3, cuon, thanh, bo, hop...)\n"
        "- so_luong va don_gia la so thuc (don_gia = 0 neu khong co gia)\n"
        "- Trich xuat TAT CA hang hoa trong phieu, khong bo sot dong nao du it hay nhieu\n"
        "- Neu truong nao khong doc duoc ro, de chuoi rong (khong doan mo)"
    )


def _build_prompt_multi(loai, date_mode='auto'):
    """Prompt cho PDF nhieu phieu - tra ve JSON array"""
    loai_text = "NHAP KHO" if loai == "NK" else "XUAT KHO"
    dt = "nha cung cap (NCC/NTP)" if loai == "NK" else "noi nhan / cong trinh"
    if date_mode == 'signature':
        dn = "Ngay: CHI lay tu vung chu ky (goc duoi phieu)."
    elif date_mode == 'signature_priority':
        dn = "Ngay: UU TIEN lay tu vung chu ky, neu khong co moi lay o dau phieu."
    else:
        dn = "Ngay dinh dang YYYY-MM-DD. Neu nam 2 chu so thi them 2000."
    return (
        f"File nay chua nhieu bo phieu {loai_text} cua cong ty xay dung HP Cons Viet Nam.\n"
        "Moi bo gom: 1 PHIEU NHAP KHO (PNK) + 1 hoac nhieu PHIEU GIAO HANG/HOA DON NCC (PGH) ngay sau no.\n"
        "File co the viet tay, scan, chu viet tay xen chu in — hay doc ky ca chu viet tay nho.\n\n"
        "QUY TAC XAC DINH VA GHEP CAP:\n"
        "  - PNK: trang co chu 'Phieu Nhap Kho', 'PNK xxxx', 'NK xxxx' — trang chinh cua moi bo\n"
        "  - PGH/Hoa don: trang co chu 'Phieu Giao Hang', 'Hoa Don', 'Invoice', 'Delivery'...\n"
        "  - Moi PNK ghep voi tat ca PGH ngay sau no (truoc PNK tiep theo)\n\n"
        "VOI MOI BO PNK+PGH, tao 1 object JSON — lay thong tin theo nguon:\n"
        "  so_phieu : lay tu PNK (so PNK / PNK xxxx / NK xxxx)\n"
        "  ngay     : lay tu PNK\n"
        f"  doi_tac  : lay tu PNK — {dt}\n"
        "  items    : UU TIEN lay tu PGH/hoa don (chinh xac hon); neu khong co PGH thi lay tu PNK\n\n"
        "Tra ve JSON MANG, KHONG TEXT KHAC, KHONG MARKDOWN:\n"
        "[{\"so_phieu\":\"\",\"ngay\":\"YYYY-MM-DD\",\"doi_tac\":\"\",\"ghi_chu\":\"\","
        "\"items\":[{\"ten_hang\":\"\",\"dvt\":\"\",\"so_luong\":0,\"don_gia\":0}]}]\n"
        "Luu y quan trong:\n"
        f"  - {dn}\n"
        "  - ten_hang: giu nguyen tieng Viet co dau, day du thong so ky thuat, KHONG viet tat\n"
        "  - Trich xuat TAT CA hang hoa moi bo, khong bo sot dong nao\n"
        "  - Moi cap PNK+PGH = 1 phan tu mang. Chi co 1 cap → mang 1 phan tu"
    )


def _parse_json(text):
    """Parser manh: xu ly moi truong hop tra ve cua AI"""
    text = re.sub(r'```json|```', '', text).strip()
    for ch in ('{', '['):
        idx = text.find(ch)
        if idx >= 0:
            try:
                parsed, _ = json.JSONDecoder().raw_decode(text, idx)
                if isinstance(parsed, list):
                    parsed = {"items": parsed}
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass
    raise RuntimeError("AI khong tra ve JSON hop le. Thu lai hoac nhap tay.")


def _parse_json_list(text):
    """Parser cho multi-phieu: luon tra ve list"""
    text = re.sub(r'```json|```', '', text).strip()
    for ch in ('[', '{'):
        idx = text.find(ch)
        if idx >= 0:
            try:
                parsed, _ = json.JSONDecoder().raw_decode(text, idx)
                if isinstance(parsed, list):
                    return parsed
                if isinstance(parsed, dict):
                    return [parsed]
            except Exception:
                pass
    raise RuntimeError("AI khong tra ve JSON hop le. Thu lai hoac nhap tay.")


def _normalize(parsed):
    if not isinstance(parsed, dict): parsed = {}
    parsed.setdefault('so_phieu', '')
    parsed.setdefault('ngay', '')
    parsed.setdefault('doi_tac', '')
    parsed.setdefault('ghi_chu', '')
    items = parsed.get('items', [])
    if not isinstance(items, list): items = []
    parsed['items'] = items
    for it in items:
        if not isinstance(it, dict): continue
        it.setdefault('ten_hang', '')
        it.setdefault('dvt', 'cai')
        it.setdefault('so_luong', 0)
        it.setdefault('don_gia', 0)
        try: it['so_luong'] = float(it['so_luong'])
        except: it['so_luong'] = 0
        try: it['don_gia'] = float(it['don_gia'])
        except: it['don_gia'] = 0
    return parsed


def _build_content_parts(file_path, prompt):
    """
    Tao content parts cho API Claude:
    - Neu file la PDF va fitz co san: render tung trang 3x → list anh PNG (chat luong cao hon)
    - Nguoc lai: gui PDF goc hoac anh nguyen ban
    """
    p = Path(file_path)
    if p.suffix.lower() == '.pdf':
        pages = _render_pages_fitz(file_path, max_pages=8, scale=3.0)
        if pages:
            parts = []
            for png_data in pages:
                b64 = base64.b64encode(png_data).decode()
                parts.append({"type": "image",
                               "source": {"type": "base64", "media_type": "image/png", "data": b64}})
            parts.append({"type": "text", "text": prompt})
            return parts

    # Fallback: gui file goc
    b64, mt = _file_to_base64(file_path)
    if mt == 'application/pdf':
        cp = {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": b64}}
    else:
        cp = {"type": "image", "source": {"type": "base64", "media_type": mt, "data": b64}}
    return [cp, {"type": "text", "text": prompt}]


def _call_claude_api(api_key, content_parts, max_tokens=8000):
    """Goi Claude API voi content parts da chuan bi san."""
    body = json.dumps({
        "model": "claude-sonnet-4-6",
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": content_parts}]
    }).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body,
        headers={"Content-Type": "application/json", "x-api-key": api_key,
                 "anthropic-version": "2023-06-01"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        try: msg = json.loads(err).get('error', {}).get('message', err)
        except: msg = err
        raise RuntimeError(f"Claude API loi {e.code}: {msg}")
    return ''.join(c.get('text', '') for c in result.get('content', []))


def _claude(file_path, loai, api_key, date_mode='auto'):
    prompt = _build_prompt(loai, date_mode)
    parts = _build_content_parts(file_path, prompt)
    text = _call_claude_api(api_key, parts)
    return _normalize(_parse_json(text))


def _claude_multi(file_path, loai, api_key, date_mode='auto'):
    prompt = _build_prompt_multi(loai, date_mode)
    parts = _build_content_parts(file_path, prompt)
    text = _call_claude_api(api_key, parts)
    lst = _parse_json_list(text)
    return [_normalize(p) for p in lst if isinstance(p, dict)]


def _gemini(file_path, loai, api_key, date_mode='auto', model='gemini-2.0-flash-lite'):
    """Goi Gemini API doc phieu. Model mac dinh: gemini-2.0-flash-lite"""
    b64, mt = _file_to_base64(file_path)
    prompt = _build_prompt(loai, date_mode)
    body = json.dumps({
        "contents": [{"parts": [
            {"inlineData": {"mimeType": mt, "data": b64}},
            {"text": prompt}
        ]}],
        "generationConfig": {"maxOutputTokens": 8000}
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        try: msg = json.loads(err).get('error', {}).get('message', err)
        except: msg = err
        raise RuntimeError(f"Gemini API loi {e.code}: {msg}")
    try:
        text = result['candidates'][0]['content']['parts'][0]['text']
    except:
        raise RuntimeError("Gemini khong tra ve ket qua. Thu lai!")
    return _normalize(_parse_json(text))


def _gemini_multi(file_path, loai, api_key, date_mode='auto', model='gemini-2.0-flash-lite'):
    """Goi Gemini API doc nhieu phieu. Tra ve list."""
    b64, mt = _file_to_base64(file_path)
    prompt = _build_prompt_multi(loai, date_mode)
    body = json.dumps({
        "contents": [{"parts": [
            {"inlineData": {"mimeType": mt, "data": b64}},
            {"text": prompt}
        ]}],
        "generationConfig": {"maxOutputTokens": 8000}
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            result = json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        try: msg = json.loads(err).get('error', {}).get('message', err)
        except: msg = err
        raise RuntimeError(f"Gemini API loi {e.code}: {msg}")
    try:
        text = result['candidates'][0]['content']['parts'][0]['text']
    except:
        raise RuntimeError("Gemini khong tra ve ket qua. Thu lai!")
    lst = _parse_json_list(text)
    return [_normalize(p) for p in lst if isinstance(p, dict)]


# ── Public API ────────────────────────────────────────────────

def doc_phieu(file_path: str, loai: str, api_key: str,
              provider: str = 'claude', date_mode: str = 'auto') -> dict:
    """
    Doc 1 phieu tu file anh hoac PDF.
    provider: 'claude' hoac 'gemini'
    date_mode: 'auto' | 'signature' | 'signature_priority'
    Tra ve dict: {so_phieu, ngay, doi_tac, ghi_chu, items[]}
    """
    if provider == 'gemini':
        return _gemini(file_path, loai, api_key, date_mode)
    return _claude(file_path, loai, api_key, date_mode)


def doc_phieu_multi(file_path: str, loai: str, api_key: str,
                    provider: str = 'claude', date_mode: str = 'auto') -> list:
    """
    Doc nhieu phieu tu 1 file PDF.
    Tra ve list dict: [{so_phieu, ngay, doi_tac, ghi_chu, items[]}]
    """
    if provider == 'gemini':
        return _gemini_multi(file_path, loai, api_key, date_mode)
    return _claude_multi(file_path, loai, api_key, date_mode)
