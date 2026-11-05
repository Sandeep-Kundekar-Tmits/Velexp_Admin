// Transfer tab: type or paste AWBs, pick the target customer, then apply.
import { useMemo, useState } from "react"
import PropTypes from "prop-types"
import { Button, Input, Label, Spinner } from "@/components/ui"
import SimpleModal from "../../../components/SimpleModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { rawRequest } from "@/lib/http"
import { SHIPMENT_TRANSFER } from "../../../api"
import { errText } from "../invoiceConfigHelpers"
import { parseAwbs, parseRows } from "./helpers"
import ResultPanel from "./ResultPanel"
import CustomerSelect from "./CustomerSelect"

const TransferForm = ({ onViewLogs }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [mode, setMode] = useState("one") // "one" = one customer for every AWB, "rows" = a customer per AWB
    const [awbText, setAwbText] = useState("")
    const [rowsText, setRowsText] = useState("")
    const [target, setTarget] = useState(null) // { value: user id, label: name }
    const [reason, setReason] = useState("")
    const [busy, setBusy] = useState(null) // "preview" | "apply"
    const [result, setResult] = useState(null) // { data, applied, failed }
    const [confirmOpen, setConfirmOpen] = useState(false)

    const awbs = useMemo(() => parseAwbs(awbText), [awbText])
    const parsedRows = useMemo(() => parseRows(rowsText), [rowsText])
    const count = mode === "one" ? awbs.length : parsedRows.rows.length

    // Returns the request body, or null (after a toast) when the form is incomplete.
    const buildPayload = (apply) => {
        if (mode === "one") {
            if (!awbs.length) { ErrorToaster("Enter at least one AWB"); return null }
            if (!target) { ErrorToaster("Select the customer to transfer to"); return null }
        } else {
            if (!parsedRows.rows.length) { ErrorToaster("Enter at least one line: AWB, customer"); return null }
            if (parsedRows.bad.length) { ErrorToaster(`Fix these lines first: ${parsedRows.bad.slice(0, 3).join("; ")}${parsedRows.bad.length > 3 ? " ..." : ""}`); return null }
        }
        if (apply && !reason.trim()) { ErrorToaster("Reason is required to apply the transfer"); return null }

        const payload = mode === "one"
            ? { awbs, to_user_id: Number(target.value) }
            : { rows: parsedRows.rows }
        if (reason.trim()) payload.reason = reason.trim()
        if (apply) payload.apply = true
        return payload
    }

    const run = async (apply) => {
        const payload = buildPayload(apply)
        if (!payload) return
        setBusy(apply ? "apply" : "preview")
        try {
            const { ok, data } = await rawRequest(SHIPMENT_TRANSFER, { method: "POST", body: payload })
            if (!ok) {
                ErrorToaster(errText(data, "Request failed"))
                setResult({ data, failed: true })
                return
            }
            setResult({ data, applied: apply })
            if (apply) {
                const batch = data?.batch_id
                SucceesToaster(batch ? `Transfer applied (batch ${batch})` : "Transfer applied")
            }
        } catch {
            ErrorToaster("Request failed")
        } finally {
            setBusy(null)
            setConfirmOpen(false)
        }
    }

    const handleApplyClick = () => {
        if (!buildPayload(true)) return
        setConfirmOpen(true)
    }

    const batchId = result?.data?.batch_id
    const resultTitle = result?.failed ? "Request failed" : result?.applied ? "Transfer applied" : "Transfer result"

    return (
        <div>
            <div className="rounded-md border border-white/8 p-2.5">
                <div className="mb-2 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-ink">
                        <Input type="radio" name="transfer-mode" checked={mode === "one"} onChange={() => setMode("one")} />
                        One customer for all AWBs
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-ink">
                        <Input type="radio" name="transfer-mode" checked={mode === "rows"} onChange={() => setMode("rows")} />
                        A different customer per AWB
                    </label>
                </div>

                <div className="flex max-w-3xl flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        {mode === "one" ? (
                            <>
                                <Label className="form-label m-0 font-bold text-ink-muted">AWB numbers</Label>
                                <textarea
                                    className="form-control"
                                    rows={6}
                                    value={awbText}
                                    onChange={(e) => setAwbText(e.target.value)}
                                    placeholder={"VIN0012345\nVIN0012346\nVIN0012347"}
                                />
                                <span className="text-xs text-ink-muted">One per line, or separated by commas or spaces. {awbs.length} AWB(s) found.</span>
                            </>
                        ) : (
                            <>
                                <Label className="form-label m-0 font-bold text-ink-muted">AWB, customer (one per line)</Label>
                                <textarea
                                    className="form-control"
                                    rows={6}
                                    value={rowsText}
                                    onChange={(e) => setRowsText(e.target.value)}
                                    placeholder={"VIN0012345, 4166\nVIN0012346, other_login"}
                                />
                                <span className="text-xs text-ink-muted">
                                    The customer is a user ID or a username. {parsedRows.rows.length} line(s) read
                                    {parsedRows.bad.length ? `, ${parsedRows.bad.length} with problems` : ""}.
                                </span>
                                {parsedRows.bad.length > 0 && (
                                    <span className="text-xs text-danger-500">{parsedRows.bad.slice(0, 3).join("; ")}{parsedRows.bad.length > 3 ? " ..." : ""}</span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        {mode === "one" && (
                            <div className="flex flex-col gap-1">
                                <Label className="form-label m-0 font-bold text-ink-muted">Transfer to (customer)</Label>
                                <CustomerSelect value={target} onChange={setTarget} placeholder="Search customer by name" />
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <Label className="form-label m-0 font-bold text-ink-muted">Reason (required to apply)</Label>
                            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Booked under wrong account" />
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button color="primary" onClick={handleApplyClick} disabled={!!busy}>
                        {busy === "apply" ? <><Spinner size="sm" /> Applying...</> : "Apply transfer"}
                    </Button>
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
                    Transfer {count} shipment(s){mode === "one" ? ` to ${target?.label}` : " to the customers listed"}
                    ? This writes to the database.
                </p>
            </SimpleModal>
        </div>
    )
}

TransferForm.propTypes = { onViewLogs: PropTypes.func.isRequired }

export default TransferForm
