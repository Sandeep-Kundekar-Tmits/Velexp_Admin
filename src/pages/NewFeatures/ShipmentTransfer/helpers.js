// Shared helpers for the Shipment Transfer page.

// AWBs can be typed one per line, or separated by commas / spaces / semicolons.
export const parseAwbs = (text) => {
    const seen = new Set()
    const out = []
    String(text || "")
        .split(/[\s,;]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
            const key = t.toUpperCase()
            if (!seen.has(key)) { seen.add(key); out.push(t) }
        })
    return out
}

// A customer is typed as either a numeric user id or a username; the API takes them as different fields.
export const targetField = (value) => {
    const v = String(value || "").trim()
    if (!v) return {}
    return /^\d+$/.test(v) ? { to_user_id: Number(v) } : { to_username: v }
}

// "AWB, customer" per line (comma, tab or spaces between). Returns the rows and the lines that could not be read.
export const parseRows = (text) => {
    const rows = []
    const bad = []
    const seen = new Set()
    String(text || "").split(/\r?\n/).forEach((raw) => {
        const line = raw.trim()
        if (!line) return
        const parts = line.split(/[,\t;]+|\s+/).map((p) => p.trim()).filter(Boolean)
        if (parts.length < 2) { bad.push(`${line} (needs an AWB and a customer)`); return }
        const key = parts[0].toUpperCase()
        if (seen.has(key)) { bad.push(`${parts[0]} (listed twice)`); return }
        seen.add(key)
        rows.push({ awb: parts[0], ...targetField(parts[1]) })
    })
    return { rows, bad }
}

const LIST_KEYS = ["results", "rows", "items", "preview", "transfers", "shipments", "awbs", "logs", "records", "data"]

// The preview / apply / logs responses are not documented, so look for the list in the usual places.
export const extractList = (d, depth = 0) => {
    if (Array.isArray(d)) return d
    if (!d || typeof d !== "object" || depth > 2) return null
    for (const k of LIST_KEYS) {
        const v = d[k]
        if (Array.isArray(v)) return v
        if (v && typeof v === "object") {
            const inner = extractList(v, depth + 1)
            if (inner) return inner
        }
    }
    return null
}

// Top-level plain values (counts, batch_id, apply flag ...) shown as chips above the table.
export const scalarEntries = (d) => {
    if (!d || typeof d !== "object" || Array.isArray(d)) return []
    return Object.entries(d).filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
}

export const cellText = (v) => {
    if (v === null || v === undefined || v === "") return "—"
    if (typeof v === "boolean") return v ? "Yes" : "No"
    if (typeof v === "object") return JSON.stringify(v)
    return String(v)
}

export const humanize = (k) => String(k).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export const columnsOf = (rows) => {
    const keys = []
    rows.slice(0, 200).forEach((r) => {
        if (r && typeof r === "object" && !Array.isArray(r)) Object.keys(r).forEach((k) => { if (!keys.includes(k)) keys.push(k) })
    })
    return keys
}

// Colour a status-like cell: red for failures, green for success.
export const toneOf = (key, value) => {
    if (!/^(status|result|outcome|error|errors|message|detail|reason)$/i.test(key)) return ""
    const t = String(value ?? "").toLowerCase()
    if (!t) return ""
    if (/error|fail|invalid|not found|cannot|can't|skip|reject|denied|blocked/.test(t)) return "text-danger-500"
    if (/ok|success|transfer|applied|valid|ready|will/.test(t)) return "text-success-500"
    return ""
}

// Used by ResultPanel to decide whether this view applies.
export const isTransferResponse = (d) =>
    !!d && typeof d === "object" && !Array.isArray(d) && Array.isArray(d.results)
    && d.results.length > 0 && d.results.every((r) => r && typeof r === "object" && "awb" in r && "result" in r)
