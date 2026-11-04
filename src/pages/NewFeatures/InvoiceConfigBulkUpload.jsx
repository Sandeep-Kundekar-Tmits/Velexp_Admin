// Invoice Config -> bulk update from Excel.
// Columns: customer name | mode | description. Each customer name is matched against the
// header customer dropdown (same list), checked, shown with a status, and only the rows that
// pass are sent -- one POST per customer, in a loop, to the same invoice-config API.
import { useRef, useState } from "react"
import PropTypes from "prop-types"
import * as XLSX from "xlsx"
import { MdFileDownload, MdUploadFile } from "react-icons/md"
import { Button, Card, CardBody, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BILLING_INVOICE_CONFIG } from "../../api"
import { DEFAULT_PLACEHOLDERS, errText, findProblems } from "./invoiceConfigHelpers"

const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ")
// header -> field, tolerant of "Customer Name", "customer_name", "Invoice Mode" ...
const headerKey = (h) => {
    const k = norm(h).replace(/[^a-z]/g, "")
    if (k === "username" || k === "user" || k === "customerusername" || k === "customername" || k === "customer" || k === "name") return "customer"
    if (k === "mode" || k === "invoicemode" || k === "invoicelinemode" || k === "linemode") return "mode"
    if (k === "description" || k === "singlelinedescription" || k === "desc") return "description"
    return null
}
// "SINGLE", "single line", "SC_WISE", "service centre wise" ... -> SINGLE | SC_WISE | "" | null (unknown)
const parseMode = (v) => {
    const k = String(v ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "")
    if (!k) return ""
    if (k.includes("SINGLE")) return "SINGLE"
    if (k.includes("SC") || k.includes("WISE") || k.includes("CENTER") || k.includes("CENTRE")) return "SC_WISE"
    return null
}

const TOKENS = DEFAULT_PLACEHOLDERS.map((p) => p.token)

const InvoiceConfigBulkUpload = ({ customerOptions, onDone }) => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const fileRef = useRef(null)
    const [rows, setRows] = useState([])
    const [fileName, setFileName] = useState("")
    const [running, setRunning] = useState(false)

    const reset = () => {
        setRows([])
        setFileName("")
        if (fileRef.current) fileRef.current.value = ""
    }

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["username", "mode", "description"],
            ["customer_a_username", "SINGLE", "Courier charges for {month}"],
            ["customer_b_username", "SC_WISE", ""],
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Invoice Config")
        XLSX.writeFile(wb, "invoice_config_template.xlsx")
    }

    const handleFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!customerOptions?.length) {
            ErrorToaster("The customer list is still loading, try again in a moment")
            reset()
            return
        }
        setFileName(file.name)
        try {
            const wb = XLSX.read(await file.arrayBuffer(), { type: "array" })
            const sheet = wb.Sheets[wb.SheetNames[0]]
            const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" })
            if (!raw.length) { ErrorToaster("The Excel file has no data rows"); reset(); return }

            // map whatever the headers are called onto customer / mode / description
            const fields = {}
            Object.keys(raw[0]).forEach((h) => { const f = headerKey(h); if (f && !fields[f]) fields[f] = h })
            if (!fields.customer) { ErrorToaster("Missing column: username"); reset(); return }
            if (!fields.mode && !fields.description) { ErrorToaster("Missing columns: add mode and/or description"); reset(); return }

            // username is the key (unique). Names and the "Name - username" label are a fallback
            const byUser = new Map()
            const byName = new Map()
            customerOptions.forEach((o) => {
                if (o.username) {
                    const u = norm(o.username)
                    const list = byUser.get(u) || []
                    if (!list.some((x) => x.id === o.id)) list.push(o)
                    byUser.set(u, list)
                }
                ;[o.value, o.label, o.name].forEach((key) => {
                    const k = norm(key)
                    if (!k) return
                    const list = byName.get(k) || []
                    if (!list.some((x) => x.id === o.id)) list.push(o)
                    byName.set(k, list)
                })
            })

            const seen = new Set()
            const parsed = raw.map((r, i) => {
                const name = String(r[fields.customer] ?? "").trim()
                const modeRaw = fields.mode ? r[fields.mode] : ""
                const description = fields.description ? String(r[fields.description] ?? "").trim() : ""
                const mode = parseMode(modeRaw)
                const row = { line: i + 2, sl: i + 1, name, mode, modeRaw: String(modeRaw ?? "").trim(), description, ids: [], error: "", result: "" }

                if (!name) { row.error = "Customer name is empty"; return row }
                const matches = byUser.get(norm(name)) || byName.get(norm(name)) || []
                if (matches.length === 0) row.error = "Username not found"
                else row.ids = matches.map((m) => m.id) // several customers can share a username: all are updated
                if (row.error) return row

                if (mode === null) row.error = `Unknown mode "${row.modeRaw}" (use SINGLE or SC_WISE)`
                else if (!mode && !description) row.error = "Nothing to update (mode and description are empty)"
                else if (description && findProblems(description, TOKENS).length) row.error = `Invalid placeholder: ${findProblems(description, TOKENS).join(", ")}`
                else if (row.ids.some((id) => seen.has(id))) row.error = "Customer appears more than once in the file"
                if (!row.error) row.ids.forEach((id) => seen.add(id))
                return row
            })
            setRows(parsed)

            const missing = parsed.filter((r) => r.error === "Username not found").map((r) => r.name)
            const badRows = parsed.filter((r) => r.error && r.error !== "Username not found")
            const bad = badRows.length
            if (missing.length) ErrorToaster(`${missing.length} username(s) not found: ${[...new Set(missing)].slice(0, 8).join(", ")}${missing.length > 8 ? "..." : ""}`)
            if (bad) ErrorToaster(`${bad} row(s) have problems: ${badRows.slice(0, 3).map((r) => `#${r.sl} (${r.name || "empty"}) - ${r.error}`).join("; ")}${bad > 3 ? "..." : ""}`)
            const ok = parsed.length - missing.length - bad
            if (ok > 0) SuccessToaster(`${ok} row(s) ready to update`)
        } catch (err) {
            ErrorToaster(err?.message || "Could not read the Excel file")
            reset()
        }
    }

    const ready = rows.filter((r) => !r.error && !r.result)
    const readyCustomers = ready.reduce((n, r) => n + r.ids.length, 0)

    const handleUpdate = async () => {
        if (!ready.length) return
        setRunning(true)
        let done = 0
        let failed = 0
        for (const r of ready) {
            // one POST per matched customer
            let okCount = 0
            const errors = []
            for (const id of r.ids) {
                try {
                    const body = { customer_id: id }
                    if (r.mode) body.invoice_line_mode = r.mode
                    if (r.description) body.single_line_description = r.description
                    const { ok, data } = await rawRequest(BILLING_INVOICE_CONFIG, { method: "POST", body })
                    if (ok) okCount += 1
                    else errors.push(errText(data, "Update failed"))
                } catch (err) {
                    errors.push(err?.message || "Update failed")
                }
            }
            done += okCount
            failed += errors.length
            if (errors.length === 0) { r.result = r.ids.length > 1 ? `Updated ${okCount} customers` : "Updated"; r.error = "" }
            else r.error = `${okCount ? `${okCount} of ${r.ids.length} updated; ` : ""}${[...new Set(errors)].join(", ")}`
            setRows((prev) => [...prev]) // show progress row by row
        }
        setRunning(false)
        if (done) SuccessToaster(`${done} customer(s) updated`)
        if (failed) ErrorToaster(`${failed} customer(s) failed, see the status column`)
        onDone?.()
    }

    const errCount = rows.filter((r) => r.error).length
    const doneCount = rows.filter((r) => r.result).length

    return (
        <Card className="mb-3">
            <CardBody className="p-3">
                {/* one compact row: what it is on the left, the controls on the right */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 mr-auto">
                        <div className="flex items-center gap-2">
                            <MdUploadFile size={20} className="text-brand-500" />
                            <h6 className="font-bold mb-0">Bulk update from Excel</h6>
                        </div>
                        <p className="text-xs text-ink-muted mb-0 mt-1">
                            Columns <code>username</code> · <code>mode</code> (SINGLE / SC_WISE) · <code>description</code>.
                            Usernames are checked against the header customer list.
                        </p>
                    </div>

                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} disabled={running} className="hidden" />
                    <div className="flex flex-wrap items-center gap-2">
                        {fileName && <span className="max-w-[220px] truncate text-xs text-ink-muted" title={fileName}>{fileName}</span>}
                        <Button color="link" size="sm" onClick={downloadTemplate} className="flex items-center gap-1" style={{ whiteSpace: "nowrap" }}>
                            <MdFileDownload size={16} /> Template
                        </Button>
                        <Button color="primary" outline onClick={() => fileRef.current?.click()} disabled={running} className="flex items-center gap-1" style={{ whiteSpace: "nowrap" }}>
                            <MdUploadFile size={16} /> {fileName ? "Change file" : "Choose Excel file"}
                        </Button>
                        {rows.length > 0 && (
                            <>
                                <Button color="primary" onClick={handleUpdate} disabled={running || ready.length === 0} style={{ whiteSpace: "nowrap" }}>
                                    {running ? <><Spinner size="sm" /> Updating...</> : `Update ${readyCustomers} customer${readyCustomers === 1 ? "" : "s"}`}
                                </Button>
                                <Button color="secondary" outline onClick={reset} disabled={running}>Clear</Button>
                            </>
                        )}
                    </div>
                </div>

                {rows.length > 0 && (
                    <div className="mt-3">
                        <div className="flex flex-wrap gap-2 mb-2 text-xs">
                            <span className="rounded bg-canvas px-2 py-0.5 border">{rows.length} rows</span>
                            <span className="rounded px-2 py-0.5 border border-brand-500 text-brand-500">{ready.length} ready</span>
                            {doneCount > 0 && <span className="rounded px-2 py-0.5 border border-green-600 text-green-600">{doneCount} updated</span>}
                            {errCount > 0 && <span className="rounded px-2 py-0.5 border border-red-500 text-red-500">{errCount} with problems</span>}
                        </div>
                        <div className="overflow-auto rounded border" style={{ maxHeight: 300 }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left sticky top-0 bg-canvas border-b text-xs uppercase text-ink-muted">
                                        <th className="py-2 px-3 w-14">Sl No</th>
                                        <th className="py-2 px-3">Username</th>
                                        <th className="py-2 px-3">Mode</th>
                                        <th className="py-2 px-3">Description</th>
                                        <th className="py-2 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.line} className="border-b last:border-b-0">
                                            <td className="py-1.5 px-3 text-ink-muted">{r.sl}</td>
                                            <td className="py-1.5 px-3 font-medium">{r.name || "-"}</td>
                                            <td className="py-1.5 px-3 whitespace-nowrap">{r.mode || r.modeRaw || <span className="text-ink-muted">unchanged</span>}</td>
                                            <td className="py-1.5 px-3">{r.description || "-"}</td>
                                            <td className={`py-1.5 px-3 whitespace-nowrap ${r.error ? "text-red-500" : r.result ? "text-green-600" : "text-ink-muted"}`}>
                                                {r.error || r.result || (r.ids.length > 1 ? `Ready (${r.ids.length} customers)` : "Ready")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    )
}

InvoiceConfigBulkUpload.propTypes = {
    customerOptions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        name: PropTypes.string,
        label: PropTypes.string,
        value: PropTypes.string,
    })),
    onDone: PropTypes.func,
}

export default InvoiceConfigBulkUpload
