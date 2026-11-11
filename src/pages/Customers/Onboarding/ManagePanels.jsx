// After go-live: resend the credentials, see every email attempt, and add / list extra logins.
import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Button, Input, Label, Spinner } from "@/components/ui"
import SimpleModal from "../../../components/SimpleModal"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_ADD_LOGIN, ONBOARDING_EMAIL_HISTORY, ONBOARDING_LOGINS, ONBOARDING_RESEND_CREDENTIALS } from "../../../api"
import { asList, callApi } from "./helpers"

const when = (iso) => {
    if (!iso) return "—"
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? String(iso) : `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}
const joined = (v) => (Array.isArray(v) ? v.join(", ") : v || "—")

export const ResendCredentials = ({ customerId }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [password, setPassword] = useState("")
    const [busy, setBusy] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [last, setLast] = useState(null)

    const send = async () => {
        if (password && password.length < 6) { ErrorToaster("The password must be at least 6 characters"); setConfirmOpen(false); return }
        setBusy(true)
        const body = { customer_id: Number(customerId) }
        if (password) body.password = password
        const { ok, status, data } = await callApi(ONBOARDING_RESEND_CREDENTIALS, { method: "POST", body })
        setBusy(false)
        setConfirmOpen(false)
        if (ok) {
            setLast(data)
            setPassword("")
            SucceesToaster(data?.password_changed ? "Credentials sent with a new password" : "Credentials sent")
            return
        }
        if (status === 409) { ErrorToaster("Not live yet, or the account is inactive"); return }
        if (status === 502) { ErrorToaster(`${errText(data, "The email failed.")} The password was not changed.`); return }
        ErrorToaster(errText(data, "Could not resend the credentials"))
    }

    return (
        <div className="flex max-w-xl flex-col gap-3">
            <p className="m-0 text-sm text-ink-muted">Emails the login to the customer again. Leave the password blank to resend the same one.</p>
            <div className="flex flex-col gap-1">
                <Label className="m-0">New password (optional, at least 6 characters)</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            {password && (
                <p className="m-0 rounded border border-warning-500 p-2 text-sm text-warning-500">
                    The customer&apos;s API integration will stop working until they update it.
                </p>
            )}
            <div>
                <Button color="primary" disabled={busy} onClick={() => setConfirmOpen(true)}>
                    {busy ? <><Spinner size="sm" /> Sending...</> : "Resend credentials"}
                </Button>
            </div>
            {last && (
                <p className="m-0 text-sm text-success-500">
                    Sent to {joined(last.to)}{(last.cc || []).length ? ` (cc ${joined(last.cc)})` : ""}. {last.password_changed ? "The password was changed." : "Same password."}
                </p>
            )}
            <SimpleModal
                isOpen={confirmOpen}
                setIsOpen={setConfirmOpen}
                onCancel={() => setConfirmOpen(false)}
                successButtonName={busy ? "Sending..." : "Send"}
                onSuccess={send}
            >
                <p className="m-0 font-semibold">
                    {password ? "Send a NEW password? The customer's API integration will stop working until they update it." : "Resend the credentials email with the same password?"}
                </p>
            </SimpleModal>
        </div>
    )
}
ResendCredentials.propTypes = { customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired }

export const EmailHistory = ({ customerId }) => {
    const { ErrorToaster } = ToasterProvider()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const { ok, data } = await callApi(`${ONBOARDING_EMAIL_HISTORY}?customer_id=${customerId}`)
        setLoading(false)
        if (!ok) { ErrorToaster(errText(data, "Could not load the email history")); return }
        setRows(asList(data))
    }, [customerId])

    useEffect(() => { load() }, [load])

    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-ink-muted">Every email attempt, newest first (up to 100).</span>
                <Button size="sm" color="secondary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</Button>
            </div>
            <div className="overflow-x-auto rounded border border-white/8">
                <table className="w-full whitespace-nowrap text-sm">
                    <thead>
                        <tr className="bg-surface">
                            {["When", "Kind", "Status", "To", "Cc", "Password changed", "Sent by", "Error"].map((h) => (
                                <th key={h} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.id ?? i} className="border-t border-white/8">
                                <td className="px-2 py-1.5">{when(r.created_at)}</td>
                                <td className="px-2 py-1.5">{String(r.kind || "").replace(/_/g, " ")}</td>
                                <td className={`px-2 py-1.5 font-semibold ${r.status === "SENT" ? "text-success-500" : "text-danger-500"}`}>{r.status}</td>
                                <td className="px-2 py-1.5">{joined(r.to)}</td>
                                <td className="px-2 py-1.5">{joined(r.cc)}</td>
                                <td className="px-2 py-1.5">{r.password_changed ? "Yes" : "No"}</td>
                                <td className="px-2 py-1.5">{r.sent_by || "—"}</td>
                                <td className="px-2 py-1.5">{r.error || "—"}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={8} className="px-2 py-3 text-center text-ink-muted">{loading ? "Loading..." : "No emails yet"}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
EmailHistory.propTypes = { customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired }

const EMPTY_LOGIN = { username: "", password: "", email: "", first_name: "", last_name: "", phone: "" }

export const Logins = ({ customerId }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState(EMPTY_LOGIN)
    const [busy, setBusy] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const { ok, data } = await callApi(`${ONBOARDING_LOGINS}?customer_id=${customerId}`)
        setLoading(false)
        if (!ok) { ErrorToaster(errText(data, "Could not load the logins")); return }
        setRows(asList(data))
    }, [customerId])

    useEffect(() => { load() }, [load])

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

    const add = async () => {
        if (!form.username.trim() || form.password.length < 6) { ErrorToaster("A username and a password of at least 6 characters are required"); return }
        setBusy(true)
        const body = { customer_id: Number(customerId) }
        Object.entries(form).forEach(([k, v]) => { if (String(v).trim()) body[k] = String(v).trim() })
        body.password = form.password // not trimmed
        const { ok, status, data } = await callApi(ONBOARDING_ADD_LOGIN, { method: "POST", body })
        setBusy(false)
        if (ok) {
            SucceesToaster("Login created and its credentials emailed")
            setForm(EMPTY_LOGIN)
            load()
            return
        }
        if (status === 409) { ErrorToaster("The customer is not live yet"); return }
        if (status === 502) { ErrorToaster(`${errText(data, "The email failed.")} The login was not created.`); return }
        ErrorToaster(errText(data, "Could not add the login"))
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded border border-white/8">
                <table className="w-full whitespace-nowrap text-sm">
                    <thead>
                        <tr className="bg-surface">
                            {["Username", "Name", "Email", "Phone", "Active"].map((h) => (
                                <th key={h} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={r.id ?? r.username ?? i} className="border-t border-white/8">
                                <td className="px-2 py-1.5 font-semibold">{r.username}</td>
                                <td className="px-2 py-1.5">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</td>
                                <td className="px-2 py-1.5">{r.email || "—"}</td>
                                <td className="px-2 py-1.5">{r.phone || "—"}</td>
                                <td className="px-2 py-1.5">{r.is_active === undefined ? "—" : r.is_active ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={5} className="px-2 py-3 text-center text-ink-muted">{loading ? "Loading..." : "No logins yet"}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="max-w-2xl rounded border border-white/8 p-2.5">
                <div className="mb-1 text-sm font-semibold">Add a login</div>
                <p className="mb-2 text-xs text-ink-muted">
                    Shares the customer&apos;s account, address, AWB series, service providers and pincodes / rates / config. It has its own wallet, starting at 0.
                    It is active at once and its credentials are emailed.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div><Label className="m-0">Username *</Label><Input value={form.username} onChange={set("username")} /></div>
                    <div><Label className="m-0">Password * (6+)</Label><Input type="password" value={form.password} onChange={set("password")} autoComplete="new-password" /></div>
                    <div><Label className="m-0">Email</Label><Input value={form.email} onChange={set("email")} /></div>
                    <div><Label className="m-0">Phone</Label><Input value={form.phone} onChange={set("phone")} /></div>
                    <div><Label className="m-0">First name</Label><Input value={form.first_name} onChange={set("first_name")} /></div>
                    <div><Label className="m-0">Last name</Label><Input value={form.last_name} onChange={set("last_name")} /></div>
                </div>
                <div className="mt-3">
                    <Button color="primary" onClick={add} disabled={busy}>{busy ? <><Spinner size="sm" /> Creating...</> : "Create login & send credentials"}</Button>
                </div>
            </div>
        </div>
    )
}
Logins.propTypes = { customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired }
