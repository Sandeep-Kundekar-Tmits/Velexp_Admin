import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Select from "react-select"
import { Badge, Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { useExcelExport } from "../../hooks/useExcelExport"
import {
    PINCODE_MASTER_API,
    PINCODE_MASTER_BULK_UPSERT,
    PINCODE_MASTER_BULK_DELETE,
    PINCODE_MASTER_STATES_API,
    PINCODE_MASTER_CITIES_API,
} from "../../api"

// main-pincode-master is a plain DRF REST resource (count/next/previous/results,
// {detail: "..."} on error) -- NOT this app's usual "get-list"/{status:1,msg}
// envelope, so this reads rawRequest's {ok, data} directly instead of going
// through usePostApiCall/useGetApiCall/etc. Those hooks only ever look for
// result?.error / result?.msg, which a plain DRF error body doesn't have, so
// every failure here would otherwise toast a blank message and leave the
// table looking like it silently returned no data. Same reasoning as
// ServiceCentrePincodes.jsx's identical bypass.
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const KIND_OPTIONS = [
    { value: "", label: "All kinds" },
    { value: "REAL", label: "Real" },
    { value: "HYPERLOCAL_PLACEHOLDER", label: "Hyperlocal placeholder" },
]
const ACTIVE_OPTIONS = [
    { value: "", label: "Active + inactive" },
    { value: "true", label: "Active only" },
    { value: "false", label: "Inactive only" },
]
const METRO_OPTIONS = [
    { value: "", label: "Metro + non-metro" },
    { value: "true", label: "Metro only" },
    { value: "false", label: "Non-metro only" },
]

const EMPTY_FORM = { pincode: "", state: "", city: "", region: "", zone: "", is_metro: false, kind: "REAL", is_active: true, allowNewCity: false }

const stateOf = (row) => row?.state?.name || row?.state_name || row?.state || ""
const cityOf = (row) => row?.city?.name || row?.city_name || row?.city || ""

const PincodeMasterPincodesTab = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // reference data for the filter bar + form pickers
    const [stateOptions, setStateOptions] = useState([])
    const [cityOptions, setCityOptions] = useState([])

    useEffect(() => {
        (async () => {
            const { ok, data } = await rawRequest(PINCODE_MASTER_STATES_API, { method: "GET" })
            if (ok) {
                const list = Array.isArray(data) ? data : data?.results || []
                setStateOptions(list.map((s) => ({ value: s.name, label: s.name })))
            }
        })()
    }, [])
    useEffect(() => {
        (async () => {
            const { ok, data } = await rawRequest(PINCODE_MASTER_CITIES_API, { method: "GET" })
            if (ok) {
                const list = Array.isArray(data) ? data : data?.results || []
                setCityOptions(list.map((c) => ({ value: c.name, label: c.name, state: c.state_name || c.state?.name || c.state || "" })))
            }
        })()
    }, [])

    // filter bar (server-side — this list can be large, so filtering hits the API,
    // not TableContainer's client-only global filter)
    const [q, setQ] = useState("")
    const [stateFilter, setStateFilter] = useState(null)
    const [cityFilter, setCityFilter] = useState(null)
    const [kindFilter, setKindFilter] = useState(KIND_OPTIONS[0])
    const [activeFilter, setActiveFilter] = useState(ACTIVE_OPTIONS[0])
    const [metroFilter, setMetroFilter] = useState(METRO_OPTIONS[0])

    const [pincodes, setPincodes] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState(null)
    const [selectedIds, setSelectedIds] = useState(() => new Set())

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams()
        if (q.trim()) params.set("q", q.trim())
        if (stateFilter?.value) params.set("state", stateFilter.value)
        if (cityFilter?.value) params.set("city", cityFilter.value)
        if (kindFilter?.value) params.set("kind", kindFilter.value)
        if (activeFilter?.value) params.set("is_active", activeFilter.value)
        if (metroFilter?.value) params.set("is_metro", metroFilter.value)
        params.set("page_size", "500")
        return params.toString()
    }, [q, stateFilter, cityFilter, kindFilter, activeFilter, metroFilter])

    const load = useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_API}?${buildQuery()}`, { method: "GET" })
            if (ok) {
                setPincodes(Array.isArray(data) ? data : data?.results || [])
                setSelectedIds(new Set())
            } else {
                setPincodes([])
                const msg = errorMessage(data, "Failed to load pincodes")
                setLoadError(msg)
                ErrorToaster(msg)
            }
        } catch {
            setPincodes([])
            setLoadError("Failed to load pincodes — network error")
            ErrorToaster("Failed to load pincodes — network error")
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildQuery])

    useEffect(() => { load() }, [load])

    // add / edit
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true) }
    const openEdit = (row) => {
        setEditing(row)
        setForm({
            pincode: row.pincode, state: stateOf(row), city: cityOf(row),
            region: row.region || "", zone: row.zone || "", is_metro: !!row.is_metro,
            kind: row.kind || "REAL", is_active: row.is_active ?? true, allowNewCity: false,
        })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.pincode.trim() || !form.state.trim() || !form.city.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const { ok, data } = await rawRequest(`${PINCODE_MASTER_API}${editing.pincode}/`, {
                    method: "PATCH",
                    body: {
                        state: form.state, city: form.city, region: form.region, zone: form.zone,
                        is_metro: form.is_metro, kind: form.kind, is_active: form.is_active,
                    },
                })
                if (ok) { SucceesToaster("Pincode updated successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to update pincode"))
            } else {
                const payload = {
                    pincode: form.pincode.trim(), state: form.state, city: form.city,
                    region: form.region, zone: form.zone, is_metro: form.is_metro, kind: form.kind,
                }
                if (form.allowNewCity) payload.create_city = true
                const { ok, data } = await rawRequest(PINCODE_MASTER_API, { method: "POST", body: payload })
                if (ok) { SucceesToaster("Pincode created successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to create pincode"))
            }
        } finally {
            setSaving(false)
        }
    }

    // delete (soft)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_API}${deleteTarget.pincode}/`, { method: "DELETE" })
            if (ok) { setDeleteTarget(null); load() }
            else ErrorToaster(errorMessage(data, "Failed to delete pincode"))
        } finally {
            setDeleting(false)
        }
    }

    // bulk delete (soft) for selected rows
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
    const [bulkDeleting, setBulkDeleting] = useState(false)
    const handleBulkDelete = async () => {
        setBulkDeleting(true)
        try {
            const { ok, data } = await rawRequest(PINCODE_MASTER_BULK_DELETE, {
                method: "POST",
                body: { pincodes: Array.from(selectedIds), hard: false },
            })
            if (ok) {
                SucceesToaster(`Deleted ${data?.affected ?? selectedIds.size} pincode(s)`)
                setBulkDeleteOpen(false)
                setSelectedIds(new Set())
                load()
            } else {
                ErrorToaster(errorMessage(data, "Bulk delete failed"))
            }
        } finally {
            setBulkDeleting(false)
        }
    }

    // bulk upload (xlsx/csv -> bulk-upsert)
    const fileInputRef = useRef(null)
    const [uploadFile, setUploadFile] = useState(null)
    const [uploadCreateCity, setUploadCreateCity] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState(null)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const { exportToExcel, isExporting: templateExporting } = useExcelExport()

    const downloadTemplate = () => exportToExcel(
        [
            { pincode: "400001", state: "Maharashtra", city: "Mumbai", region: "WEST", zone: "WEST", is_metro: true, kind: "REAL", is_active: true },
            { pincode: "400002", state: "Maharashtra", city: "Mumbai", region: "", zone: "", is_metro: "", kind: "", is_active: "" },
        ],
        "Pincode_Master_Bulk_Upload_Template"
    )

    const handleFileChange = (e) => {
        setUploadFile(e.target.files?.[0] || null)
        setUploadResult(null)
    }

    const handleUpload = async () => {
        if (!uploadFile) return
        setUploading(true)
        try {
            const form = new FormData()
            form.append("file", uploadFile)
            form.append("atomic", "true")
            form.append("create_city", uploadCreateCity ? "true" : "false")
            const { ok, data } = await rawRequest(PINCODE_MASTER_BULK_UPSERT, { method: "POST", body: form })
            if (ok) {
                setUploadResult(data)
                if (data?.errors?.length) console.warn("Pincode bulk-upsert errors:", data.errors)
                else {
                    setUploadFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                }
                load()
            } else {
                ErrorToaster(errorMessage(data, "Upload failed"))
            }
        } finally {
            setUploading(false)
        }
    }

    // Filters tuck away once the table area is scrolled, so the rows get the
    // room back — reappear once scrolled back near the top.
    const scrollAreaRef = useRef(null)
    const [filtersVisible, setFiltersVisible] = useState(true)
    const handleScroll = () => {
        const top = scrollAreaRef.current?.scrollTop ?? 0
        setFiltersVisible(top < 24)
    }

    const allSelected = pincodes.length > 0 && selectedIds.size === pincodes.length
    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(pincodes.map((p) => p.pincode)))
    }
    const toggleSelectOne = (pincode) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(pincode)) next.delete(pincode)
            else next.add(pincode)
            return next
        })
    }

    const columns = useMemo(() => [
        {
            id: "select", enableSorting: false,
            header: () => <Input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />,
            cell: ({ row }) => <Input type="checkbox" checked={selectedIds.has(row.original.pincode)} onChange={() => toggleSelectOne(row.original.pincode)} />,
        },
        { header: "Pincode", accessorKey: "pincode", enableSorting: true },
        { header: "State", id: "state", enableSorting: false, cell: ({ row }) => stateOf(row.original) || "—" },
        { header: "City", id: "city", enableSorting: false, cell: ({ row }) => cityOf(row.original) || "—" },
        { header: "Region", accessorKey: "region", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Zone", accessorKey: "zone", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Kind", accessorKey: "kind", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() === "REAL" ? "success" : "warning"} pill>{getValue() === "REAL" ? "Real" : "Hyperlocal"}</Badge>,
        },
        {
            header: "Metro", accessorKey: "is_metro", enableSorting: true,
            cell: ({ getValue }) => getValue() ? "Yes" : "No",
        },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button color="primary" size="sm" onClick={() => openEdit(row.original)}>Edit</Button>
                    <Button color="danger" size="sm" onClick={() => setDeleteTarget(row.original)}>Delete</Button>
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [selectedIds, allSelected, pincodes])

    return (
        <div className="page-fit-body">
            <div className="flex justify-between items-end mb-3 gap-3 flex-wrap">
                <div className="flex gap-2 items-end">
                    <Button color="secondary" onClick={load}>Search</Button>
                    {selectedIds.size > 0 && (
                        <Button color="danger" onClick={() => setBulkDeleteOpen(true)}>
                            Delete selected ({selectedIds.size})
                        </Button>
                    )}
                </div>
                <div className="flex gap-2 items-end flex-wrap">
                    <Button color="secondary" onClick={() => setUploadModalOpen(true)}>Bulk Upload</Button>
                    <Button color="primary" onClick={openCreate}>+ Add Pincode</Button>
                </div>
            </div>

            {loadError && (
                <div className="alert alert-danger py-2 mb-3">{loadError}</div>
            )}

            {/* Everything below scrolls together as one area; the filter row
                above the table tucks away once that scroll moves past the top,
                so the rows get the screen space back. */}
            <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                className="scroll-slim"
                style={{ maxHeight: "72vh", overflowY: "auto" }}
            >
                <div
                    className="flex flex-nowrap items-end gap-3 mb-3 overflow-x-auto pb-1 transition-all"
                    style={filtersVisible ? {} : { maxHeight: 0, marginBottom: 0, overflow: "hidden", opacity: 0 }}
                >
                    <div style={{ minWidth: 220 }}>
                        <Label>Search</Label>
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && load()}
                            placeholder="Pincode, city or state"
                        />
                    </div>
                    <div style={{ minWidth: 170 }}>
                        <Label>State</Label>
                        <Select isClearable options={stateOptions} value={stateFilter} onChange={setStateFilter} styles={customStyles} menuPortalTarget={document.body} placeholder="All" />
                    </div>
                    <div style={{ minWidth: 170 }}>
                        <Label>City</Label>
                        <Select isClearable options={cityOptions.filter((c) => !stateFilter?.value || c.state === stateFilter.value)} value={cityFilter} onChange={setCityFilter} styles={customStyles} menuPortalTarget={document.body} placeholder="All" />
                    </div>
                    <div style={{ minWidth: 170 }}>
                        <Label>Kind</Label>
                        <Select options={KIND_OPTIONS} value={kindFilter} onChange={setKindFilter} styles={customStyles} menuPortalTarget={document.body} />
                    </div>
                    <div style={{ minWidth: 170 }}>
                        <Label>Status</Label>
                        <Select options={ACTIVE_OPTIONS} value={activeFilter} onChange={setActiveFilter} styles={customStyles} menuPortalTarget={document.body} />
                    </div>
                    <div style={{ minWidth: 170 }}>
                        <Label>Metro</Label>
                        <Select options={METRO_OPTIONS} value={metroFilter} onChange={setMetroFilter} styles={customStyles} menuPortalTarget={document.body} />
                    </div>
                </div>

                {loading ? (
                    <Loader message="Loading pincodes…" fullscreen={false} />
                ) : (
                    <TableContainer
                        columns={columns}
                        data={pincodes}
                        isGlobalFilter={false}
                        isPagination={true}
                        isCustomPageSize={true}
                        SearchPlaceholder="Search From Table"
                        pagination="pagination"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                        theadClass="sticky top-0 z-10"
                        isStickyHeader={true}
                        stickyTop={0}
                    />
                )}
            </div>

            <SimpleModal
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                successButtonName={editing ? "Save" : "Create"}
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
                size="lg"
            >
                <h5 className="mb-4">{editing ? `Edit Pincode ${editing.pincode}` : "Add Pincode"}</h5>
                <div className="grid grid-cols-2 gap-3">
                    <FormGroup>
                        <Label>Pincode *</Label>
                        <Input
                            value={form.pincode}
                            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                            disabled={!!editing}
                            placeholder="400001"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Kind</Label>
                        <Select options={KIND_OPTIONS.slice(1)} value={KIND_OPTIONS.slice(1).find((o) => o.value === form.kind)} onChange={(opt) => setForm({ ...form, kind: opt.value })} styles={customStyles} menuPortalTarget={document.body} />
                    </FormGroup>
                    <FormGroup>
                        <Label>State *</Label>
                        <Select
                            options={stateOptions}
                            value={stateOptions.find((o) => o.value === form.state) || null}
                            onChange={(opt) => setForm({ ...form, state: opt?.value || "", city: "" })}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            placeholder="Select state"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>City *</Label>
                        {form.allowNewCity ? (
                            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="New city name" />
                        ) : (
                            <Select
                                options={cityOptions.filter((c) => !form.state || c.state === form.state)}
                                value={cityOptions.find((o) => o.value === form.city) || null}
                                onChange={(opt) => setForm({ ...form, city: opt?.value || "" })}
                                styles={customStyles}
                                menuPortalTarget={document.body}
                                placeholder="Select city"
                            />
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label>Region</Label>
                        <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="WEST" />
                    </FormGroup>
                    <FormGroup>
                        <Label>Zone</Label>
                        <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="WEST" />
                    </FormGroup>
                </div>

                {!editing && (
                    <FormGroup check>
                        <Input type="checkbox" id="allowNewCity" checked={form.allowNewCity} onChange={(e) => setForm({ ...form, allowNewCity: e.target.checked, city: "" })} />
                        <Label for="allowNewCity" className="mb-0">City doesn't exist yet — create it</Label>
                    </FormGroup>
                )}
                <FormGroup check>
                    <Input type="checkbox" id="is_metro" checked={form.is_metro} onChange={(e) => setForm({ ...form, is_metro: e.target.checked })} />
                    <Label for="is_metro" className="mb-0">Metro</Label>
                </FormGroup>
                {editing && (
                    <FormGroup check>
                        <Input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                        <Label for="is_active" className="mb-0">Active</Label>
                    </FormGroup>
                )}
                {saving && <div className="text-xs text-ink-muted">Saving…</div>}
            </SimpleModal>

            <DeleteModal show={!!deleteTarget} onCloseClick={() => setDeleteTarget(null)} onDeleteClick={handleDelete} loading={deleting} />

            <DeleteModal
                show={bulkDeleteOpen}
                onCloseClick={() => setBulkDeleteOpen(false)}
                onDeleteClick={handleBulkDelete}
                loading={bulkDeleting}
            />

            <SimpleModal
                isOpen={uploadModalOpen}
                setIsOpen={setUploadModalOpen}
                cancelButtonName="Close"
                onCancel={() => { setUploadFile(null); setUploadResult(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
            >
                <h5 className="mb-4">Bulk Upload Pincodes</h5>

                <div className="mb-4">
                    <div className="text-xs font-medium text-ink-muted mb-1">Step 1 — get the template</div>
                    <Button color="secondary" outline size="sm" onClick={downloadTemplate} disabled={templateExporting}>
                        {templateExporting ? "Preparing…" : "Download Template"}
                    </Button>
                </div>

                <div className="mb-4">
                    <div className="text-xs font-medium text-ink-muted mb-1">Step 2 — choose your file</div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="text-xs cursor-pointer file:mr-2 file:cursor-pointer file:rounded file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-brand-600"
                    />
                    {uploadFile && <div className="text-xs text-ink-muted mt-1">Selected: {uploadFile.name}</div>}
                </div>

                <div className="mb-4">
                    <FormGroup check className="mb-0">
                        <Input type="checkbox" id="uploadCreateCity" checked={uploadCreateCity} onChange={(e) => setUploadCreateCity(e.target.checked)} />
                        <Label for="uploadCreateCity" className="mb-0">Create new cities if they don't exist yet</Label>
                    </FormGroup>
                </div>

                <div className="mb-4">
                    <div className="text-xs font-medium text-ink-muted mb-1">Step 3 — upload</div>
                    <Button color="primary" onClick={handleUpload} disabled={!uploadFile || uploading}>
                        {uploading ? "Uploading…" : "Upload"}
                    </Button>
                </div>

                {uploadResult && (
                    <div className={`alert ${uploadResult.errors?.length ? "alert-warning" : "alert-success"} py-2 mb-0`}>
                        Created: {uploadResult.created ?? 0}, Updated: {uploadResult.updated ?? 0}
                        {uploadResult.errors?.length ? `, ${uploadResult.errors.length} row(s) with errors — see browser console.` : ""}
                    </div>
                )}
            </SimpleModal>
        </div>
    )
}

export default PincodeMasterPincodesTab
