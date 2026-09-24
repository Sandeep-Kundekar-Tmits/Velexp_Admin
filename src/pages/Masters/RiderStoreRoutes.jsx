import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import Select from "react-select"
import { Badge, Button, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import MainHeaderComp from "../../components/MainHeaderCom"
import SimpleModal from "../../components/SimpleModal"
import Loader from "@/Loaders/Loader"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"
import { EMPLOYEE_LIST, SERVICE_CENTER_LIST, RIDER_STORE_ROUTES, BULK_ASSIGN_RIDER_STORE_ROUTES } from "../../api"

let storeRowKeySeq = 1

const RiderStoreRoutes = () => {
    useEffect(() => { document.title = "Rider Store Routes" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // Dark store / store picker -- both drawn from the same service centre
    // directory. There's no separate "dark store" master in this app, and
    // the sample codes in this feature's own spec ("DARK_STORE", "TESTSC_1")
    // read as service centre codes, so both roles reuse SERVICE_CENTER_LIST.
    const { apifunc: getServiceCentres, data: serviceCentreData, loading: centresLoading } = usePostApiCall()
    const [serviceCentres, setServiceCentres] = useState([])

    useEffect(() => { getServiceCentres(SERVICE_CENTER_LIST, {}) }, [getServiceCentres])
    useEffect(() => {
        if (serviceCentreData) setServiceCentres(serviceCentreData?.results?.results || serviceCentreData?.results || serviceCentreData || [])
    }, [serviceCentreData])

    const centreOptions = useMemo(() => serviceCentres.map((sc) => ({
        value: sc?.service_center_code,
        label: sc?.company_name ? `${sc?.service_center_code} — ${sc?.company_name}` : sc?.service_center_code,
    })), [serviceCentres])

    // Rider picker -- searched against the same paginated employee endpoint
    // EmployeeList.jsx uses, since the rider list can be large. loadOptions
    // is debounced by hand (setTimeout), matching this codebase's own search
    // debounce idiom elsewhere rather than pulling in a library for it.
    const { apifunc: searchEmployees } = usePostApiCall()
    const riderSearchTimeout = useRef(null)
    const [selectedRider, setSelectedRider] = useState(null)
    const [selectedDarkstore, setSelectedDarkstore] = useState(null)

    const loadRiderOptions = useCallback((inputValue, callback) => {
        if (riderSearchTimeout.current) clearTimeout(riderSearchTimeout.current)
        riderSearchTimeout.current = setTimeout(async () => {
            const result = await searchEmployees(EMPLOYEE_LIST, { page: "1", search: inputValue })
            const rows = result?.results?.results || result?.results || result || []
            callback(
                rows
                    .filter((emp) => emp?.employee_code)
                    .map((emp) => ({
                        value: emp.employee_code,
                        label: `${emp.employee_code} — ${emp.name || [emp.first_name, emp.last_name].filter(Boolean).join(" ") || ""}`.trim(),
                    }))
            )
        }, 400)
    }, [searchEmployees])

    // existing routes for the selected rider / dark store -- /api/admin-panel/
    // is a plain DRF REST resource, unlike the "get-list"/{status:1} envelope
    // every legacy endpoint in this app uses, so this reads rawRequest's {ok}
    // flag directly rather than going through usePostApiCall/useGetApiCall.
    const [routeRows, setRouteRows] = useState([])
    const [routesLoading, setRoutesLoading] = useState(false)
    const [hasLoadedRoutes, setHasLoadedRoutes] = useState(false)

    const loadRoutes = useCallback(async (employeeCode, darkstoreCode) => {
        if (!employeeCode && !darkstoreCode) { setRouteRows([]); return }
        setRoutesLoading(true)
        setHasLoadedRoutes(true)
        try {
            const params = new URLSearchParams()
            if (employeeCode) params.set("employee", employeeCode)
            if (darkstoreCode) params.set("darkstore", darkstoreCode)
            const { ok, data } = await rawRequest(`${RIDER_STORE_ROUTES}?${params.toString()}`, { method: "GET" })
            if (ok) setRouteRows(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [])
            else {
                setRouteRows([])
                ErrorToaster(data?.detail || data?.error || "Failed to load routes")
            }
        } catch {
            setRouteRows([])
            ErrorToaster("Failed to load routes")
        } finally {
            setRoutesLoading(false)
        }
    }, [])

    // Submit-triggered rather than firing on every dropdown change, so
    // picking through rider/dark-store search results doesn't fire a
    // request per intermediate selection.
    const handleViewRoute = () => {
        if (!selectedRider && !selectedDarkstore) { ErrorToaster("Select a rider and/or dark store first"); return }
        loadRoutes(selectedRider?.value, selectedDarkstore?.value)
    }

    // route builder -- an ordered list of {store, sequence} rows, submitted
    // as one call to bulk-assign
    const [storeRows, setStoreRows] = useState([{ key: storeRowKeySeq++, storeOption: null, sequence: 1 }])
    const [mode, setMode] = useState("add") // "add" | "replace"

    const addStoreRow = () => {
        setStoreRows((prev) => [...prev, { key: storeRowKeySeq++, storeOption: null, sequence: prev.length + 1 }])
    }
    const removeStoreRow = (key) => {
        setStoreRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))
    }
    const updateStoreRow = (key, field, value) => {
        setStoreRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
    }
    const clearBuilder = () => {
        setStoreRows([{ key: storeRowKeySeq++, storeOption: null, sequence: 1 }])
    }

    // Prefills the builder from what's currently assigned, so "Replace" can
    // start from the live route instead of being typed from scratch.
    const loadCurrentIntoBuilder = () => {
        if (!routeRows.length) return
        setStoreRows(
            routeRows
                .slice()
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                .map((r) => ({
                    key: storeRowKeySeq++,
                    storeOption: centreOptions.find((opt) => opt.value === r.store) || (r.store ? { value: r.store, label: r.store } : null),
                    sequence: r.sequence ?? 1,
                }))
        )
    }

    const [assignLoading, setAssignLoading] = useState(false)
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)

    const submitAssign = async () => {
        setAssignLoading(true)
        try {
            const stores = storeRows
                .filter((r) => r.storeOption?.value)
                .map((r) => ({ store: r.storeOption.value, sequence: Number(r.sequence) || 1 }))
            const { ok, data } = await rawRequest(BULK_ASSIGN_RIDER_STORE_ROUTES, {
                method: "POST",
                body: { employee: selectedRider.value, darkstore: selectedDarkstore.value, stores, mode },
            })
            if (ok) {
                SucceesToaster(data?.msg || `Route ${mode === "replace" ? "replaced" : "assigned"} for ${selectedRider.label}`)
                loadRoutes(selectedRider.value, selectedDarkstore.value)
            } else {
                ErrorToaster(data?.detail || data?.error || data?.msg || "Failed to assign route")
            }
        } catch {
            ErrorToaster("Failed to assign route")
        } finally {
            setAssignLoading(false)
            setShowReplaceConfirm(false)
        }
    }

    const handleAssignClick = () => {
        if (!selectedRider) { ErrorToaster("Select a rider first"); return }
        if (!selectedDarkstore) { ErrorToaster("Select a dark store first"); return }
        if (!storeRows.some((r) => r.storeOption?.value)) { ErrorToaster("Add at least one store to the route"); return }
        if (mode === "replace") { setShowReplaceConfirm(true); return }
        submitAssign()
    }

    const toggleActive = async (row) => {
        try {
            const { ok, data } = await rawRequest(`${RIDER_STORE_ROUTES}${row.id}/`, {
                method: "PATCH",
                body: { is_active: !row.is_active },
            })
            if (ok) {
                SucceesToaster(row.is_active ? "Route deactivated" : "Route activated")
                loadRoutes(selectedRider?.value, selectedDarkstore?.value)
            } else {
                ErrorToaster(data?.detail || data?.error || "Failed to update route")
            }
        } catch {
            ErrorToaster("Failed to update route")
        }
    }

    const routeColumns = useMemo(() => [
        { header: "Rider", accessorKey: "employee", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Dark Store", accessorKey: "darkstore", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Store", accessorKey: "store", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Sequence", accessorKey: "sequence", enableSorting: true, cell: ({ getValue }) => getValue() ?? "—" },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <Button color={row.original.is_active ? "danger" : "success"} size="sm" onClick={() => toggleActive(row.original)}>
                    {row.original.is_active ? "Deactivate" : "Activate"}
                </Button>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Rider Store Routes"
                subTitle="Assign or replace the ordered list of stores a rider covers out of a dark store."
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-4 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">Rider</Label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadRiderOptions}
                            value={selectedRider}
                            onChange={setSelectedRider}
                            placeholder="Search rider by employee code or name"
                            styles={customStyles}
                            isClearable
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">Dark Store</Label>
                        <Select
                            options={centreOptions}
                            value={selectedDarkstore}
                            onChange={setSelectedDarkstore}
                            placeholder="Select Dark Store"
                            styles={customStyles}
                            isLoading={centresLoading}
                            isClearable
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label m-0 font-bold text-ink-muted">Mode</Label>
                        <div className="flex h-9 items-center gap-4">
                            <label className="flex items-center gap-1.5 text-sm text-ink">
                                <Input type="radio" name="route-mode" checked={mode === "add"} onChange={() => setMode("add")} />
                                Add
                            </label>
                            <label className="flex items-center gap-1.5 text-sm text-ink">
                                <Input type="radio" name="route-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
                                Replace
                            </label>
                        </div>
                    </div>

                    <Button color="primary" onClick={handleViewRoute} disabled={routesLoading} style={{ height: "2.25rem" }}>
                        {routesLoading ? "Loading..." : "View Route"}
                    </Button>
                </div>

                <p className="mt-2 text-xs text-ink-muted">
                    <strong className="text-ink">Add</strong> only upserts the stores listed below and leaves the rest of this rider&apos;s route at this dark store untouched.{" "}
                    <strong className="text-ink">Replace</strong> also deactivates any store currently on their route that isn&apos;t listed below.
                </p>

                <div className="mt-3 rounded-md border border-white/8 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">Route stores, in delivery order</span>
                        <div className="flex gap-2">
                            <Button color="secondary" size="sm" onClick={loadCurrentIntoBuilder} disabled={!routeRows.length}>
                                Load Current Route
                            </Button>
                            <Button color="secondary" size="sm" onClick={addStoreRow}>+ Add Store</Button>
                            <Button color="secondary" size="sm" onClick={clearBuilder}>Clear</Button>
                            <Button color="primary" size="sm" onClick={handleAssignClick} disabled={assignLoading}>
                                {assignLoading ? "Assigning..." : "Assign Route"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {storeRows.map((row, index) => (
                            <div key={row.key} className="flex items-center gap-2">
                                <span className="w-5 text-xs text-ink-muted">{index + 1}.</span>
                                <div className="w-64">
                                    <Select
                                        options={centreOptions}
                                        value={row.storeOption}
                                        onChange={(opt) => updateStoreRow(row.key, "storeOption", opt)}
                                        placeholder="Select Store"
                                        styles={customStyles}
                                        isLoading={centresLoading}
                                    />
                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    className="w-20"
                                    value={row.sequence}
                                    onChange={(e) => updateStoreRow(row.key, "sequence", e.target.value)}
                                />
                                <Button color="danger" size="sm" onClick={() => removeStoreRow(row.key)} disabled={storeRows.length === 1}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="page-fit-body mt-4">
                    {!hasLoadedRoutes ? (
                        <p className="text-ink-muted">Select a rider and/or dark store, then click View Route to load its routes.</p>
                    ) : routesLoading ? (
                        <Loader message="Loading Routes…" fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={routeColumns}
                            data={routeRows}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="50vh"
                        />
                    )}
                </div>
            </div>

            <SimpleModal
                isOpen={showReplaceConfirm}
                setIsOpen={setShowReplaceConfirm}
                onCancel={() => setShowReplaceConfirm(false)}
                successButtonName={assignLoading ? "Replacing..." : "Replace"}
                onSuccess={submitAssign}
            >
                <p className="font-semibold text-danger-500">
                    Replace mode will deactivate every store currently on {selectedRider?.label}&apos;s route
                    at {selectedDarkstore?.label} that isn&apos;t in this list. Continue?
                </p>
            </SimpleModal>
        </div>
    )
}

export default RiderStoreRoutes
