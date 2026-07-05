/**
 * HangHoaInput — Combobox tìm kiếm danh mục hàng hóa
 * - Tìm từ 2 ký tự trở lên (Mã hàng + Tên hàng)
 * - Không phân biệt hoa/thường, có dấu hoặc không dấu
 * - Điều hướng bàn phím: ↑ ↓ Enter Escape
 * - Tự điền DVT khi chọn
 * - Validate: không cho nhập tên ngoài danh mục (trừ admin)
 * - Dùng React Portal để dropdown không bị clip bởi overflow-hidden
 */
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const normalize = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

const THEMES = {
  blue:   { focus: 'focus:border-blue-400',   highlight: 'bg-blue-50 text-blue-800' },
  green:  { focus: 'focus:border-green-400',  highlight: 'bg-green-50 text-green-800' },
  orange: { focus: 'focus:border-orange-400', highlight: 'bg-orange-50 text-orange-800' },
}

export default function HangHoaInput({
  value = '',
  onChange,      // (val: string) => void  — cập nhật text thô
  onSelect,      // (hh: {ma_hang, ten_hang, dvt, ...}) => void  — chọn từ dropdown
  hangHoaList = [],
  placeholder = 'Tên vật tư...',
  theme = 'blue',
  isAdmin = false,
  inputCls = '',
}) {
  const [inputVal, setInputVal] = useState(value)
  const [open, setOpen]         = useState(false)
  const [highlight, setHL]      = useState(0)
  const [error, setError]       = useState(false)
  const [dropRect, setDropRect] = useState(null)
  const inputRef = useRef()
  const listRef  = useRef()
  const t = THEMES[theme] || THEMES.blue

  // Sync khi parent đổi value (ví dụ AI điền form)
  useEffect(() => {
    setInputVal(value)
    setError(false)
  }, [value])

  const getMatches = (kw) => {
    if (!kw || kw.length < 2) return []
    const q = normalize(kw)
    return hangHoaList
      .filter(h => normalize(h.ten_hang).includes(q) || (h.ma_hang || '').toLowerCase().includes(q))
      .slice(0, 30)
  }

  const matches = getMatches(inputVal)

  // Tính vị trí dropdown (fixed so thoát overflow-hidden)
  const updateDropRect = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom + 2, left: r.left, width: r.width })
    }
  }

  useEffect(() => {
    if (open) updateDropRect()
  }, [open])

  // Cuộn item được highlight vào view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  const doSelect = (hh) => {
    setInputVal(hh.ten_hang)
    setError(false)
    setOpen(false)
    onChange?.(hh.ten_hang)
    onSelect?.(hh)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setInputVal(val)
    setHL(0)
    setError(false)
    onChange?.(val)
    if (val.length >= 2) {
      updateDropRect()
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const handleFocus = () => {
    if (inputVal.length >= 2) {
      updateDropRect()
      setOpen(true)
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      const trimmed = inputVal.trim()
      if (!trimmed) { setError(false); return }
      if (hangHoaList.length === 0) { setError(false); return }  // list chưa tải, không validate
      const match = hangHoaList.find(h => normalize(h.ten_hang) === normalize(trimmed))
      if (!match) {
        setError(true)
      } else {
        setError(false)
        onSelect?.(match)
      }
    }, 200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open && inputVal.length >= 2) { updateDropRect(); setOpen(true); return }
      setHL(h => Math.min(h + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHL(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && matches[highlight]) {
        e.preventDefault()
        doSelect(matches[highlight])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const dropdownContent = open && dropRect ? (
    matches.length > 0 ? (
      <div
        ref={listRef}
        style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width, zIndex: 99999 }}
        className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto"
      >
        {matches.map((hh, j) => (
          <div
            key={hh.ma_hang || j}
            data-idx={j}
            onMouseDown={() => doSelect(hh)}
            className={`px-3 py-2 cursor-pointer text-xs flex items-center gap-2 border-b border-gray-50 last:border-0 ${
              j === highlight ? t.highlight : 'hover:bg-gray-50'
            }`}
          >
            <span className="font-mono text-gray-400 shrink-0 w-[72px] truncate">{hh.ma_hang}</span>
            <span className="text-gray-800 flex-1 truncate font-medium">{hh.ten_hang}</span>
            <span className="text-gray-400 shrink-0 text-[10px]">{hh.dvt}</span>
          </div>
        ))}
        <div className="px-3 py-1.5 text-[10px] text-gray-300 italic border-t">
          ↑↓ di chuyển · Enter chọn · Esc đóng
        </div>
      </div>
    ) : inputVal.length >= 2 ? (
      <div
        style={{ position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width, zIndex: 99999 }}
        className="bg-white border border-gray-200 rounded-lg shadow p-2.5"
      >
        {hangHoaList.length === 0
          ? <p className="text-xs text-orange-500">⏳ Đang tải danh mục...</p>
          : <p className="text-xs text-gray-400 italic">Không tìm thấy — thử gõ không dấu</p>
        }
      </div>
    ) : null
  ) : null

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={inputVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full border rounded px-2 py-1.5 text-xs focus:outline-none transition-colors ${
          error
            ? 'border-red-400 bg-red-50 focus:border-red-400'
            : `border-gray-200 ${t.focus}`
        } ${inputCls}`}
      />
      {error && (
        <p className="absolute text-red-500 text-[10px] mt-0.5 leading-tight whitespace-nowrap z-10">
          {isAdmin ? '⚠ Không có trong danh mục' : '✗ Vui lòng chọn từ danh mục'}
        </p>
      )}
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  )
}
