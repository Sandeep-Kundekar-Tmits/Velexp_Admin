// Darkstore Conversion (Ops Master): re-point shipments to a different pick / drop store (admin-panel API).
// Preview (dry run) first; Apply needs a reason and is only enabled once the current inputs have been previewed.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import PropTypes from "prop-types"
import AsyncSelect from "react-select/async"
import { Button, Input, Label, Spinner } from "@/components/ui"
import MainHeaderComp from "../../components/MainHeaderCom"
import SimpleModal from "../../components/SimpleModal"
import ToasterProvider from "../../helpers/ToasterProvider"
import { customStyles } from "../../helpers/CustomStyle"
import { rawRequest } from "@/lib/http"
import { DARKSTORE_CONVERSION, DARKSTORE_CONVERSION_STORES } from "../../api"
import { errText } from "../NewFeatures/invoiceConfigHelpers"
import { parseAwbs } from "../NewFeatures/ShipmentTransfer/helpers"
import ResultPanel from "../NewFeatures/ShipmentTransfer/ResultPanel"

// The stores endpoint is not documented beyond its filters, so read the usual field names.
const toStoreOption = (s) => {
    const code = s?.code ?? s?.store_code ?? s?.service_center_code ?? s?.ec_code ?? s?.id
    const name = s?.name ?? s?.store_name ?? s?.company_name ?? ""
    const city = s?.city ?? ""
    const type = s?.type ?? s?.store_type ?? ""
    return {
        value: String(code ?? ""),
        label: `${code} — ${[name, city].filter(Boolean).join(", ")}`.replace(/ — $/, ""),
        type: String(type || ""),
    }
}

const StoreSelect = ({ value, onChange, placeholder }) => {
    const timer = useRef(null)
    // Debounced so typing does not fire a request per keystroke.
    const loadOptions = useCallback((inputValue, callback) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            try {
                const { ok, data } = await rawRequest(`${DARKSTORE_CONVERSION_STORES}?search=${encodeURIComponent(inputValue)}`, { method: "GET" })
                const list = ok ? (Array.isArray(data) ? data : data?.results || data?.stores || []) : []
                callback(list.map(toStoreOption).filter((o) => o.value))
            } catch {
                callback([])
            }
        }, 400)
    }, [])

    return (
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            formatOptionLabel={(opt, { context }) => (
                context === "menu" && opt.type ? (
                    <div className="flex items-center justify-between gap-3">
                        <span className="truncate">{opt.label}</span>
                        <span className="shrink-0 text-xs opacity-70">{opt.type.replace(/_/g, " ")}</span>
                    </div>
                ) : opt.label
            )}
            filterOption={() => true}
            noOptionsMessage={({ inputValue }) => (inputValue ? "No stores found" : "Type to search")}
            styles={customStyles}
            menuPortalTarget={document.body}
            isClearable
        />
    )
}

StoreSelect.propTypes = {
    value: PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, type: PropTypes.string }),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
}

// "AWB, pick store, drop store" per line (comma, tab, semicolon or spaces between)
const parseRows = (text) => {
    const rows = []
    const bad = []
    const seen = new Set()
    String(text || "").split(/\r?\n/).forEach((raw) => {
        const line = raw.trim()
        if (!line) return
        const p = line.split(/[,\t;]+|\s+/).map((x) => x.trim()).filter(Boolean)
        if (p.length < 3) { bad.push(`${line} (needs AWB, pick store and drop store)`); return }
        const key = p[0].toUpperCase()
        if (seen.has(key)) { bad.push(`${p[0]} (listed twice)`); return }
        seen.add(key)
        rows.push({ awb: p[0], pick_store: p[1], drop_store: p[2] })
    })
    return { rows, bad }
}

const DarkstoreConversion = () => {
    useEffect(() => { document.title = "Darkstore Conversion" }, [])
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [mode, setMode] = useState("same") // "same" = the same stores for every AWB, "rows" = stores per AWB
    const [awbText, setAwbText] = useState("")
    const [rowsText, setRowsText] = useState("")
    const [pick, setPick] = useState(null)
    const [drop, setDrop] = useState(null)
    const [reason, setReason] = useState("")
    const [busy, setBusy] = useState(null) // "preview" | "apply"
    const [result, setResult] = useState(null) // { data, applied, failed }
    const [previewedKey, setPreviewedKey] = useState("")
    const [confirmOpen, setConfirmOpen] = useState(false)

    const awbs = useMemo(() => parseAwbs(awbText), [awbText])
    const parsedRows = useMemo(() => parseRows(rowsText), [rowsText])
    const count = mode === "same" ? awbs.length : parsedRows.rows.length

    // What a preview covers: apply is only allowed while the inputs still match the last preview.
    const currentKey = useMemo(
        () => JSON.stringify(mode === "same" ? { awbs, pick: pick?.value, drop: drop?.value } : { rows: parsedRows.rows }),
        [mode, awbs, pick, drop, parsedRows]
    )
    const previewed = previewedKey !== "" && previewedKey === currentKey

    const buildPayload = (apply) => {
        if (mode === "same") {
            if (!awbs.length) { ErrorToaster("Enter at least one AWB"); return null }
            if (!pick) { ErrorToaster("Select the pick store"); return null }
            if (!drop) { ErrorToaster("Select the drop store"); return null }
        } else {
            if (!parsedRows.rows.length) { ErrorToaster("Enter at least one line: AWB, pick store, drop store"); return null }
            if (parsedRows.bad.length) { ErrorToaster(`Fix these lines first: ${parsedRows.bad.slice(0, 3).join("; ")}${parsedRows.bad.length > 3 ? " ..." : ""}`); return null }
        }
        if (apply && !reason.trim()) { ErrorToaster("Reason is required to apply the conversion"); return null }
        const payload = mode === "same"
            ? { awbs, pick_store: pick.value, drop_store: drop.value }
            : { rows: parsedRows.rows }
        if (apply) { payload.apply = true; payload.reason = reason.trim() }
        return payload
    }

    const run = async (apply) => {
        const payload = buildPayload(apply)
        if (!payload) return
        setBusy(apply ? "apply" : "preview")
        try {
            const { ok, data } = await rawRequest(DARKSTORE_CONVERSION, { method: "POST", body: payload })
            if (!ok) {
                ErrorToaster(errText(data, "Request failed"))
                setResult({ data, failed: true })
                if (!apply) setPreviewedKey("")
                return
            }
            setResult({ data, applied: apply })
            if (apply) {
                setPreviewedKey("")
                SucceesToaster("Conversion applied")
            } else {
                setPreviewedKey(currentKey)
            }
        } catch {
            ErrorToaster("Request failed")
        } finally {
            setBusy(null)
            setConfirmOpen(false)
        }
    }

    const handleApplyClick = () => {
        if (!previewed) { ErrorToaster("Run the preview first, and apply only if it shows CONVERTIBLE"); return }
        if (!buildPayload(true)) return
        setConfirmOpen(true)
    }

    const resultTitle = result?.failed ? "Request failed" : result?.applied ? "Conversion applied" : "Preview (nothing saved)"

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Darkstore Conversion"
                subTitle="Change the pick and drop store of shipments. Preview first, then apply."
            />

            <div className="page-fit-body relative z-10 overflow-y-auto pb-3">
                <div className="flex max-w-3xl flex-col gap-3 rounded-md border border-white/8 p-2.5">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-1.5 text-sm text-ink">
                            <Input type="radio" name="conversion-mode" checked={mode === "same"} onChange={() => setMode("same")} />
                            Same stores for every AWB
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-ink">
                            <Input type="radio" name="conversion-mode" checked={mode === "rows"} onChange={() => setMode("rows")} />
                            Different stores per AWB
                        </label>
                    </div>

                    {mode === "same" ? (
                        <>
                            <div className="flex flex-col gap-1">
                                <Label className="form-label m-0 font-bold text-ink-muted">AWB numbers</Label>
                                <textarea
                                    className="form-control"
                                    rows={5}
                                    value={awbText}
                                    onChange={(e) => setAwbText(e.target.value)}
                                    placeholder={"VIN0423471\nVIN0423472"}
                                />
                                <span className="text-xs text-ink-muted">One per line, or separated by commas or spaces. {awbs.length} AWB(s) found.</span>
                            </div>
                            {/* pick and drop store side by side on one line (stacked only on a phone) */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex min-w-0 flex-col gap-1">
                                    <Label className="form-label m-0 font-bold text-ink-muted">Pick store</Label>
                                    <StoreSelect value={pick} onChange={setPick} placeholder="Select pick store" />
                                </div>
                                <div className="flex min-w-0 flex-col gap-1">
                                    <Label className="form-label m-0 font-bold text-ink-muted">Drop store</Label>
                                    <StoreSelect value={drop} onChange={setDrop} placeholder="Select drop store" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-1">
                            <Label className="form-label m-0 font-bold text-ink-muted">AWB, pick store, drop store (one per line)</Label>
                            <textarea
                                className="form-control"
                                rows={6}
                                value={rowsText}
                                onChange={(e) => setRowsText(e.target.value)}
                                placeholder={"VIN0423471, LFKOC1, LKST1234\nVIN0423472, LKST1234, LFKOC1"}
                            />
                            <span className="text-xs text-ink-muted">
                                Stores are their codes. {parsedRows.rows.length} line(s) read{parsedRows.bad.length ? `, ${parsedRows.bad.length} with problems` : ""}.
                            </span>
                            {parsedRows.bad.length > 0 && (
                                <span className="text-xs text-danger-500">{parsedRows.bad.slice(0, 3).join("; ")}{parsedRows.bad.length > 3 ? " ..." : ""}</span>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <Label className="form-label m-0 font-bold text-ink-muted">Reason (required to apply)</Label>
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Missed hyperlocal swap at booking" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button color="secondary" onClick={() => run(false)} disabled={!!busy}>
                            {busy === "preview" ? <><Spinner size="sm" /> Previewing...</> : "Preview (dry run)"}
                        </Button>
                        <Button color="primary" onClick={handleApplyClick} disabled={!!busy || !previewed}>
                            {busy === "apply" ? <><Spinner size="sm" /> Applying...</> : "Apply conversion"}
                        </Button>
                        <span className="text-xs text-ink-muted">
                            {previewed ? "Preview done for these inputs. Apply only if it shows CONVERTIBLE." : "Apply unlocks after a preview of the current inputs."}
                        </span>
                    </div>
                </div>

                {result && <ResultPanel title={resultTitle} data={result.data} plain />}
            </div>

            <SimpleModal
                isOpen={confirmOpen}
                setIsOpen={setConfirmOpen}
                onCancel={() => setConfirmOpen(false)}
                successButtonName={busy === "apply" ? "Converting..." : "Convert"}
                onSuccess={() => run(true)}
            >
                <p className="m-0 font-semibold text-danger-500">
                    Convert {count} shipment(s){mode === "same" ? ` to pick ${pick?.value} and drop ${drop?.value}` : " to the stores listed"}? This writes to the database.
                </p>
            </SimpleModal>
        </div>
    )
}

export default DarkstoreConversion
