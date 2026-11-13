// Daily MIS for one customer: any number of groups, each with its own recipient emails and send time.
// Every group is one delivery-summary row (email = comma-joined list, schedule_time = "HH:MM:SS"),
// saved on its own: add a group, edit it and press Update, or remove it.
import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { MdCheck, MdClose, MdDelete, MdEdit } from "react-icons/md"
import { Button, Input, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { EMPTY_MIS, MisEmailsInput, validateMis } from "../../../components/UserManagement/MisConfigFields"
import { DELIVERY_SUMMARY_CUSTOMERS } from "../../../api"

const messageOf = (data, fallback) => {
    if (!data) return fallback
    if (typeof data === "string") return data
    const first = Object.values(data).flat?.()[0]
    return data.message || data.detail || (typeof first === "string" ? first : fallback)
}

const fromRow = (r) => ({
    key: `row-${r.id}`,
    id: r.id,
    emails: String(r.email || "").split(",").map((x) => x.trim()).filter(Boolean),
    schedule_time: String(r.schedule_time || "09:00:00").slice(0, 5),
    errors: {},
    editing: false,
    saving: false,
})

let draftSeq = 0

const MisGroups = ({ customerId, onChanged }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [groups, setGroups] = useState(null) // null while loading

    const load = useCallback(async () => {
        const { ok, data } = await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}?page_size=200&customer=${customerId}`, { method: "GET" })
        const rows = ok ? (Array.isArray(data) ? data : data?.results || []) : []
        // the list may ignore the customer filter: keep this customer's rows only
        setGroups(rows.filter((r) => Number(r.customer) === Number(customerId)).map(fromRow))
    }, [customerId])

    useEffect(() => { load() }, [load])

    const patch = (key, p) => setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...p } : g)))

    const add = () => setGroups((gs) => [...gs, { key: `new-${++draftSeq}`, id: null, ...EMPTY_MIS, errors: {}, editing: true, saving: false }])

    const cancel = (g) => {
        if (!g.id) { setGroups((gs) => gs.filter((x) => x.key !== g.key)); return }
        const o = g.orig
        patch(g.key, { emails: o.emails, schedule_time: o.schedule_time, errors: {}, editing: false })
    }

    const edit = (g) => patch(g.key, { editing: true, orig: { emails: g.emails, schedule_time: g.schedule_time } })

    const save = async (g) => {
        const errors = validateMis(g)
        patch(g.key, { errors })
        if (Object.keys(errors).length) return
        patch(g.key, { saving: true })
        const body = { email: g.emails.join(", "), schedule_time: `${g.schedule_time}:00` }
        const { ok, data } = g.id
            ? await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}${g.id}/`, { method: "PATCH", body })
            : await rawRequest(DELIVERY_SUMMARY_CUSTOMERS, { method: "POST", body: { ...body, customer: Number(customerId), Delivery_summary: true } })
        if (!ok) {
            patch(g.key, { saving: false })
            ErrorToaster(messageOf(data, "Could not save the MIS group"))
            return
        }
        SucceesToaster(g.id ? "MIS group updated" : "MIS group added")
        await load()
        onChanged?.("MIS settings saved")
    }

    const remove = async (g) => {
        if (!g.id) { setGroups((gs) => gs.filter((x) => x.key !== g.key)); return }
        if (!window.confirm(`Remove this MIS group (${g.emails.join(", ")})?`)) return
        patch(g.key, { saving: true })
        const { ok, data } = await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}${g.id}/`, { method: "DELETE" })
        if (!ok) {
            patch(g.key, { saving: false })
            ErrorToaster(messageOf(data, "Could not remove the MIS group"))
            return
        }
        SucceesToaster("MIS group removed")
        await load()
        onChanged?.("MIS group removed")
    }

    if (groups === null) return <div className="py-2"><Spinner size="sm" /> Loading MIS settings...</div>

    const icon = "inline-flex h-6 w-6 items-center justify-center rounded border-0 bg-transparent p-0 disabled:opacity-40"

    return (
        <div>
            <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
            <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Daily MIS</div>
                <Button size="sm" color="primary" outline onClick={add}>+ Add MIS group</Button>
            </div>
            {groups.length === 0 ? (
                <p className="mb-2 text-sm text-warning-500">No MIS group yet. Add one to send the daily summary to a set of emails.</p>
            ) : (
                <div className="mb-2 overflow-x-auto rounded-md border border-line">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[rgb(var(--overlay-rgb)/0.08)] text-left text-xs uppercase tracking-wide text-ink-muted">
                                <th className="w-10 px-3 py-2 font-semibold">#</th>
                                <th className="px-3 py-2 font-semibold">Recipient emails</th>
                                <th className="w-44 px-3 py-2 font-semibold">Send daily at (IST)</th>
                                <th className="w-28 px-3 py-2 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((g, i) => (
                                <tr key={g.key} className="border-t border-line align-top">
                                    <td className="px-3 py-2 text-ink-muted">{i + 1}</td>
                                    {g.editing ? (
                                        <>
                                            <td className="px-3 py-2">
                                                <MisEmailsInput value={g} errors={g.errors} onChange={(p) => patch(g.key, { ...p, errors: {} })} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input type="time" value={g.schedule_time || ""} invalid={!!g.errors.schedule_time} onChange={(e) => patch(g.key, { schedule_time: e.target.value, errors: {} })} />
                                                {g.errors.schedule_time && <div className="mt-1 text-xs text-danger-500">{g.errors.schedule_time}</div>}
                                            </td>
                                            <td className="px-3 py-2"><div className="flex items-center gap-3">
                                                <button type="button" title="Save" aria-label="Save" disabled={g.saving} onClick={() => save(g)} className={`${icon} text-success-500`}>
                                                    {g.saving ? <Spinner size="sm" /> : <MdCheck size={16} />}
                                                </button>
                                                <button type="button" title="Cancel" aria-label="Cancel" disabled={g.saving} onClick={() => cancel(g)} className={`${icon} text-ink-muted`}>
                                                    <MdClose size={16} />
                                                </button>
                                            </div></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {g.emails.map((m) => (
                                                        <span key={m} className="rounded-full border border-line bg-[rgb(var(--overlay-rgb)/0.08)] px-2.5 py-0.5 text-xs">{m}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">{g.schedule_time}</td>
                                            <td className="px-3 py-2"><div className="flex items-center gap-3">
                                                <button type="button" title="Edit" aria-label="Edit" onClick={() => edit(g)} className={`${icon} text-brand-500`}>
                                                    <MdEdit size={15} />
                                                </button>
                                                <button type="button" title="Delete" aria-label="Delete" disabled={g.saving} onClick={() => remove(g)} className={`${icon} text-danger-500`}>
                                                    <MdDelete size={15} />
                                                </button>
                                            </div></td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="mb-2 text-xs text-ink-muted">The daily delivery summary (last 15 days, Excel) starts at go-live.</p>
        </div>
    )
}

MisGroups.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onChanged: PropTypes.func,
}

export default MisGroups
