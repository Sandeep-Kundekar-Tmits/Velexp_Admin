// Bill Master -> Invoice Config tab: how a customer's invoice lines are laid out.
// SC_WISE = one line per service centre; SINGLE = one line using a description template
// ({month} / {month_full} are filled in by the server).
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import PropTypes from "prop-types"
import { Button, Card, CardBody, Input, Label, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import ConfirmModal from "../../components/Common/ConfirmModal"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BILLING_INVOICE_CONFIG } from "../../api"
import { DEFAULT_PLACEHOLDERS, DEFAULT_NOTE, findProblems, errText } from "./invoiceConfigHelpers"
import InvoiceConfigBulkUpload from "./InvoiceConfigBulkUpload"

const MODES = [
    { value: "SC_WISE", label: "Service-centre wise" },
    { value: "SINGLE", label: "Single line" },
]
const modeLabel = (v) => MODES.find((m) => m.value === v)?.label || v || "-"

// the server may answer with a list, {results: []}, {result: []} or {data: []}
const toList = (d) => {
    if (Array.isArray(d)) return d
    if (!d || typeof d !== "object") return []
    for (const key of ["result", "results", "data", "configs"]) {
        const v = d[key]
        if (Array.isArray(v)) return v
        if (v && typeof v === "object" && v.customer_id != null) return [v]
    }
    return d.customer_id != null ? [d] : []
}

// hideHeader: embedded in the onboarding wizard, so no page padding of its own
const InvoiceConfig = ({ externalCustomer, onCustomerChange, customerOptions, hideHeader = false, onChanged = null }) => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const customerId = externalCustomer?.id

    const [mode, setMode] = useState("SC_WISE")
    const [description, setDescription] = useState("")
    const [isSaved, setIsSaved] = useState(false)
    const [saved, setSaved] = useState({ description: "", preview: "" }) // what the server holds
    const [modes, setModes] = useState(MODES)
    const [placeholders, setPlaceholders] = useState(DEFAULT_PLACEHOLDERS)
    const [note, setNote] = useState(DEFAULT_NOTE)
    const inputRef = useRef(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState(null) // customer id waiting for delete confirmation
    const [deleting, setDeleting] = useState(false)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [list, setList] = useState([])
    const [listLoading, setListLoading] = useState(false)

    // Passes the header's selected customer; with none selected it lists every saved setting
    const loadList = useCallback(async (id) => {
        setListLoading(true)
        try {
            const { ok, data } = await rawRequest(id ? `${BILLING_INVOICE_CONFIG}?customer_id=${id}` : BILLING_INVOICE_CONFIG)
            // for one customer the server answers with a single object (is_saved=false when never saved)
            const rows = !ok ? [] : toList(data)
            setList(Array.isArray(rows) ? rows : [])
        } catch {
            setList([])
        } finally {
            setListLoading(false)
        }
    }, [])

    const loadOne = useCallback(async (id) => {
        setLoading(true)
        try {
            const { ok, data } = await rawRequest(`${BILLING_INVOICE_CONFIG}?customer_id=${id}`)
            if (!ok) { ErrorToaster(errText(data, "Failed to load invoice config")); return }
            const row = Array.isArray(data) ? data[0] : data?.result || data
            const isSavedRow = row?.is_saved !== false // the sample response has no is_saved flag
            setMode(row?.invoice_line_mode || "SC_WISE")
            setDescription(row?.single_line_description || "")
            setIsSaved(isSavedRow)
            setSaved({ description: row?.single_line_description || "", preview: row?.single_line_preview || "" })
            if (Array.isArray(row?.placeholders) && row.placeholders.length) {
                setPlaceholders(row.placeholders.map((p) => ({
                    ...DEFAULT_PLACEHOLDERS.find((d) => d.token === p.token),
                    ...p,
                })))
            }
            if (Array.isArray(row?.line_mode_choices) && row.line_mode_choices.length) setModes(row.line_mode_choices)
            if (row?.placeholder_note) setNote(row.placeholder_note)
        } catch (e) {
            ErrorToaster(e?.message || "Failed to load invoice config")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        loadList(customerId)
        if (customerId) loadOne(customerId)
        else { setMode("SC_WISE"); setDescription(""); setIsSaved(false) }
    }, [customerId, loadOne, loadList])

    const tokens = useMemo(() => placeholders.map((p) => p.token), [placeholders])
    const problems = useMemo(() => findProblems(description, tokens), [description, tokens])

    // What the invoice line will read like, using each token's example value
    const preview = useMemo(() => {
        const text = description.trim()
        // unchanged from what is saved: show the server's own preview (real billing period)
        if (saved.preview && text === saved.description.trim()) return saved.preview
        if (!text) return "Courier Services"
        let out = text
        placeholders.forEach((p) => { out = out.split(p.token).join(p.example) })
        const hasToken = tokens.some((t) => text.includes(t))
        const from = placeholders.find((p) => p.token === "{from_date}")?.example || "01-09-2026"
        const to = placeholders.find((p) => p.token === "{to_date}")?.example || "30-09-2026"
        return hasToken ? out : `${out} for the period ${from} to ${to}`
    }, [description, placeholders, tokens, saved])

    // Insert a token at the caret so it never has to be typed by hand
    const insertToken = (token) => {
        const el = inputRef.current
        const start = el?.selectionStart ?? description.length
        const end = el?.selectionEnd ?? description.length
        setDescription(description.slice(0, start) + token + description.slice(end))
        requestAnimationFrame(() => {
            el?.focus()
            el?.setSelectionRange(start + token.length, start + token.length)
        })
    }

    const handleSave = async () => {
        if (!customerId) return ErrorToaster("Please select a customer first")
        if (mode === "SINGLE" && problems.length) return ErrorToaster(`Fix the description: ${problems.join(", ")}`)
        setSaving(true)
        try {
            const body = { customer_id: customerId, invoice_line_mode: mode }
            if (mode === "SINGLE") body.single_line_description = description.trim()
            const { ok, data } = await rawRequest(BILLING_INVOICE_CONFIG, { method: "POST", body })
            if (!ok) { ErrorToaster(errText(data, "Failed to save invoice config")); return }
            SuccessToaster("Invoice config saved")
            onChanged?.("Invoice config saved")
            setIsSaved(true)
            await loadOne(customerId)
            loadList(customerId)
        } catch (e) {
            ErrorToaster(e?.message || "Failed to save invoice config")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${BILLING_INVOICE_CONFIG}?customer_id=${id}`, { method: "DELETE", parseMode: "contentType" })
            if (!ok) { ErrorToaster(errText(data, "Failed to delete invoice config")); return }
            SuccessToaster("Invoice config deleted")
            onChanged?.("Invoice config removed")
            if (id === customerId) loadOne(id)
            loadList(customerId)
        } catch (e) {
            ErrorToaster(e?.message || "Failed to delete invoice config")
        } finally {
            setDeleting(false)
            setConfirmDeleteId(null)
        }
    }

    // Changing the mode on a customer that already has a saved setting updates it right away
    // (mode only; the saved text stays), then reloads so the form shows what the server holds.
    // A customer with nothing saved yet just changes the form; Save creates the setting.
    const handleModeChange = async (next) => {
        const prev = mode
        setMode(next)
        if (!customerId || !isSaved || next === prev) return
        setSaving(true)
        try {
            const { ok, data } = await rawRequest(BILLING_INVOICE_CONFIG, {
                method: "POST",
                body: { customer_id: customerId, invoice_line_mode: next },
            })
            if (!ok) { setMode(prev); ErrorToaster(errText(data, "Failed to change invoice mode")); return }
            SuccessToaster(`Invoice mode changed to ${modeLabel(next)}`)
            onChanged?.("Invoice mode changed")
            await loadOne(customerId)
            loadList(customerId)
        } catch (e) {
            setMode(prev)
            ErrorToaster(e?.message || "Failed to change invoice mode")
        } finally {
            setSaving(false)
        }
    }

    // Edit from the list = pick that customer in the header dropdown
    const handlePick = (r) => {
        if (r.customer_id === customerId) { window.scrollTo({ top: 0, behavior: "smooth" }); inputRef.current?.focus(); return }
        const name = r.customer_name || String(r.customer_id)
        onCustomerChange?.({ id: r.customer_id, name, label: name, value: name })
    }

    return (
        <div className={hideHeader ? "" : "px-2 pt-3"}>
            <InvoiceConfigBulkUpload customerOptions={customerOptions} onDone={() => { loadList(customerId); if (customerId) loadOne(customerId) }} />

            <ConfirmModal
                isOpen={confirmDeleteId != null}
                title="Delete invoice config"
                message="Delete this invoice config? The customer goes back to the default layout."
                busy={deleting}
                onCancel={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDelete(confirmDeleteId)}
            />

            <Card className="mb-3">
                <CardBody className="p-4">
                    {!customerId ? (
                        <p className="text-ink-muted mb-0">Select a customer above to view or change their invoice config.</p>
                    ) : loading ? (
                        <div className="py-3"><Spinner size="sm" /> Loading...</div>
                    ) : (
                        <>
                            <p className="text-xs text-ink-muted mb-3">
                                {externalCustomer?.name} - {isSaved ? "saved setting" : "not saved yet (default shown)"}
                            </p>
                            {/* mode, description and buttons share one line */}
                            <div className="flex flex-nowrap items-end gap-3">
                                <div className="shrink-0" style={{ width: 280 }}>
                                    <Label className="font-bold">Invoice line mode</Label>
                                    <Input type="select" value={mode} onChange={(e) => handleModeChange(e.target.value)} disabled={saving}>
                                        {modes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </Input>
                                </div>
                                {mode === "SINGLE" && (
                                    <div className="min-w-0 flex-1">
                                        <Label className="font-bold">Single line description</Label>
                                        <Input
                                            type="text"
                                            ref={inputRef}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Courier charges for {month}"
                                            invalid={problems.length > 0}
                                        />
                                    </div>
                                )}
                                <div className="ml-auto flex shrink-0 gap-2">
                                    <Button color="primary" onClick={handleSave} disabled={saving} style={{ height: 36, whiteSpace: "nowrap" }}>
                                        {saving ? <><Spinner size="sm" /> Saving...</> : "Save"}
                                    </Button>
                                    <Button color="danger" outline onClick={() => setConfirmDeleteId(customerId)} style={{ height: 36, whiteSpace: "nowrap" }}>Delete</Button>
                                </div>
                            </div>

                            {mode === "SINGLE" && (
                                <div className="mt-3">
                                    {problems.length > 0 && (
                                        <p className="text-xs text-red-500 mb-2">
                                            Not a valid placeholder: {problems.join(", ")}. Use the buttons below.
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-ink-muted">Insert:</span>
                                        {placeholders.map((p) => (
                                            <button
                                                key={p.token}
                                                type="button"
                                                title={`${p.description} - e.g. ${p.example}`}
                                                onClick={() => insertToken(p.token)}
                                                className="rounded border border-brand-500 px-2 py-0.5 text-xs font-mono text-brand-500 hover:bg-brand-50"
                                            >
                                                {p.token}
                                            </button>
                                        ))}
                                    </div>
                                    <ul className="text-xs text-ink-muted mt-2 mb-0 pl-4 list-disc">
                                        {placeholders.map((p) => (
                                            <li key={p.token}><code>{p.token}</code> - {p.description} (e.g. {p.example})</li>
                                        ))}
                                    </ul>
                                    <p className="text-xs mt-2 mb-0">
                                        <span className="text-ink-muted">Preview: </span>
                                        <strong>{preview}</strong>
                                    </p>
                                    <p className="text-xs text-ink-muted mt-1 mb-0">{note}</p>
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* One customer selected: the form above is the whole story. The table is only for browsing everyone. */}
            {!customerId && (
                <Card>
                    <CardBody className="p-4">
                        <h6 className="font-bold mb-3">Customers with a saved setting</h6>
                        {listLoading ? <Spinner size="sm" /> : list.length === 0 ? (
                            <p className="text-ink-muted mb-0">None saved yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b">
                                            <th className="py-2 pr-3">Customer</th>
                                            <th className="py-2 pr-3">Mode</th>
                                            <th className="py-2 pr-3">Description</th>
                                            <th className="py-2 pr-3">Status</th>
                                            <th className="py-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.map((r) => (
                                            <tr key={r.customer_id} className="border-b">
                                                <td className="py-2 pr-3">{r.customer_name || r.customer_id}</td>
                                                <td className="py-2 pr-3">{modeLabel(r.invoice_line_mode)}</td>
                                                <td className="py-2 pr-3">{r.invoice_line_mode === "SINGLE" ? r.single_line_description || "-" : "-"}</td>
                                                <td className="py-2 pr-3">{r.is_saved === false ? "Default" : "Saved"}</td>
                                                <td className="py-2 text-right whitespace-nowrap">
                                                    <Button size="sm" color="link" onClick={() => handlePick(r)}>Edit</Button>
                                                    <Button size="sm" color="link" className="text-red-500" onClick={() => setConfirmDeleteId(r.customer_id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}
        </div>
    )
}

InvoiceConfig.propTypes = {
    hideHeader: PropTypes.bool,
    externalCustomer: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        name: PropTypes.string,
    }),
    onCustomerChange: PropTypes.func,
    customerOptions: PropTypes.array,
}

export default InvoiceConfig
