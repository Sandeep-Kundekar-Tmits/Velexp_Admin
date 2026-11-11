// Shows a Shipment Transfer API response: plain values as chips, any list as a table, otherwise the raw JSON.
import PropTypes from "prop-types"
import { cellText, columnsOf, extractList, humanize, isTransferResponse, scalarEntries, toneOf } from "./helpers"
import TransferResult from "./TransferResult"

const MAX_ROWS = 1000

const ResultPanel = ({ title, data, footer = null, plain = false }) => {
    if (data === null || data === undefined) return null

    // preview / apply responses get the purpose-built view; logs and anything unexpected use the generic table
    // `plain` skips that view (other screens, e.g. Darkstore Conversion, reuse this panel for their own responses)
    if (!plain && isTransferResponse(data)) return <TransferResult title={title} data={data} footer={footer} />

    const list = extractList(data)
    const chips = scalarEntries(data)
    // { summary: { CONVERTIBLE: 3, NOT_FOUND: 1 } } -> one coloured chip per outcome
    const summary = data && typeof data.summary === "object" && !Array.isArray(data.summary) && data.summary ? Object.entries(data.summary) : []
    const columns = list ? columnsOf(list) : []
    const primitiveRows = list && columns.length === 0
    const shown = list ? list.slice(0, MAX_ROWS) : []

    return (
        <div className="mt-3 rounded-md border border-white/8 p-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{title}</span>
                {list && <span className="text-xs text-ink-muted">{list.length} row(s){list.length > MAX_ROWS ? `, first ${MAX_ROWS} shown` : ""}</span>}
            </div>

            {chips.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {chips.map(([k, v]) => (
                        <span
                            key={k}
                            className={`rounded-full border px-2.5 py-0.5 text-xs ${k === "batch_id" ? "border-brand-500 font-bold text-brand-500" : "border-white/15 text-ink"}`}
                        >
                            <span className="text-ink-muted">{humanize(k)}:</span> <strong>{cellText(v)}</strong>
                        </span>
                    ))}
                </div>
            )}

            {summary.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                    {summary.map(([code, n]) => (
                        <span key={code} className={`rounded-full border border-current px-2.5 py-0.5 text-xs font-semibold ${toneOf("result", code)}`}>
                            {humanize(String(code).toLowerCase())}: {cellText(n)}
                        </span>
                    ))}
                </div>
            )}

            {list && list.length > 0 && (
                <div className="max-h-[46vh] overflow-auto rounded border border-white/8">
                    <table className="w-full whitespace-nowrap text-sm">
                        <thead className="sticky top-0 z-10 bg-surface">
                            <tr>
                                <th className="px-2 py-1.5 text-left font-semibold text-ink-muted">#</th>
                                {primitiveRows
                                    ? <th className="px-2 py-1.5 text-left font-semibold text-ink-muted">Value</th>
                                    : columns.map((c) => <th key={c} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{humanize(c)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((row, i) => (
                                <tr key={i} className="border-t border-white/8">
                                    <td className="px-2 py-1.5 text-ink-muted">{i + 1}</td>
                                    {primitiveRows
                                        ? <td className="px-2 py-1.5">{cellText(row)}</td>
                                        : columns.map((c) => (
                                            <td key={c} className={`px-2 py-1.5 ${toneOf(c, row?.[c])}`}>{cellText(row?.[c])}</td>
                                        ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {list && list.length === 0 && <p className="m-0 text-sm text-ink-muted">Nothing returned.</p>}

            {!list && chips.length === 0 && (
                <pre className="m-0 max-h-[46vh] overflow-auto text-xs text-ink">{JSON.stringify(data, null, 2)}</pre>
            )}

            {footer}
        </div>
    )
}

ResultPanel.propTypes = {
    title: PropTypes.string.isRequired,
    data: PropTypes.any,
    footer: PropTypes.node,
    plain: PropTypes.bool,
}

export default ResultPanel
