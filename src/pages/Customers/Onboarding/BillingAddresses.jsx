// Step "Billing address": the customer's billing addresses (list, add, edit, make default, remove), backed by
// /corporate-billing/onboarding/billing-addresses/. Server rules: one default at a time, the last active address
// cannot be removed, and a GSTIN is checked against the state.
import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui"
import ToasterProvider from "../../../helpers/ToasterProvider"
import BillingAddressFields, { EMPTY_BILLING, billingBody, validateBilling } from "../../../components/UserManagement/BillingAddressFields"
import { ONBOARDING_BILLING_ADDRESSES } from "../../../api"
import { callApi } from "./helpers"

const fieldErrors = (data) => {
    const e = data?.errors
    return e && typeof e === "object" ? Object.fromEntries(Object.entries(e).map(([k, v]) => [k, Array.isArray(v) ? v.join(" ") : String(v)])) : {}
}

const BillingAddresses = ({ customerId, onChanged }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [rows, setRows] = useState(null)
    const [editing, setEditing] = useState(null) // null | { id?, ...fields }
    const [errors, setErrors] = useState({})
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        const { ok, data } = await callApi(`${ONBOARDING_BILLING_ADDRESSES}?customer_id=${customerId}`)
        const list = Array.isArray(data) ? data : data?.results || data?.addresses || []
        setRows(ok ? list : [])
        if (!ok) ErrorToaster(data?.message || "Could not load the billing addresses")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId])

    useEffect(() => { load() }, [load])

    const changed = async (msg) => {
        SucceesToaster(msg)
        await load()
        onChanged?.(msg)
    }

    const save = async () => {
        const v = validateBilling(editing)
        setErrors(v)
        if (Object.keys(v).length) return
        setBusy(true)
        const { id, ...fields } = editing
        const body = billingBody(fields)
        const { ok, data } = id
            ? await callApi(`${ONBOARDING_BILLING_ADDRESSES}${id}/`, { method: "PATCH", body })
            : await callApi(ONBOARDING_BILLING_ADDRESSES, { method: "POST", body: { customer_id: Number(customerId), ...body } })
        setBusy(false)
        if (!ok) {
            const fe = fieldErrors(data)
            setErrors(fe)
            if (!Object.keys(fe).length) ErrorToaster(data?.message || "Could not save the address")
            return
        }
        setEditing(null)
        changed(id ? "Billing address updated" : "Billing address added")
    }

    const makeDefault = async (r) => {
        const { ok, data } = await callApi(`${ONBOARDING_BILLING_ADDRESSES}${r.id}/`, { method: "PATCH", body: { is_default: true } })
        if (ok) changed("Default billing address changed")
        else ErrorToaster(data?.message || "Could not change the default")
    }

    const remove = async (r) => {
        const { ok, data } = await callApi(`${ONBOARDING_BILLING_ADDRESSES}${r.id}/deactivate/`, { method: "POST" })
        if (ok) changed("Billing address removed")
        else ErrorToaster(data?.message || "Could not remove the address")
    }

    if (!rows) return <div className="py-4"><Spinner size="sm" /> Loading billing addresses...</div>
    const active = rows.filter((r) => r.is_active !== false)

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-sm text-ink-muted">Where invoices for this customer are addressed. One address is the default.</p>
                <Button size="sm" color="primary" className="whitespace-nowrap" onClick={() => { setErrors({}); setEditing({ ...EMPTY_BILLING, is_default: active.length === 0 }) }}>Add address</Button>
            </div>

            {active.length === 0 && <p className="m-0 rounded-md border border-white/8 p-4 text-center text-sm text-ink-muted">No billing address yet. Add the first one.</p>}

            {active.map((r) => (
                <div key={r.id} className="rounded-md border border-white/8 bg-surface p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <strong>{r.label || r.legal_name || "Billing address"}</strong>
                            {r.is_default && <span className="rounded-full border border-success-500 px-2 py-0.5 text-xs font-semibold text-success-500">Default</span>}
                        </div>
                        <div className="flex gap-2">
                            {!r.is_default && <Button size="sm" color="secondary" onClick={() => makeDefault(r)}>Make default</Button>}
                            <Button size="sm" color="secondary" onClick={() => { setErrors({}); setEditing({ ...EMPTY_BILLING, ...r }) }}>Edit</Button>
                            <Button size="sm" color="danger" outline disabled={active.length < 2} title={active.length < 2 ? "Add another address first" : ""} onClick={() => remove(r)}>Remove</Button>
                        </div>
                    </div>
                    <div className="mt-1 text-ink-muted">
                        {[r.legal_name, r.address, r.city, r.state, r.pincode].filter(Boolean).join(", ")}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                        {r.gst_no ? `GST ${r.gst_no}` : "No GST number"}
                        {r.contact_name || r.contact_phone || r.contact_email ? ` | ${[r.contact_name, r.contact_phone, r.contact_email].filter(Boolean).join(", ")}` : ""}
                    </div>
                </div>
            ))}

            <Modal isOpen={!!editing} toggle={() => !busy && setEditing(null)} size="lg" centered className="flex max-h-[85vh] flex-col">
                <ModalHeader toggle={() => !busy && setEditing(null)}>{editing?.id ? "Edit billing address" : "Add billing address"}</ModalHeader>
                <ModalBody className="overflow-y-auto">
                    {editing && (
                        <>
                            <BillingAddressFields value={editing} onChange={(p) => setEditing((prev) => ({ ...prev, ...p }))} errors={errors} disabled={busy} />
                            {!editing.id && active.length > 0 && (
                                <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm">
                                    <input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing((p) => ({ ...p, is_default: e.target.checked }))} /> Make this the default address
                                </label>
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
                    <Button color="primary" onClick={save} disabled={busy}>{busy ? <><Spinner size="sm" /> Saving...</> : "Save"}</Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

BillingAddresses.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChanged: PropTypes.func,
}

export default BillingAddresses
