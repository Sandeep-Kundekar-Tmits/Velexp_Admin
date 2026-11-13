// Shared bits of the Customer Onboarding wizard.
import { authFetch } from "@/lib/http"

// JSON call that always resolves { ok, status, data }, so the callers can react to the exact status code
// (go-live answers 400 / 409 / 500 / 502 differently). A body that is not JSON comes back as text.
export const callApi = async (url, { method = "GET", body } = {}) => {
    try {
        const res = await authFetch(url, {
            method,
            credentials: "include",
            ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
        })
        const text = await res.text()
        let data = null
        try { data = text ? JSON.parse(text) : null } catch { data = text }
        return { ok: res.ok, status: res.status, data }
    } catch {
        return { ok: false, status: 0, data: null }
    }
}

// The wizard's left rail. `check` is the matching checklist step key (Setup source, Complete have none).
export const RAIL = [
    { key: "account", title: "Account details", short: "Account", check: "account" },
    { key: "documents", title: "Documents", short: "Documents", check: "documents" },
    { key: "source", title: "Setup source", short: "Source" },
    { key: "pincodes", title: "Pincodes / serviceability", short: "Pincodes", check: "pincodes" },
    { key: "rates", title: "Rates", short: "Rates", check: "rates" },
    { key: "product_config", title: "Product config", short: "Config", check: "product_config" },
    { key: "vas", title: "VAS (optional)", short: "VAS", check: "vas" },
    { key: "invoice_config", title: "Invoice config (optional)", short: "Invoice", check: "invoice_config" },
    { key: "payment", title: "Payment mode", short: "Payment", check: "payment" },
    { key: "review", title: "Review", short: "Review", check: "verification" },
    { key: "complete", title: "Complete & send credentials", short: "Go live" },
]

// After go-live the customer page: the same rail, plus these.
export const MANAGE_RAIL = [
    { key: "credentials", title: "Resend credentials", short: "Resend credentials" },
    { key: "history", title: "Email history", short: "Email history" },
    { key: "logins", title: "Logins / Add login", short: "Logins" },
    { key: "reset", title: "Reset to default", short: "Reset to default" },
]

// checklist.current_step -> a rail key
export const railKeyOf = (current) => {
    if (current === "verification") return "review"
    if (current === "go_live") return "complete"
    return RAIL.some((r) => r.key === current) ? current : "account"
}

// step status / check state -> colour
export const STEP_COLOR = { done: "#16a34a", attention: "#f59d0e", blocked: "#e51b2b", optional: "#94a3b8" }
export const STATUS_LABEL = { done: "Done", blocked: "Blocked", attention: "Needs attention", optional: "Optional" }
// Which Edit-customer fields a step's failing checks point at, found from the check's code and text, so the form
// can highlight them. Order matters: the first matching rule wins for a check.
const FIELD_RULES = [
    [/finance[ _]?e?mail/, ["finance_emails"]],
    [/gst/, ["gst_no"]],
    [/\bpan\b/, ["pan_no"]],
    [/e-?mail/, ["email"]],
    [/phone|mobile|contact/, ["phone"]],
    [/pincode|pin code|postal/, ["pincode"]],
    [/address/, ["address", "city", "pincode"]],
    [/\bcity\b/, ["city"]],
    [/first[ _]?name/, ["first_name"]],
    [/last[ _]?name/, ["last_name"]],
    [/user ?name|login/, ["username"]],
    [/billing/, ["billing_type"]],
    [/kyc/, ["kyc_document"]],
    [/agreement/, ["customer_agreement_doc"]],
    [/industry/, ["industry"]],
    [/soft[ _]?limit|credit/, ["soft_limit"]],
    [/sales[ _]?head/, ["sales_head"]],
    [/emp(loyee)?[ _]?code/, ["emp_code"]],
]
export const highlightOf = (step) => {
    const fields = new Set()
    let color = CHECK_COLOR_WARN
    ;(step?.checks || []).forEach((c) => {
        if (c.state !== "blocker" && c.state !== "warning") return
        // billing addresses, MIS and customer service have their own sections, not a field of the Edit form
        if (ACCOUNT_CODES.includes(c.code)) return
        const text = `${c.code || ""} ${c.detail || ""} ${c.fix || ""}`.toLowerCase()
        const rule = FIELD_RULES.find(([re]) => re.test(text))
        if (!rule) return
        rule[1].forEach((f) => fields.add(f))
        if (c.state === "blocker") color = CHECK_COLOR_BLOCK
    })
    return { fields: [...fields], color }
}
const CHECK_COLOR_BLOCK = "#e51b2b"
const CHECK_COLOR_WARN = "#f59d0e"

export const CHECK_COLOR = { ok: "#16a34a", warning: "#f59d0e", blocker: "#e51b2b", info: "#3b82f6" }

export const PRODUCT_COMPONENTS = [
    { key: "pincodes", label: "Pincodes" },
    { key: "rates", label: "Rates" },
    { key: "config", label: "Config" },
    { key: "vas", label: "VAS" },
]

export const asList = (d) => (Array.isArray(d) ? d : d?.results?.results || d?.results || d?.data || d?.logins || [])

// Checklist rows that belong to the Account step although the server lists them on their own:
// billing addresses, the daily MIS and the customer service user.
const ACCOUNT_CODES = ["billing_addresses", "auto_mis", "customer_service_user"]

// The step of a checklist response for a rail check key. The Account step also carries the extra rows above, wherever
// the server put them, so everything about the account is read in one place.
export const stepFrom = (data, key) => {
    const step = (data?.steps || []).find((x) => x.key === key)
    if (key !== "account") return step
    const have = new Set((step?.checks || []).map((c) => c.code))
    const extra = [...(data?.checks || []), ...(data?.steps || []).flatMap((x) => x.checks || [])]
        .filter((c) => ACCOUNT_CODES.includes(c.code) && !have.has(c.code))
        .filter((c, i, all) => all.findIndex((o) => o.code === c.code) === i)
    if (!step && !extra.length) return undefined
    const checks = [...(step?.checks || []), ...extra]
    // the extra rows never block go-live: a warning on one makes the step "needs attention" at most
    let status = step?.status
    if (extra.some((c) => c.state === "warning") && (!status || status === "done")) status = "attention"
    return { ...(step || { key, title: "Account details", required: true }), status: status || "done", checks }
}
