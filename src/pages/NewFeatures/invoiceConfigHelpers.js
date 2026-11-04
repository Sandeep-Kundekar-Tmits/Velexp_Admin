// Shared by the Invoice Config tab and its bulk upload.

// Used until the server sends its own `placeholders` list with the config
export const DEFAULT_PLACEHOLDERS = [
    { token: "{month}", example: "Sep 26", description: "Billing month, short (Sep 26 - Oct 26 if the period covers more than one month)" },
    { token: "{month_full}", example: "September 2026", description: "Billing month, full name (September 2026 - October 2026 across months)" },
    { token: "{from_date}", example: "01-09-2026", description: "Billing period start date" },
    { token: "{to_date}", example: "30-09-2026", description: "Billing period end date" },
]
export const DEFAULT_NOTE = "Placeholders are filled from each invoice's billing period. If the text has no placeholder, ' for the period <from_date> to <to_date>' is added at the end. Blank text = 'Courier Services'."

// Anything in { } that is not a known token, or a stray brace, is a typo
export const findProblems = (text, tokens) => {
    const problems = []
    const found = text.match(/\{[^{}]*\}/g) || []
    found.forEach((t) => { if (!tokens.includes(t) && !problems.includes(t)) problems.push(t) })
    const stripped = text.replace(/\{[^{}]*\}/g, "")
    if (/[{}]/.test(stripped)) problems.push("unmatched { or }")
    return problems
}

// error bodies can be {error|msg|detail|message}, a bare list, or field errors
export const errText = (d, fallback) => {
    if (!d) return fallback
    if (typeof d === "string") return d
    if (Array.isArray(d)) return d.filter(Boolean).join(", ") || fallback
    return d.error || d.msg || d.detail || d.message
        || Object.values(d).flat().filter((v) => typeof v === "string").join(", ")
        || fallback
}

