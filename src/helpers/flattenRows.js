// One export row per record: plain values stay, true/false become Yes/No, lists and objects become readable text.
// Column titles are the field names made readable (customer_name -> Customer Name).
const title = (k) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const cell = (v) => {
    if (v == null) return ""
    if (typeof v === "boolean") return v ? "Yes" : "No"
    if (Array.isArray(v)) return v.map((x) => (x && typeof x === "object" ? x.product_name || x.name || JSON.stringify(x) : x)).join(", ")
    if (typeof v === "object") return JSON.stringify(v)
    return v
}

export const flattenRows = (rows) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [title(k), cell(v)])))
