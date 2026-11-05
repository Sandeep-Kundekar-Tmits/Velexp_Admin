// Shipment-transfer preview / apply response:
// { status, mode, batch_id, awbs_received, summary: { CODE: n }, results: [ { awb, from_*, to_*, result, shipments: [...],
//   linked_with_other_owner: [...] } ], note }
import { Fragment, useState } from "react"
import PropTypes from "prop-types"
import { cellText, humanize } from "./helpers"

const money = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : cellText(v)
}

const sum = (list, pick) => list.reduce((t, x) => t + (Number(pick(x)) || 0), 0)

// green for the happy path, red for blocked / failed, amber for anything else
const toneClass = (code) => {
    const c = String(code || "").toUpperCase()
    if (/NOT_FOUND|ERROR|FAIL|BLOCK|INVALID|REJECT|DENIED|SKIP|CANNOT|SAME|ALREADY|LINKED/.test(c)) return "text-danger-500"
    if (/WILL_TRANSFER|TRANSFERRED|APPLIED|SUCCESS|OK/.test(c)) return "text-success-500"
    return "text-warning-500"
}

const badge = (code) => (
    <span className={`rounded-full border border-current px-2 py-0.5 text-xs font-semibold ${toneClass(code)}`}>{humanize(String(code || "").toLowerCase())}</span>
)

const billingText = (b) => {
    if (!b) return "—"
    const parts = [`₹${money(b.final_amount)}`, b.is_billed ? "billed" : "unbilled"]
    if (b.invoice) parts.push(`invoice ${cellText(b.invoice)}`)
    if (b.version !== undefined && b.version !== null) parts.push(`v${b.version}`)
    return parts.join(" · ")
}

const TransferResult = ({ data, title, footer = null }) => {
    const [open, setOpen] = useState({})
    const rows = data.results
    const summary = data.summary && typeof data.summary === "object" ? Object.entries(data.summary) : []
    const dry = /DRY/i.test(String(data.mode || ""))

    return (
        <div className="mt-3 rounded-md border border-white/8 p-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{title}</span>
                <span className="text-xs text-ink-muted">{rows.length} AWB(s)</span>
            </div>

            <div className="mb-2 flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full border px-2.5 py-0.5 font-bold ${dry ? "border-warning-500 text-warning-500" : "border-success-500 text-success-500"}`}>
                    {dry ? "Dry run - nothing saved" : humanize(String(data.mode || "applied").toLowerCase())}
                </span>
                {data.batch_id !== null && data.batch_id !== undefined && (
                    <span className="rounded-full border border-brand-500 px-2.5 py-0.5 font-bold text-brand-500">Batch: {cellText(data.batch_id)}</span>
                )}
                {data.awbs_received !== undefined && (
                    <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-ink">
                        <span className="text-ink-muted">Received:</span> <strong>{cellText(data.awbs_received)}</strong>
                    </span>
                )}
                {summary.map(([code, n]) => (
                    <span key={code} className={`rounded-full border border-current px-2.5 py-0.5 font-semibold ${toneClass(code)}`}>
                        {humanize(code.toLowerCase())}: {cellText(n)}
                    </span>
                ))}
            </div>

            {data.note && <p className="mb-2 text-xs text-ink-muted">{data.note}</p>}

            <div className="max-h-[52vh] overflow-auto rounded border border-white/8">
                <table className="w-full whitespace-nowrap text-sm">
                    <thead className="sticky top-0 z-10 bg-surface">
                        <tr>
                            {["", "AWB", "From customer", "To customer", "Result", "Shipments", "New amount (₹)", "Wallet moved (₹)", "Warnings"].map((h) => (
                                <th key={h} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => {
                            const ships = Array.isArray(r.shipments) ? r.shipments : []
                            const linked = Array.isArray(r.linked_with_other_owner) ? r.linked_with_other_owner : []
                            const extra = sum(ships, (s) => s.billed_extra_charges_left_on_old_invoice)
                            const warnings = [
                                linked.length ? `${linked.length} linked with another owner` : "",
                                extra ? `${extra} billed extra charge(s) stay on the old invoice` : "",
                            ].filter(Boolean)
                            const isOpen = !!open[i]
                            return (
                                <Fragment key={`${r.awb}-${i}`}>
                                    <tr className="border-t border-white/8">
                                        <td className="px-2 py-1.5">
                                            {ships.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="text-ink-muted"
                                                    title={isOpen ? "Hide shipments" : "Show shipments"}
                                                    onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))}
                                                >
                                                    {isOpen ? "▾" : "▸"}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-2 py-1.5 font-semibold">{r.awb}</td>
                                        <td className="px-2 py-1.5">{r.from_customer ? `${r.from_customer} (ID ${cellText(r.from_user_id)})` : "—"}</td>
                                        <td className="px-2 py-1.5">{r.to_customer ? `${r.to_customer} (ID ${cellText(r.to_user_id)})` : "—"}</td>
                                        <td className="px-2 py-1.5">{badge(r.result)}</td>
                                        <td className="px-2 py-1.5">{ships.length}</td>
                                        <td className="px-2 py-1.5 text-right">{ships.length ? money(sum(ships, (s) => s.billing_after?.final_amount)) : "—"}</td>
                                        <td className="px-2 py-1.5 text-right">{ships.length ? money(sum(ships, (s) => s.wallet_moved)) : "—"}</td>
                                        <td className={`px-2 py-1.5 ${warnings.length ? "text-warning-500" : ""}`}>{warnings.length ? warnings.join("; ") : "—"}</td>
                                    </tr>
                                    {isOpen && (
                                        <tr className="border-t border-white/8">
                                            <td />
                                            <td colSpan={8} className="px-2 pb-2">
                                                <table className="w-full whitespace-nowrap text-xs">
                                                    <thead>
                                                        <tr>
                                                            {["AWB", "Type", "Booking ID", "Billing before", "Billing after", "Note", "Wallet moved (₹)"].map((h) => (
                                                                <th key={h} className="px-2 py-1 text-left font-semibold text-ink-muted">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ships.map((s, j) => (
                                                            <tr key={`${s.awbno}-${j}`} className="border-t border-white/8">
                                                                <td className="px-2 py-1">{cellText(s.awbno)}</td>
                                                                <td className="px-2 py-1">{cellText(s.multipiece_type)}</td>
                                                                <td className="px-2 py-1">{cellText(s.booking_id)}</td>
                                                                <td className="px-2 py-1">{billingText(s.billing_before)}</td>
                                                                <td className="px-2 py-1">{billingText(s.billing_after)}</td>
                                                                <td className="px-2 py-1">{cellText(s.billing_note)}</td>
                                                                <td className="px-2 py-1 text-right">{money(s.wallet_moved)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {linked.length > 0 && (
                                                    <p className="mb-0 mt-1 text-xs text-warning-500">Linked with another owner: {linked.map((l) => (typeof l === "object" ? JSON.stringify(l) : String(l))).join(", ")}</p>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {footer}
        </div>
    )
}

TransferResult.propTypes = {
    data: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
    footer: PropTypes.node,
}

export default TransferResult
