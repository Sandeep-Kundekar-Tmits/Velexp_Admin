// Detects an ISO date/datetime string (the shape every backend response in
// this app uses, e.g. "2026-10-06" or "2026-10-06T14:30:00") and renders it
// as dd-mm-yyyy (plus the time, if the value carried one) for display. Used
// by screens whose table columns are built dynamically from whatever keys a
// response returns, so a date-shaped field never shows up as a raw ISO
// string -- see DomesticMisReport.jsx / WalletManualCredit.jsx.
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/

export const isIsoDateLike = (value) => typeof value === "string" && ISO_DATE_RE.test(value)

export const formatDisplayDate = (value) => {
    const match = typeof value === "string" ? value.match(ISO_DATE_RE) : null
    if (!match) return value
    const [, year, month, day, hour, minute] = match
    const datePart = `${day}-${month}-${year}`
    return hour !== undefined ? `${datePart} ${hour}:${minute}` : datePart
}
