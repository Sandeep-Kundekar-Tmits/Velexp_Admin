// Upload tab: an Excel / CSV with AWB + customer username (or name). The customer is matched to the same
// customer list the dropdowns use and its ID is sent to the transfer API, so the file never carries user IDs.
import { useMemo, useRef, useState } from "react"
import PropTypes from "prop-types"
import * as XLSX from "xlsx"
import { Button, Input, Label, Spinner } from "@/components/ui"
import SimpleModal from "../../../components/SimpleModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { rawRequest } from "@/lib/http"
import { SHIPMENT_TRANSFER } from "../../../api"
import { errText } from "../invoiceConfigHelpers"
import { loadCustomers } from "./customers"
import ResultPanel from "./ResultPanel"
import CustomerSelect from "./CustomerSelect"

const headerKey = (h) => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "")
const AWB_HEADERS = ["awb", "awbno", "awbnumber", "awbs"]
const CUSTOMER_HEADERS = ["username", "tousername", "customer", "customername", "tocustomer", "tocustomername", "touser", "user"]
const norm = (v) => String(v ?? "").trim().toLowerCase()

const UploadForm = ({ onViewLogs }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const fileRef = useRef(null)

    const [file, setFile] = useState(null)
    const [fileRows, setFileRows] = useState([]) // [{ awb, customerText }] as read from the file
    const [customers, setCustomers] = useState([])
    const [parsing, setParsing] = useState(false)
    const [target, setTarget] = useState(null) // optional: one customer for every row
    const [reason, setReason] = useState("")
    const [busy, setBusy] = useState(null)
    const [result, setResult] = useState(null)
    const [confirmOpen, setConfirmOpen] = useState(false)

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["AWB", "USERNAME"],
            ["VIN0012345", "newcustomer_login"],
            ["VIN0012346", "other_login"],
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Shipment Transfer")
        XLSX.writeFile(wb, "shipment_transfer_template.xlsx")
    }

    const handleFile = async (e) => {
        const picked = e.target.files?.[0] || null
        e.target.value = ""
        setResult(null)
        setFile(picked)
        setFileRows([])
        if (!picked) return
        setParsing(true)
        try {
            // customers first, so every row can be matched as soon as the file is read
            const list = await loadCustomers()
            setCustomers(list)
            if (!list.length) ErrorToaster("Could not load the customer list to match against")

            const wb = XLSX.read(await picked.arrayBuffer(), { type: "array" })
            const sheet = wb.Sheets[wb.SheetNames[0]]
            const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" })
            const rows = raw.map((r) => {
                const keyed = {}
                Object.keys(r).forEach((k) => { keyed[headerKey(k)] = r[k] })
                const awbKey = AWB_HEADERS.find((k) => keyed[k] !== undefined)
                const custKey = CUSTOMER_HEADERS.find((k) => keyed[k] !== undefined && String(keyed[k]).trim() !== "")
                return {
                    awb: String(awbKey ? keyed[awbKey] : "").trim(),
                    customerText: String(custKey ? keyed[custKey] : "").trim(),
                }
            }).filter((r) => r.awb || r.customerText)
            if (!rows.length) ErrorToaster("No rows found. The file needs an AWB column and a USERNAME column.")
            setFileRows(rows)
        } catch {
            ErrorToaster("Could not read the file. Use an Excel or CSV with AWB and USERNAME columns.")
        } finally {
            setParsing(false)
        }
    }

    // Match every row to a customer from the list: username first, then customer name.
    const rows = useMemo(() => {
        const byUser = new Map()
        const byName = new Map()
        customers.forEach((c) => {
            if (c.username) byUser.set(norm(c.username), c)
            const n = norm(c.value)
            if (n) byName.set(n, [...(byName.get(n) || []), c])
        })
        const seen = new Set()
        return fileRows.map((r, i) => {
            const base = { sl: i + 1, awb: r.awb, customerText: r.customerText, match: null, status: "", ok: false }
            if (!r.awb) return { ...base, status: "AWB missing" }
            const key = r.awb.toUpperCase()
            if (seen.has(key)) return { ...base, status: "AWB appears more than once in the file" }
            seen.add(key)
            if (target) return { ...base, match: { id: target.value, label: target.label }, status: "Ready", ok: true }
            if (!r.customerText) return { ...base, status: "Customer missing" }
            const u = byUser.get(norm(r.customerText))
            if (u) return { ...base, match: { id: u.id, label: u.label }, status: "Ready", ok: true }
            const named = byName.get(norm(r.customerText)) || []
            if (named.length === 1) return { ...base, match: { id: named[0].id, label: named[0].label }, status: "Ready", ok: true }
            if (named.length > 1) return { ...base, status: "Several customers have this name, use the username" }
            return { ...base, status: "Customer not found in the list" }
        })
    }, [fileRows, customers, target])

    const ready = rows.filter((r) => r.ok)
    const problems = rows.length - ready.length

    const validate = (apply) => {
        if (!file) { ErrorToaster("Choose an Excel or CSV file first"); return false }
        if (!ready.length) { ErrorToaster("No rows are ready to transfer. Check the Status column."); return false }
        if (apply && !reason.trim()) { ErrorToaster("Reason is required to apply the transfer"); return false }
        return true
    }

    const run = async (apply) => {
        if (!validate(apply)) return
        const payload = { rows: ready.map((r) => ({ awb: r.awb, to_user_id: Number(r.match.id) })) }
        if (reason.trim()) payload.reason = reason.trim()
        if (apply) payload.apply = true

        setBusy(apply ? "apply" : "preview")
        try {
            const { ok, data } = await rawRequest(SHIPMENT_TRANSFER, { method: "POST", body: payload })
            if (!ok) {
                ErrorToaster(errText(data, "Request failed"))
                setResult({ data, failed: true })
                return
            }
            setResult({ data, applied: apply })
            if (apply) SucceesToaster(data?.batch_id ? `Transfer applied (batch ${data.batch_id})` : "Transfer applied")
        } catch {
            ErrorToaster("Request failed")
        } finally {
            setBusy(null)
            setConfirmOpen(false)
        }
    }

    const batchId = result?.data?.batch_id
    const resultTitle = result?.failed ? "Request failed" : result?.applied ? "Transfer applied" : "Transfer result"

    return (
        <div>
            <div className="rounded-md border border-white/8 p-2.5">
                <div className="flex max-w-3xl flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <Label className="form-label m-0 font-bold text-ink-muted">Excel / CSV file</Label>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button color="secondary" onClick={() => fileRef.current?.click()} disabled={parsing}>{file ? "Change file" : "Choose file"}</Button>
                            <Button color="secondary" onClick={downloadTemplate}>Template</Button>
                            <span className="text-sm text-ink-muted">{parsing ? "Reading..." : file ? file.name : "No file chosen"}</span>
                        </div>
                        <span className="text-xs text-ink-muted">
                            Columns: <strong>AWB</strong> and <strong>USERNAME</strong> (the customer&apos;s username, or its name). The customer ID is taken from the customer list, not from the file.
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                            <Label className="form-label m-0 font-bold text-ink-muted">Transfer every row to (optional)</Label>
                            <CustomerSelect value={target} onChange={setTarget} placeholder="Leave blank to use the USERNAME column" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="form-label m-0 font-bold text-ink-muted">Reason (required to apply)</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Wrong account" />
                        </div>
                    </div>
                </div>

                {rows.length > 0 && (
                    <div className="mt-3">
                        <div className="mb-1.5 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-ink">Rows: <strong>{rows.length}</strong></span>
                            <span className="rounded-full border border-success-500 px-2.5 py-0.5 font-semibold text-success-500">Ready: {ready.length}</span>
                            {problems > 0 && <span className="rounded-full border border-danger-500 px-2.5 py-0.5 font-semibold text-danger-500">Problems: {problems} (skipped)</span>}
                        </div>
                        <div className="max-h-[34vh] overflow-auto rounded border border-white/8">
                            <table className="w-full whitespace-nowrap text-sm">
                                <thead className="sticky top-0 z-10 bg-surface">
                                    <tr>
                                        {["Sl No", "AWB", "Customer in file", "Matched customer", "Status"].map((h) => (
                                            <th key={h} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={r.sl} className="border-t border-white/8">
                                            <td className="px-2 py-1.5 text-ink-muted">{r.sl}</td>
                                            <td className="px-2 py-1.5 font-semibold">{r.awb || "—"}</td>
                                            <td className="px-2 py-1.5">{target ? "(all rows)" : r.customerText || "—"}</td>
                                            <td className="px-2 py-1.5">{r.match ? `${r.match.label} (ID ${r.match.id})` : "—"}</td>
                                            <td className={`px-2 py-1.5 ${r.ok ? "text-success-500" : "text-danger-500"}`}>{r.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button color="primary" onClick={() => { if (validate(true)) setConfirmOpen(true) }} disabled={!!busy || parsing || !ready.length}>
                        {busy === "apply" ? <><Spinner size="sm" /> Applying...</> : `Apply transfer${ready.length ? ` (${ready.length})` : ""}`}
                    </Button>
                    {problems > 0 && <span className="text-xs text-ink-muted">Rows with problems are skipped.</span>}
                </div>
            </div>

            {result && (
                <ResultPanel
                    title={resultTitle}
                    data={result.data}
                    footer={batchId && result.applied ? (
                        <div className="mt-2">
                            <Button color="secondary" size="sm" onClick={() => onViewLogs(String(batchId))}>View logs of this batch</Button>
                        </div>
                    ) : null}
                />
            )}

            <SimpleModal
                isOpen={confirmOpen}
                setIsOpen={setConfirmOpen}
                onCancel={() => setConfirmOpen(false)}
                successButtonName={busy === "apply" ? "Transferring..." : "Transfer"}
                onSuccess={() => run(true)}
            >
                <p className="m-0 font-semibold text-danger-500">
                    Transfer {ready.length} shipment(s) from {file?.name}{target ? ` to ${target.label}` : ""}
                    {problems ? `, skipping ${problems} row(s) with problems` : ""}
                    ? This writes to the database.
                </p>
            </SimpleModal>
        </div>
    )
}

UploadForm.propTypes = { onViewLogs: PropTypes.func.isRequired }

export default UploadForm
