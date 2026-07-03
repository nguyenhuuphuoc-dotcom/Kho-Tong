/**
 * exportExcel.js — Xuất Excel dùng SheetJS (load từ CDN, không cần npm install)
 */

// Load SheetJS từ CDN nếu chưa có
async function getXLSX() {
  if (window.XLSX) return window.XLSX
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'
    s.onload  = () => resolve(window.XLSX)
    s.onerror = () => reject(new Error('Khong tai duoc SheetJS. Kiem tra ket noi mang.'))
    document.head.appendChild(s)
  })
}

// Download file xlsx
function triggerDownload(wb, filename) {
  const XLSX = window.XLSX
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob  = new Blob([wbout], { type: 'application/octet-stream' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Đặt độ rộng cột
function setCols(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }))
}

const today8 = () => new Date().toISOString().slice(0, 10).replace(/-/g, '')

/**
 * Xuất danh sách phiếu NK hoặc XK ra 1 file Excel
 * @param {object[]} phieuList  — mảng phiếu đã lọc
 * @param {'NK'|'XK'} loai
 * @param {string} ctName       — tên công trình (có thể rỗng)
 * @param {string} dateFrom     — YYYY-MM-DD
 * @param {string} dateTo       — YYYY-MM-DD
 */
export async function exportPhieuList({ phieuList = [], loai = 'NK', ctName = '', dateFrom = '', dateTo = '', congTrinhs = [] }) {
  const XLSX = await getXLSX()
  const wb   = XLSX.utils.book_new()

  const title       = loai === 'NK' ? 'DANH SACH PHIEU NHAP KHO' : 'DANH SACH PHIEU XUAT KHO'
  const doiTacLabel = loai === 'NK' ? 'Nha cung cap' : 'Nguoi nhan'
  const ctMap       = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const tongTien = phieuList.reduce((s, p) => s + (p.tong_tien || 0), 0)

  const rows = [
    [title],
    [`Cong trinh: ${ctName || 'Tat ca cong trinh'}`],
    [`Thoi gian: ${dateFrom || '...'} den ${dateTo || '...'}`],
    [`Xuat ngay: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['#', 'So phieu', 'Ngay', 'Cong trinh', doiTacLabel, 'Ghi chu', 'Tong tien (VND)'],
    ...phieuList.map((p, i) => [
      i + 1,
      p.so_phieu || '',
      p.ngay || '',
      ctMap[p.cong_trinh_id] || '',
      p.doi_tac || '',
      p.ghi_chu  || '',
      p.tong_tien || 0,
    ]),
    [],
    ['', '', '', '', '', 'TONG CONG:', tongTien],
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  setCols(ws, [4, 22, 12, 28, 25, 22, 18])

  const sheetName = loai === 'NK' ? 'Nhap Kho' : 'Xuat Kho'
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const ctSlug  = ctName ? ctName.replace(/\s+/g, '_').slice(0, 20) : 'TatCa'
  const filename = `${loai === 'NK' ? 'NhapKho' : 'XuatKho'}_${ctSlug}_${today8()}.xlsx`
  triggerDownload(wb, filename)
}

/**
 * Xuất báo cáo tổng hợp: 3 sheet NK / XK / Tồn kho
 */
export async function exportBaoCaoTongHop({
  nkList    = [],
  xkList    = [],
  tonKhoList = [],
  ctName    = '',
  dateFrom  = '',
  dateTo    = '',
  congTrinhs = [],
}) {
  const XLSX = await getXLSX()
  const wb   = XLSX.utils.book_new()
  const ctMap = Object.fromEntries((congTrinhs || []).map(ct => [ct.id, ct.ten_ct]))

  const info = `Cong trinh: ${ctName || 'Tat ca'}  |  Tu: ${dateFrom} — Den: ${dateTo}`

  // ── Sheet 1: Nhap Kho ────────────────────────────────────────
  const nkTong = nkList.reduce((s, p) => s + (p.tong_tien || 0), 0)
  const wsNK = XLSX.utils.aoa_to_sheet([
    ['BAO CAO NHAP KHO'],
    [info],
    [`Xuat ngay: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['#', 'So phieu', 'Ngay', 'Cong trinh', 'Nha cung cap', 'Ghi chu', 'Tong tien (VND)'],
    ...nkList.map((p, i) => [i+1, p.so_phieu||'', p.ngay||'', ctMap[p.cong_trinh_id]||'', p.doi_tac||'', p.ghi_chu||'', p.tong_tien||0]),
    [],
    ['', '', '', '', '', 'TONG NHAP:', nkTong],
  ])
  setCols(wsNK, [4, 22, 12, 28, 25, 22, 18])
  XLSX.utils.book_append_sheet(wb, wsNK, 'Nhap Kho')

  // ── Sheet 2: Xuat Kho ────────────────────────────────────────
  const xkTong = xkList.reduce((s, p) => s + (p.tong_tien || 0), 0)
  const wsXK = XLSX.utils.aoa_to_sheet([
    ['BAO CAO XUAT KHO'],
    [info],
    [`Xuat ngay: ${new Date().toLocaleDateString('vi-VN')}`],
    [],
    ['#', 'So phieu', 'Ngay', 'Cong trinh', 'Nguoi nhan', 'Ghi chu', 'Tong tien (VND)'],
    ...xkList.map((p, i) => [i+1, p.so_phieu||'', p.ngay||'', ctMap[p.cong_trinh_id]||'', p.doi_tac||'', p.ghi_chu||'', p.tong_tien||0]),
    [],
    ['', '', '', '', '', 'TONG XUAT:', xkTong],
  ])
  setCols(wsXK, [4, 22, 12, 28, 25, 22, 18])
  XLSX.utils.book_append_sheet(wb, wsXK, 'Xuat Kho')

  // ── Sheet 3: Ton Kho ─────────────────────────────────────────
  if (tonKhoList.length > 0) {
    const wsTK = XLSX.utils.aoa_to_sheet([
      ['TON KHO HIEN TAI'],
      [`Cong trinh: ${ctName || 'Tat ca'}  |  Cap nhat: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      ['#', 'Ma hang', 'Ten hang', 'DVT', 'Ton dau', 'Tong NK', 'Tong XK', 'Ton cuoi'],
      ...tonKhoList.map((t, i) => [
        i+1,
        t.ma_hang || '',
        t.ten_hang || '',
        t.dvt || '',
        t.ton_dau || 0,
        t.tong_nk || 0,
        t.tong_xk || 0,
        t.ton_cuoi || 0,
      ]),
    ])
    setCols(wsTK, [4, 14, 38, 8, 10, 10, 10, 12])
    XLSX.utils.book_append_sheet(wb, wsTK, 'Ton Kho')
  }

  const ctSlug  = ctName ? ctName.replace(/\s+/g, '_').slice(0, 20) : 'TatCa'
  triggerDownload(wb, `BaoCaoTongHop_${ctSlug}_${today8()}.xlsx`)
}
