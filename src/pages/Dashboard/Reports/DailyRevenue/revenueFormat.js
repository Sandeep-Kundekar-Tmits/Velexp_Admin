// Formatting helpers for the Daily Revenue dashboard.

const inr = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
})

const intIN = new Intl.NumberFormat("en-IN")

// ₹1,23,45,678 (no paise — figures are large)
export const formatINR = (n) => inr.format(Number(n) || 0)

// compact Indian currency for chart axes/labels: ₹1.54 Cr, ₹9.02 L, ₹8,500
export const formatINRCompact = (n) => {
    const v = Number(n) || 0
    const abs = Math.abs(v)
    if (abs >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`
    if (abs >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`
    if (abs >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`
    return inr.format(v)
}

// "2026-06-09" -> "09 Jun"
export const shortDate = (iso) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

// "2026-06-09" -> "09 Jun 2026"
export const longDate = (iso) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// previous day as YYYY-MM-DD
export const prevDayISO = (iso) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    d.setDate(d.getDate() - 1)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${dd}`
}

// 14,322
export const formatInt = (n) => intIN.format(Number(n) || 0)

// today's local date as YYYY-MM-DD
export const todayISO = () => {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${dd}`
}

// percentage of a total, guarded against divide-by-zero. Returns a string like "12.4%".
export const pctOfTotal = (part, total) => {
    const t = Number(total) || 0
    if (!t) return "0%"
    return `${((Number(part) || 0) / t * 100).toFixed(1)}%`
}

// width % for a CSS bar, scaled to the max value in its set
export const barWidth = (value, max) => {
    const m = Number(max) || 0
    if (!m) return 0
    return Math.max(0, Math.min(100, (Number(value) || 0) / m * 100))
}

// pretty-print the as_of ISO timestamp -> "22-06-2026 12:46:06"
export const formatAsOf = (iso) => {
    if (!iso) return "—"
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mi = String(d.getMinutes()).padStart(2, "0")
    const ss = String(d.getSeconds()).padStart(2, "0")
    return `${dd}-${mm}-${d.getFullYear()} ${hh}:${mi}:${ss}`
}
