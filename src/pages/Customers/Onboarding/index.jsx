// Customer Onboarding list: corporate customers still being set up (Pending) and those already live.
// New customers are created on Add User (a Corporate one is created inactive) and continue in the wizard.
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button, Nav, NavItem, NavLink, Spinner } from "@/components/ui"
import MainHeaderComp from "../../../components/MainHeaderCom"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_CUSTOMERS } from "../../../api"
import { asList, callApi } from "./helpers"

const TABS = [
    { id: "PENDING", label: "Pending" },
    { id: "LIVE", label: "Live" },
]

// The list response is not documented beyond its filter, so read the usual field names.
const pick = (row, keys) => {
    for (const k of keys) {
        if (row?.[k] !== undefined && row[k] !== null && row[k] !== "") return row[k]
    }
    return ""
}
const dateText = (v) => {
    if (!v) return "—"
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB")
}

const CustomerOnboarding = () => {
    useEffect(() => { document.title = "Customer Onboarding" }, [])
    const { ErrorToaster } = ToasterProvider()
    const [tab, setTab] = useState(TABS[0].id)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        const { ok, status, data } = await callApi(`${ONBOARDING_CUSTOMERS}?status=${tab}`)
        setLoading(false)
        if (!ok) {
            ErrorToaster(status === 403 ? "Only an admin-panel user can use customer onboarding" : errText(data, "Could not load the customers"))
            setRows([])
            return
        }
        setRows(asList(data))
    }, [tab])

    useEffect(() => { load() }, [load])

    const link = (row) => {
        const id = pick(row, ["id", "customer_id", "user_id"])
        const nm = pick(row, ["customer_name", "name", "company_name", "username"])
        const q = new URLSearchParams()
        if (nm) q.set("name", nm)
        if (tab === "LIVE") q.set("live", "1")
        return `/customer-onboarding/${id}${q.toString() ? `?${q}` : ""}`
    }

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Customer Onboarding"
                subTitle="Set up a new corporate customer and send their credentials."
                extraFields={<Link to="/customer-onboarding/new" className="btn btn-sm btn-primary">New customer</Link>}
            />

            <div className="page-fit-body relative z-10 overflow-y-auto pb-4">
                <Nav tabs className="mb-3">
                    {TABS.map((t) => (
                        <NavItem key={t.id}>
                            <NavLink active={tab === t.id} onClick={() => setTab(t.id)} style={{ cursor: "pointer" }}>{t.label}</NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <div className="mb-2 flex items-center gap-2">
                    <Button size="sm" color="secondary" onClick={load} disabled={loading}>{loading ? <><Spinner size="sm" /> Loading...</> : "Refresh"}</Button>
                    <span className="text-xs text-ink-muted">{rows.length} customer(s)</span>
                </div>

                <div className="overflow-x-auto rounded border border-white/8">
                    <table className="w-full whitespace-nowrap text-sm">
                        <thead>
                            <tr className="bg-surface">
                                {["ID", "Customer", "Username", "Account No", "Email", "Status", "Created", "Action"].map((h) => (
                                    <th key={h} className="px-2 py-1.5 text-left font-semibold text-ink-muted">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={pick(r, ["id", "customer_id"]) || i} className="border-t border-white/8">
                                    <td className="px-2 py-1.5">{pick(r, ["id", "customer_id", "user_id"]) || "—"}</td>
                                    <td className="px-2 py-1.5 font-semibold">{pick(r, ["customer_name", "name", "company_name"]) || "—"}</td>
                                    <td className="px-2 py-1.5">{pick(r, ["username"]) || "—"}</td>
                                    <td className="px-2 py-1.5">{pick(r, ["accno", "account_no"]) || "—"}</td>
                                    <td className="px-2 py-1.5">{pick(r, ["email"]) || "—"}</td>
                                    <td className="px-2 py-1.5">{String(pick(r, ["onboarding_status", "status"]) || tab).replace(/_/g, " ")}</td>
                                    <td className="px-2 py-1.5">{dateText(pick(r, ["created_at", "date_joined", "created"]))}</td>
                                    <td className="px-2 py-1.5">
                                        <Link to={link(r)} className="btn btn-sm btn-primary">{tab === "PENDING" ? "Continue setup" : "Manage"}</Link>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={8} className="px-2 py-4 text-center text-ink-muted">{loading ? "Loading..." : tab === "PENDING" ? "No customers waiting for setup" : "No live customers yet"}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default CustomerOnboarding
