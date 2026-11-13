// The parts of the New customer form that the plain Edit customer form does not have, shown under it in the
// Account step so the two screens carry the same fields: Customer service user, Billing addresses and Daily MIS.
// Each part saves on its own (the server keeps them apart from the user record).
import { useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Button, Label, Spinner } from "@/components/ui"
import ToasterProvider from "../../../helpers/ToasterProvider"
import CustomerServicePicker from "../../../components/Common/CustomerServicePicker"
import { GET_USER_API, UPDATE_USER_API } from "../../../api"
import BillingAddresses from "./BillingAddresses"
import MisGroups from "./MisGroups"
import { callApi } from "./helpers"

const Heading = ({ children }) => (
    <>
        <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{children}</div>
    </>
)
Heading.propTypes = { children: PropTypes.node }

const messageOf = (data, fallback) => {
    if (!data) return fallback
    if (typeof data === "string") return data
    const first = Object.values(data).flat?.()[0]
    return data.message || data.detail || (typeof first === "string" ? first : fallback)
}

const AccountExtras = ({ customerId, onChanged }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // ── customer service user ──────────────────────────────────────────
    const [service, setService] = useState({ id: "", name: "" })
    const [serviceDirty, setServiceDirty] = useState(false)
    const [savingService, setSavingService] = useState(false)

    useEffect(() => {
        let alive = true
        callApi(`${GET_USER_API}/${customerId}/`).then(({ ok, data }) => {
            if (alive && ok && data) setService({ id: data.customer_service_user || "", name: data.customer_service_name || "" })
        })
        return () => { alive = false }
    }, [customerId])

    const saveService = async () => {
        if (!service.id) { ErrorToaster("Pick a customer service user first"); return }
        setSavingService(true)
        const { ok, data } = await callApi(`${UPDATE_USER_API}/${customerId}/`, { method: "PATCH", body: { customer_service_user: service.id } })
        setSavingService(false)
        if (!ok) { ErrorToaster(messageOf(data?.customer_service_user ? { m: data.customer_service_user } : data, "Could not save the customer service user")); return }
        setServiceDirty(false)
        SucceesToaster("Customer service user saved")
        onChanged?.("Customer service user saved")
    }

    return (
        <div>
            <Heading>Customer service</Heading>
            <div className="mb-2 flex items-start gap-3">
                <Label className="mb-0 flex h-9.5 shrink-0 items-center whitespace-nowrap">Customer service user<span className="text-danger-500"> *</span></Label>
                <div className="min-w-0 max-w-md flex-1">
                    <CustomerServicePicker
                        value={service.id}
                        savedName={service.name}
                        onChange={(id) => { setService((s) => ({ ...s, id })); setServiceDirty(true) }}
                    />
                </div>
                <Button size="sm" color="primary" className="h-9.5 shrink-0" disabled={!serviceDirty || savingService} onClick={saveService}>
                    {savingService ? <><Spinner size="sm" /> Saving...</> : "Save customer service"}
                </Button>
            </div>

            <Heading>Billing addresses</Heading>
            <BillingAddresses customerId={customerId} onChanged={onChanged} />

            <MisGroups customerId={customerId} onChanged={onChanged} />
        </div>
    )
}

AccountExtras.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChanged: PropTypes.func,
}

export default AccountExtras
