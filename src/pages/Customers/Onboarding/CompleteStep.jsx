// Complete & send credentials: re-checks everything, activates the login and emails the credentials in one
// transaction. The server answers 200 (live), 400 (blockers / unacknowledged warnings / password needed),
// 409 (already live), 502 (email failed, nothing changed) or 500 (nothing changed).
import { useMemo, useState } from "react"
import PropTypes from "prop-types"
import { Link } from "react-router-dom"
import { Button, Input, Label, Spinner } from "@/components/ui"
import SimpleModal from "../../../components/SimpleModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_GO_LIVE } from "../../../api"
import { callApi } from "./helpers"

const CompleteStep = ({ customerId, checklist, testRoutes, testWeight, onChecklist, onLive }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [ack, setAck] = useState([])
    const [password, setPassword] = useState("")
    const [needsPassword, setNeedsPassword] = useState(false)
    const [busy, setBusy] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [done, setDone] = useState(null)
    const [problem, setProblem] = useState("")

    const warnings = useMemo(() => checklist?.warning_codes || [], [checklist])
    const blockers = checklist?.blocker_count ?? 0
    const allAcked = warnings.every((c) => ack.includes(c))
    const warnDetail = (code) => {
        for (const st of checklist?.steps || []) {
            const hit = (st.checks || []).find((c) => c.code === code && c.state === "warning")
            if (hit) return hit.detail
        }
        return ""
    }

    const completed = !!done

    const submit = async () => {
        if (needsPassword && password.length < 6) { ErrorToaster("The password must be at least 6 characters"); return }
        setBusy(true)
        setProblem("")
        const body = { customer_id: Number(customerId), acknowledge_warnings: ack }
        if (password) body.password = password
        if (testRoutes.length) body.test_routes = testRoutes
        if (Number(testWeight) > 0) body.test_weight_kg = Number(testWeight)
        const { ok, status, data } = await callApi(ONBOARDING_GO_LIVE, { method: "POST", body })
        setBusy(false)
        setConfirmOpen(false)

        if (ok) {
            setDone(data)
            SucceesToaster("Customer is live. Credentials sent.")
            onLive?.()
            return
        }
        if (status === 400) {
            if (data?.password_required) {
                setNeedsPassword(true)
                setProblem("No stored password for this customer. Enter one (at least 6 characters) and complete again.")
                return
            }
            if (data?.checklist) onChecklist?.(data.checklist)
            if (data?.unacknowledged_warnings) {
                setProblem(`Acknowledge every warning first: ${[].concat(data.unacknowledged_warnings).join(", ")}`)
                return
            }
            setProblem(errText(data, "There are blockers. Fix them and complete again."))
            return
        }
        if (status === 409) { setProblem("This customer is already live. Use Resend credentials instead."); return }
        if (status === 502) { setProblem(`${errText(data, "The credentials email could not be sent.")} Nothing was changed and the customer is still inactive. You can try again.`); return }
        setProblem(`${errText(data, "Unexpected error.")} Nothing was changed.`)
    }

    if (completed) {
        const to = [].concat(done?.to || []).join(", ")
        return (
            <div className="rounded border border-success-500 p-3">
                <p className="mb-1 font-semibold text-success-500">Customer is live and can book.</p>
                <p className="mb-2 text-sm">Credentials sent to {to || "the customer"}{done?.username ? ` (login ${done.username})` : ""}.</p>
                <Link to={`/edit-user/${customerId}`} className="btn btn-sm btn-primary">Open customer</Link>
            </div>
        )
    }

    return (
        <div className="flex max-w-2xl flex-col gap-3">
            <p className="m-0 text-sm text-ink-muted">
                This re-checks everything including a real test booking for every product, activates the login and emails the credentials.
                If anything fails, nothing changes and the customer stays inactive.
            </p>

            {!checklist && <p className="m-0 text-sm text-danger-500">Run the checks on the Review step first.</p>}
            {checklist && blockers > 0 && <p className="m-0 text-sm font-semibold text-danger-500">{blockers} blocker(s) must be fixed before completing. See the Review step.</p>}

            {warnings.length > 0 && (
                <div className="rounded border border-white/8 p-2.5">
                    <div className="mb-1 text-sm font-semibold">Warnings: acknowledge each one to continue</div>
                    {warnings.map((code) => (
                        <label key={code} className="mb-1 flex items-start gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={ack.includes(code)}
                                onChange={(e) => setAck((prev) => (e.target.checked ? [...prev, code] : prev.filter((c) => c !== code)))}
                            />
                            <span><strong>{code}</strong>{warnDetail(code) ? `: ${warnDetail(code)}` : ""}</span>
                        </label>
                    ))}
                </div>
            )}

            {needsPassword && (
                <div className="flex max-w-sm flex-col gap-1">
                    <Label className="m-0">Password for the customer (at least 6 characters)</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
            )}

            {problem && <p className="m-0 rounded border border-danger-500 p-2 text-sm text-danger-500">{problem}</p>}

            <div>
                <Button color="primary" disabled={busy || !checklist || blockers > 0 || !allAcked} onClick={() => setConfirmOpen(true)}>
                    {busy ? <><Spinner size="sm" /> Completing...</> : "Complete & send credentials"}
                </Button>
                <span className="ml-2 text-xs text-ink-muted">Runs test bookings and sends an email, so it can take a moment.</span>
            </div>

            <SimpleModal
                isOpen={confirmOpen}
                setIsOpen={setConfirmOpen}
                onCancel={() => setConfirmOpen(false)}
                successButtonName={busy ? "Completing..." : "Complete"}
                onSuccess={submit}
            >
                <p className="m-0 font-semibold">
                    Activate this customer and email the login credentials now? The customer can book as soon as this succeeds.
                </p>
            </SimpleModal>
        </div>
    )
}

CompleteStep.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    checklist: PropTypes.object,
    testRoutes: PropTypes.array.isRequired,
    testWeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onChecklist: PropTypes.func,
    onLive: PropTypes.func,
}

export default CompleteStep
