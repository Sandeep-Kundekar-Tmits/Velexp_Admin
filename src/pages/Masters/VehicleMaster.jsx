// Vehicle Master (ops_vendor.VendorVehicle) -- plain DRF REST resource under
// /api/admin-panel/, same family as PincodeMaster*/WalletManualCredit.jsx, so
// this calls rawRequest directly rather than the generic use*ApiCall hooks.
// Every write succeeds locally regardless of the best-effort sync out to a
// third-party trip-management API (Elixia); each row's elixia_sync_status
// ('synced'/'pending'/'error') just reports that sync's health.
//
// "Vendor" has no directory/picker endpoint in this app yet (none exists in
// the API collection this page was built from), so it's a plain numeric ID
// field rather than a searchable select -- flagged in the form itself.
import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import { Badge, Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import DeleteModal from "../../components/Common/DeleteModal"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { useQuery } from "@tanstack/react-query"
import { qk } from "@/lib/queryKeys"
import { fetchServiceCentreDirectory } from "@/services/reference.service"
import {
    VEHICLE_MASTER_API,
    VEHICLE_MASTER_PREFER,
    VEHICLE_MASTER_UNPREFER,
    VEHICLE_MASTER_ACTIVATE,
    VEHICLE_MASTER_DEACTIVATE,
} from "../../api"

const CATEGORY_OPTIONS = [
    { value: "Owned", label: "Owned" },
    { value: "Rented", label: "Rented" },
]
const STATUS_OPTIONS = [
    { value: "", label: "Active + inactive" },
    { value: "true", label: "Active only" },
    { value: "false", label: "Inactive only" },
]

const SYNC_BADGE = {
    synced: { color: "success", label: "Synced" },
    pending: { color: "warning", label: "Pending" },
    error: { color: "danger", label: "Error" },
}

const unwrapRows = (data) => Array.isArray(data) ? data : data?.results || []
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const EMPTY_FORM = {
    vendor: "", vehicle_number: "", vehicle_type: "", vehicle_capacity: "",
    vehicle_category: "Owned", driver_name: "", driver_phone_no: "", elixia_vehicle_type_label: "",
}

const VehicleMaster = () => {
    useEffect(() => { document.title = "Vehicle Master" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // Service centre directory (id + code + company name) for the "preferred
    // for" filter and the Prefer/Unprefer action -- a different fetch from
    // the simpler SERVICE_CENTER list (that one only carries codes, no id,
    // and the vehicle API's prefer/unprefer/preferred_for all take an id).
    const { data: scDirectory } = useQuery({
        queryKey: qk.reference.serviceCentreDirectory(),
        queryFn: fetchServiceCentreDirectory,
        staleTime: 30 * 60_000,
    })
    const scOptions = useMemo(() => {
        const list = Array.isArray(scDirectory) ? scDirectory : scDirectory?.results?.results || scDirectory?.results || []
        return list.map((sc) => ({
            value: sc.id,
            label: sc.company_name ? `${sc.service_center_code} — ${sc.company_name}` : sc.service_center_code,
        }))
    }, [scDirectory])

    // ── filters + list ──────────────────────────────────────────────────
    const [search, setSearch] = useState("")
    const [vendorFilter, setVendorFilter] = useState("")
    const [scFilter, setScFilter] = useState(null)
    const [activeFilter, setActiveFilter] = useState(STATUS_OPTIONS[0])

    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(null)

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams()
        if (search.trim()) params.set("search", search.trim())
        if (vendorFilter.trim()) params.set("vendor", vendorFilter.trim())
        if (scFilter?.value) params.set("preferred_for", scFilter.value)
        if (activeFilter?.value) params.set("is_active", activeFilter.value)
        params.set("page_size", "500")
        return params.toString()
    }, [search, vendorFilter, scFilter, activeFilter])

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const { ok, data } = await rawRequest(`${VEHICLE_MASTER_API}?${buildQuery()}`, { method: "GET" })
            if (ok) {
                setRows(unwrapRows(data))
            } else {
                setRows([])
                const msg = errorMessage(data, "Failed to load vehicles")
                setLoadError(msg)
                ErrorToaster(msg)
            }
        } catch {
            setRows([])
            setLoadError("Failed to load vehicles — network error")
            ErrorToaster("Failed to load vehicles — network error")
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
            vendor: row.vendor ?? "",
            vehicle_number: row.vehicle_number || "",
            vehicle_type: row.vehicle_type || "",
            vehicle_capacity: row.vehicle_capacity || "",
            vehicle_category: row.vehicle_category || "Owned",
            driver_name: row.driver_name || "",
            driver_phone_no: row.driver_phone_no || "",
            elixia_vehicle_type_label: row.elixia_vehicle_type_label || "",
        })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.vehicle_number.trim()) { ErrorToaster("Vehicle number is required"); return }
        if (!editing && !form.vendor) { ErrorToaster("Vendor is required"); return }

        setSaving(true)
        try {
            const payload = {
                vehicle_number: form.vehicle_number.trim(),
                vehicle_type: form.vehicle_type.trim(),
                vehicle_capacity: form.vehicle_capacity.trim(),
                vehicle_category: form.vehicle_category,
                driver_name: form.driver_name.trim(),
                driver_phone_no: form.driver_phone_no.trim(),
            }
            if (form.elixia_vehicle_type_label.trim()) payload.elixia_vehicle_type_label = form.elixia_vehicle_type_label.trim()
            if (!editing) payload.vendor = Number(form.vendor)

            const { ok, data } = editing
                ? await rawRequest(`${VEHICLE_MASTER_API}${editing.id}/`, { method: "PATCH", body: payload })
                : await rawRequest(VEHICLE_MASTER_API, { method: "POST", body: payload })

            if (ok) {
                const sync = data?.result?.elixia_sync_status || data?.elixia_sync_status
                SucceesToaster(
                    editing ? "Vehicle updated successfully" : `Vehicle created successfully${sync ? ` (Elixia: ${sync})` : ""}`
                )
                setFormOpen(false)
                load()
            } else {
                ErrorToaster(errorMessage(data, editing ? "Failed to update vehicle" : "Failed to create vehicle"))
            }
        } finally {
            setSaving(false)
        }
    }

    // ── activate / deactivate ───────────────────────────────────────────
    const [togglingId, setTogglingId] = useState(null)
    const handleToggleActive = async (row) => {
        setTogglingId(row.id)
        try {
            const url = row.is_active ? VEHICLE_MASTER_DEACTIVATE(row.id) : VEHICLE_MASTER_ACTIVATE(row.id)
            const { ok, data } = await rawRequest(url, { method: "POST" })
            if (ok) {
                SucceesToaster(row.is_active ? "Vehicle deactivated" : "Vehicle activated")
                load()
            } else {
                ErrorToaster(errorMessage(data, "Failed to update vehicle status"))
            }
        } finally {
            setTogglingId(null)
        }
    }

    // ── prefer / unprefer for a service centre ──────────────────────────
    const [preferTarget, setPreferTarget] = useState(null)
    const [preferSC, setPreferSC] = useState(null)
    const [preferSaving, setPreferSaving] = useState(false)

    const openPrefer = (row) => { setPreferTarget(row); setPreferSC(null) }

    const currentPreferredCodes = (row) => {
        const codes = row?.preferred_service_center_codes
        return Array.isArray(codes) ? codes : []
    }

    const handlePrefer = async (add) => {
        if (!preferSC) { ErrorToaster("Select a service centre first"); return }
        setPreferSaving(true)
        try {
            const url = add ? VEHICLE_MASTER_PREFER(preferTarget.id) : VEHICLE_MASTER_UNPREFER(preferTarget.id)
            const { ok, data } = await rawRequest(url, { method: "POST", body: { service_center: preferSC.value } })
            if (ok) {
                SucceesToaster(add ? "Added to shortlist" : "Removed from shortlist")
                setPreferTarget(null)
                load()
            } else {
                ErrorToaster(errorMessage(data, "Failed to update the shortlist"))
            }
        } finally {
            setPreferSaving(false)
        }
    }

    // ── delete (soft) ────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${VEHICLE_MASTER_API}${deleteTarget.id}/`, { method: "DELETE" })
            if (ok) { setDeleteTarget(null); load() }
            else ErrorToaster(errorMessage(data, "Failed to delete vehicle"))
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "Vehicle No", accessorKey: "vehicle_number", enableSorting: true },
        { header: "Type", accessorKey: "vehicle_type", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Capacity", accessorKey: "vehicle_capacity", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Category", accessorKey: "vehicle_category", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Vendor", accessorKey: "vendor", enableSorting: true, cell: ({ row }) => row.original.vendor_name || row.original.vendor || "—" },
        { header: "Driver", accessorKey: "driver_name", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Driver Phone", accessorKey: "driver_phone_no", cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Preferred SCs", id: "preferred", enableSorting: false,
            cell: ({ row }) => {
                const codes = currentPreferredCodes(row.original)
                return codes.length ? codes.join(", ") : "—"
            },
        },
        {
            header: "Elixia Sync", accessorKey: "elixia_sync_status", enableSorting: true,
            cell: ({ getValue }) => {
                const status = getValue()
                const cfg = SYNC_BADGE[status] || { color: "secondary", label: status || "—" }
                return <Badge color={cfg.color} pill>{cfg.label}</Badge>
            },
        },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                    <Button color="primary" size="sm" onClick={() => openEdit(row.original)}>Edit</Button>
                    <Button color="secondary" size="sm" onClick={() => openPrefer(row.original)}>SC Shortlist</Button>
                    <Button
                        color={row.original.is_active ? "warning" : "success"}
                        size="sm"
                        onClick={() => handleToggleActive(row.original)}
                        disabled={togglingId === row.original.id}
                    >
                        {togglingId === row.original.id ? "…" : row.original.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button color="danger" size="sm" onClick={() => setDeleteTarget(row.original)}>Delete</Button>
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [togglingId])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Vehicle Master"
                subTitle="Fleet vehicles — synced out to the trip-management (Elixia) integration best-effort; every write here always succeeds locally first."
                extraFields={<Button color="primary" onClick={openCreate}>+ Add Vehicle</Button>}
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">Search</Label>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="Vehicle no, driver, vendor, elixia code…"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-36">
                        <Label className="form-label m-0 font-bold text-ink-muted">Vendor ID</Label>
                        <Input
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="e.g. 12"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">Preferred for SC</Label>
                        <Select
                            isClearable
                            options={scOptions}
                            value={scFilter}
                            onChange={setScFilter}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            placeholder="All (not restricted to any SC)"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">Status</Label>
                        <Select
                            options={STATUS_OPTIONS}
                            value={activeFilter}
                            onChange={setActiveFilter}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                        />
                    </div>
                    <Button color="secondary" onClick={load}>Search</Button>
                </div>

                {loadError && <div className="alert alert-danger py-2 mt-3">{loadError}</div>}

                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader message="Loading vehicles…" fullscreen={false} />
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
                <h5 className="mb-4">{editing ? `Edit Vehicle ${editing.vehicle_number}` : "Add Vehicle"}</h5>
                <div className="grid grid-cols-2 gap-3">
                    {!editing && (
                        <FormGroup>
                            <Label>Vendor ID *</Label>
                            <Input
                                type="number"
                                value={form.vendor}
                                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                                placeholder="e.g. 12"
                            />
                            {/* No vendor directory/search endpoint exists in this app
                                yet, so this is a raw id rather than a picker -- see
                                the file's own header comment. */}
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label>Vehicle Number *</Label>
                        <Input
                            value={form.vehicle_number}
                            onChange={(e) => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })}
                            disabled={!!editing}
                            placeholder="MH12AB1234"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Vehicle Type</Label>
                        <Input
                            value={form.vehicle_type}
                            onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                            placeholder="truck / tempo / van…"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Capacity</Label>
                        <Input
                            value={form.vehicle_capacity}
                            onChange={(e) => setForm({ ...form, vehicle_capacity: e.target.value })}
                            placeholder="e.g. 16"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Category</Label>
                        <Select
                            options={CATEGORY_OPTIONS}
                            value={CATEGORY_OPTIONS.find((o) => o.value === form.vehicle_category) || null}
                            onChange={(opt) => setForm({ ...form, vehicle_category: opt?.value || "" })}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Driver Name</Label>
                        <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
                    </FormGroup>
                    <FormGroup>
                        <Label>Driver Phone</Label>
                        <Input value={form.driver_phone_no} onChange={(e) => setForm({ ...form, driver_phone_no: e.target.value })} />
                    </FormGroup>
                    <FormGroup>
                        <Label>Elixia Type Label</Label>
                        <Input
                            value={form.elixia_vehicle_type_label}
                            onChange={(e) => setForm({ ...form, elixia_vehicle_type_label: e.target.value })}
                            placeholder='Optional override, e.g. "32FT"'
                        />
                    </FormGroup>
                </div>
                {saving && <div className="text-xs text-ink-muted mt-2">Saving…</div>}
            </SimpleModal>

            <SimpleModal
                isOpen={!!preferTarget}
                setIsOpen={(open) => !open && setPreferTarget(null)}
                cancelButtonName="Close"
                onCancel={() => setPreferTarget(null)}
            >
                <h5 className="mb-2">Service Centre Shortlist — {preferTarget?.vehicle_number}</h5>
                <p className="mb-4 text-xs text-ink-muted">
                    A convenience shortlist for quick picking at a service centre -- this does not restrict the vehicle from any other SC.
                </p>
                {currentPreferredCodes(preferTarget || {}).length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {currentPreferredCodes(preferTarget || {}).map((code) => (
                            <Badge key={code} color="info" pill>{code}</Badge>
                        ))}
                    </div>
                )}
                <FormGroup>
                    <Label>Service Centre</Label>
                    <Select
                        options={scOptions}
                        value={preferSC}
                        onChange={setPreferSC}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        placeholder="Select a service centre"
                    />
                </FormGroup>
                <div className="flex gap-2 mt-3">
                    <Button color="primary" onClick={() => handlePrefer(true)} disabled={preferSaving}>
                        {preferSaving ? "Saving…" : "Add to shortlist"}
                    </Button>
                    <Button color="secondary" outline onClick={() => handlePrefer(false)} disabled={preferSaving}>
                        {preferSaving ? "Saving…" : "Remove from shortlist"}
                    </Button>
                </div>
            </SimpleModal>

            <DeleteModal show={!!deleteTarget} onCloseClick={() => setDeleteTarget(null)} onDeleteClick={handleDelete} loading={deleting} />
        </div>
    )
}

export default VehicleMaster
