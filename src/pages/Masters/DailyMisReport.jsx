// Daily MIS Report -- per-customer scheduled delivery-summary emails. Plain
// DRF REST resource under /api/admin-panel/, same family as PincodeMaster/
// Wallet/VehicleMaster, so this calls rawRequest directly rather than the
// generic use*ApiCall hooks (their legacy-envelope error assumptions don't
// match plain DRF). "Delete" here is the API's own soft delete: it sets
// is_active=false and returns 204 rather than removing the row, so the row
// action is a plain Activate/Deactivate toggle, not a destructive delete.
import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import { Badge, Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { CORPORATE_CUSTOMERS_LIST, DELIVERY_SUMMARY_CUSTOMERS } from "../../api"

const STATUS_OPTIONS = [
    { value: "", label: "Active + inactive" },
    { value: "true", label: "Active only" },
    { value: "false", label: "Inactive only" },
]

// Matches the backend's own boolean fields verbatim (mixed-case, e.g.
// "SPD_summary") -- these are sent and received by that exact name.
const SUMMARY_FLAGS = [
    { key: "Delivery_summary", label: "Delivery" },
    { key: "SPD_summary", label: "SPD" },
    { key: "SPU_summary", label: "SPU" },
    { key: "PuneCity_summary", label: "Pune City" },
    { key: "PuneDistrict_summary", label: "Pune District" },
    { key: "Mumbai_summary", label: "Mumbai" },
    { key: "ROMH_summary", label: "ROMH" },
    { key: "Gujarat_summary", label: "Gujarat" },
    { key: "Ahmedabad_summary", label: "Ahmedabad" },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_MAX_LENGTH = 1000 // matches the API's own limit on the joined string

const EMPTY_FORM = {
    customer: null,
    report_name: "",
    email: "",
    schedule_time: "09:00",
    is_active: true,
    ...Object.fromEntries(SUMMARY_FLAGS.map((f) => [f.key, false])),
}

const unwrapRows = (data) => Array.isArray(data) ? data : data?.results || []
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const DailyMisReport = () => {
    useEffect(() => { document.title = "Daily MIS Report" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // Customer picker for the Add/Edit form -- same fetch + Corporate/
    // Franchise filter CustomerProductConfig.jsx already uses, since
    // "customer" here is the same accounts.User id.
    const { apifunc: fetchCustomers, data: customerListRaw, loading: customersLoading } = useGetApiCall()
    useEffect(() => { fetchCustomers(CORPORATE_CUSTOMERS_LIST) }, [fetchCustomers])
    const customerOptions = useMemo(() => {
        if (!customerListRaw?.user) return []
        return customerListRaw.user
            .filter((ele) => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
            .map((ele) => ({ value: ele.id, label: `${ele.customer_name} - ${ele.username}` }))
    }, [customerListRaw])

    // ── filters + list ──────────────────────────────────────────────────
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0])

    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(null)

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams()
        if (search.trim()) params.set("search", search.trim())
        if (statusFilter?.value) params.set("is_active", statusFilter.value)
        params.set("page_size", "200") // API max
        return params.toString()
    }, [search, statusFilter])

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const { ok, data } = await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}?${buildQuery()}`, { method: "GET" })
            if (ok) {
                setRows(unwrapRows(data))
            } else {
                setRows([])
                const msg = errorMessage(data, "Failed to load Daily MIS Report customers")
                setLoadError(msg)
                ErrorToaster(msg)
            }
        } catch {
            setRows([])
            setLoadError("Failed to load — network error")
            ErrorToaster("Failed to load — network error")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildQuery])

    useEffect(() => { load() }, [load])

    // ── add / edit ──────────────────────────────────────────────────────
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true) }
    const openEdit = (row) => {
        setEditing(row)
        setForm({
            customer: row.customer != null ? { value: row.customer, label: row.customer_name ? `${row.customer_name} - ${row.customer_username || ""}` : String(row.customer) } : null,
            report_name: row.report_name || "",
            email: row.email || "",
            schedule_time: (row.schedule_time || "09:00:00").slice(0, 5),
            is_active: !!row.is_active,
            ...Object.fromEntries(SUMMARY_FLAGS.map((f) => [f.key, !!row[f.key]])),
        })
        setFormOpen(true)
    }

    // Email addresses as removable chips instead of a raw comma-separated
    // textarea -- form.email itself stays the single joined string the API
    // actually wants; these just derive the chip list from it and write
    // back to it, so handleSave below needs no changes.
    const emailTags = useMemo(() => (
        form.email.split(",").map((s) => s.trim()).filter(Boolean).map((v) => ({ value: v, label: v }))
    ), [form.email])
    const [emailInput, setEmailInput] = useState("")

    const addEmailTag = (raw) => {
        const value = raw.trim().replace(/,+$/, "")
        if (!value) return
        if (!EMAIL_RE.test(value)) {
            ErrorToaster(`"${value}" doesn't look like a valid email`)
            return
        }
        if (emailTags.some((t) => t.value.toLowerCase() === value.toLowerCase())) {
            setEmailInput("")
            return
        }
        const next = [...emailTags.map((t) => t.value), value].join(", ")
        if (next.length > EMAIL_MAX_LENGTH) {
            ErrorToaster(`Email list can't be longer than ${EMAIL_MAX_LENGTH} characters`)
            return
        }
        setForm((f) => ({ ...f, email: next }))
        setEmailInput("")
    }

    const removeEmailTag = (value) => {
        const next = emailTags.filter((t) => t.value !== value).map((t) => t.value).join(", ")
        setForm((f) => ({ ...f, email: next }))
    }

    const handleSave = async () => {
        if (!editing && !form.customer) { ErrorToaster("Customer is required"); return }
        if (!form.email.trim()) { ErrorToaster("At least one email address is required"); return }

        setSaving(true)
        try {
            const payload = {
                report_name: form.report_name.trim(),
                email: form.email.trim(),
                schedule_time: `${form.schedule_time}:00`,
                is_active: form.is_active,
                ...Object.fromEntries(SUMMARY_FLAGS.map((f) => [f.key, form[f.key]])),
            }
            if (!editing) payload.customer = form.customer.value

            const { ok, data } = editing
                ? await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}${editing.id}/`, { method: "PATCH", body: payload })
                : await rawRequest(DELIVERY_SUMMARY_CUSTOMERS, { method: "POST", body: payload })

            if (ok) {
                SucceesToaster(editing ? "Updated successfully" : "Created successfully")
                setFormOpen(false)
                load()
            } else {
                ErrorToaster(errorMessage(data, editing ? "Failed to update" : "Failed to create"))
            }
        } finally {
            setSaving(false)
        }
    }

    // ── activate / deactivate (the API's own soft delete) ────────────────
    const [togglingId, setTogglingId] = useState(null)
    const handleToggleActive = async (row) => {
        setTogglingId(row.id)
        try {
            const { ok, data } = row.is_active
                ? await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}${row.id}/`, { method: "DELETE" })
                : await rawRequest(`${DELIVERY_SUMMARY_CUSTOMERS}${row.id}/`, { method: "PATCH", body: { is_active: true } })
            if (ok) {
                SucceesToaster(row.is_active ? "Deactivated" : "Activated")
                load()
            } else {
                ErrorToaster(errorMessage(data, "Failed to update status"))
            }
        } finally {
            setTogglingId(null)
        }
    }

    const columns = useMemo(() => [
        {
            header: "Customer", id: "customer", enableSorting: true,
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-ink">{row.original.customer_name || "—"}</div>
                    <div className="text-[11px] text-ink-muted">{row.original.customer_username || ""}</div>
                </div>
            ),
        },
        { header: "Report Name", accessorKey: "report_name", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Email", accessorKey: "email", enableSorting: false,
            cell: ({ getValue }) => <span className="block max-w-[260px] truncate" title={getValue() || ""}>{getValue() || "—"}</span>,
        },
        { header: "Schedule", accessorKey: "schedule_time", enableSorting: true, cell: ({ getValue }) => (getValue() || "—").slice(0, 5) },
        {
            header: "Reports", id: "flags", enableSorting: false,
            cell: ({ row }) => {
                const enabled = SUMMARY_FLAGS.filter((f) => row.original[f.key])
                if (!enabled.length) return "—"
                return (
                    <div className="flex flex-wrap gap-1">
                        {enabled.map((f) => <Badge key={f.key} color="info" pill>{f.label}</Badge>)}
                    </div>
                )
            },
        },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                    <Button color="primary" size="sm" onClick={() => openEdit(row.original)}>Edit</Button>
                    <Button
                        color={row.original.is_active ? "warning" : "success"}
                        size="sm"
                        onClick={() => handleToggleActive(row.original)}
                        disabled={togglingId === row.original.id}
                    >
                        {togglingId === row.original.id ? "…" : row.original.is_active ? "Deactivate" : "Activate"}
                    </Button>
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [togglingId])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Daily MIS Report"
                subTitle="Scheduled delivery-summary emails per customer."
                extraFields={<Button color="primary" onClick={openCreate}>+ Add Customer</Button>}
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">Search</Label>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="Username, customer, email, report name…"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">Status</Label>
                        <Select
                            options={STATUS_OPTIONS}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                        />
                    </div>
                    <Button color="secondary" onClick={load}>Search</Button>
                </div>

                {loadError && <div className="alert alert-danger py-2 mt-3">{loadError}</div>}

                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader message="Loading…" fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={rows}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            defaultPageSize={20}
                            SearchPlaceholder="Search within results..."
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="68vh"
                        />
                    )}
                </div>
            </div>

            <SimpleModal
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                successButtonName={saving ? "Saving…" : editing ? "Save" : "Create"}
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
                size="lg"
            >
                <h5 className="mb-4">{editing ? `Edit — ${editing.customer_name || ""}` : "Add Customer"}</h5>
                <div className="grid grid-cols-2 gap-3">
                    <FormGroup className="col-span-2">
                        <Label>Customer {!editing && "*"}</Label>
                        <Select
                            options={customerOptions}
                            value={form.customer}
                            onChange={(opt) => setForm({ ...form, customer: opt })}
                            isLoading={customersLoading}
                            isDisabled={!!editing}
                            placeholder="Select customer"
                            styles={customStyles}
                            menuPortalTarget={document.body}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Report Name</Label>
                        <Input
                            value={form.report_name}
                            onChange={(e) => setForm({ ...form, report_name: e.target.value })}
                            placeholder="e.g. Client Daily Delivery Summary"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Schedule Time *</Label>
                        <Input
                            type="time"
                            value={form.schedule_time}
                            onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                        />
                    </FormGroup>
                    <FormGroup className="col-span-2">
                        <Label>Email Addresses *</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") { e.preventDefault(); addEmailTag(emailInput) }
                                }}
                                placeholder="Enter email address"
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                color="secondary"
                                className="shrink-0"
                                onClick={() => addEmailTag(emailInput)}
                                disabled={!emailInput.trim()}
                            >
                                + Add
                            </Button>
                        </div>
                        {emailTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {emailTags.map((t) => (
                                    <span
                                        key={t.value}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-ink"
                                    >
                                        {t.value}
                                        <button
                                            type="button"
                                            onClick={() => removeEmailTag(t.value)}
                                            aria-label={`Remove ${t.value}`}
                                            className="leading-none text-ink-muted hover:text-danger-500"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="mt-1 text-[11px] text-ink-muted">Enter an email address and click Add (or press Enter); click × on a chip to remove it.</div>
                    </FormGroup>
                    <div className="col-span-2 flex items-center gap-2">
                        <Input
                            type="checkbox"
                            id="dmr-is-active"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        <Label for="dmr-is-active" className="mb-0 cursor-pointer">Active</Label>
                    </div>
                </div>

                <div className="mt-4">
                    <Label className="font-bold">Reports to Include</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                        {SUMMARY_FLAGS.map((f) => (
                            <div key={f.key} className="flex items-center gap-2">
                                <Input
                                    type="checkbox"
                                    id={`dmr-flag-${f.key}`}
                                    checked={!!form[f.key]}
                                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                                />
                                <Label for={`dmr-flag-${f.key}`} className="mb-0 cursor-pointer text-[13px]">{f.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                {saving && <div className="text-xs text-ink-muted mt-2">Saving…</div>}
            </SimpleModal>
        </div>
    )
}

export default DailyMisReport
