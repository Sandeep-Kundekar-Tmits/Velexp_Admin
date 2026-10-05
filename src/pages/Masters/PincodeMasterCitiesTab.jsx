import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import { Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { PINCODE_MASTER_STATES_API, PINCODE_MASTER_CITIES_API } from "../../api"

// Plain DRF REST resource (see PincodeMasterPincodesTab.jsx's top comment for why
// this bypasses useGetApiCall/usePostApiCall/etc and calls rawRequest directly).
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const EMPTY_FORM = { state_name: "", name: "", is_metro: false }

const PincodeMasterCitiesTab = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // state picker (filters the cities list; also used in the create/edit form)
    const [stateOptions, setStateOptions] = useState([])
    const [selectedState, setSelectedState] = useState(null)

    useEffect(() => {
        (async () => {
            const { ok, data } = await rawRequest(PINCODE_MASTER_STATES_API, { method: "GET" })
            if (ok) {
                const list = Array.isArray(data) ? data : data?.results || []
                setStateOptions(list.map((s) => ({ value: s.name, label: s.name })))
            }
        })()
    }, [])

    const [cities, setCities] = useState([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const q = selectedState?.value ? `?state=${encodeURIComponent(selectedState.value)}` : ""
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_CITIES_API}${q}`, { method: "GET" })
            if (ok) setCities(Array.isArray(data) ? data : data?.results || [])
            else { setCities([]); ErrorToaster(errorMessage(data, "Failed to load cities")) }
        } catch {
            setCities([])
            ErrorToaster("Failed to load cities — network error")
        } finally {
            setLoading(false)
        }
    }, [selectedState])

    useEffect(() => { load() }, [load])

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openCreate = () => {
        setEditing(null)
        setForm({ ...EMPTY_FORM, state_name: selectedState?.value || "" })
        setFormOpen(true)
    }
    const openEdit = (row) => {
        setEditing(row)
        setForm({ state_name: row?.state_name || row?.state?.name || selectedState?.value || "", name: row?.name || "", is_metro: !!row?.is_metro })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim() || !form.state_name.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const { ok, data } = await rawRequest(`${PINCODE_MASTER_CITIES_API}${editing.id}/`, {
                    method: "PATCH",
                    body: { name: form.name, is_metro: form.is_metro },
                })
                if (ok) { SucceesToaster("City updated successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to update city"))
            } else {
                const { ok, data } = await rawRequest(PINCODE_MASTER_CITIES_API, { method: "POST", body: form })
                if (ok) { SucceesToaster("City created successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to create city"))
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_CITIES_API}${deleteTarget.id}/`, { method: "DELETE" })
            if (ok) { setDeleteTarget(null); setCities((prev) => prev.filter((c) => c.id !== deleteTarget.id)) }
            else ErrorToaster(errorMessage(data, "Failed to delete city"))
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "Name", accessorKey: "name", enableSorting: true },
        {
            header: "State", accessorKey: "state_name", enableSorting: true,
            cell: ({ row }) => row.original?.state_name || row.original?.state?.name || row.original?.state || "—",
        },
        {
            header: "Metro", accessorKey: "is_metro", enableSorting: true,
            cell: ({ getValue }) => getValue() ? "Yes" : "No",
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
    ], [])

    return (
        <div className="page-fit-body">
            <div className="flex justify-between items-end mb-3 gap-3">
                <div style={{ minWidth: 280 }}>
                    <Label>Filter by state</Label>
                    <Select
                        isClearable
                        options={stateOptions}
                        value={selectedState}
                        onChange={setSelectedState}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        placeholder="All states"
                    />
                </div>
                <Button color="primary" onClick={openCreate}>+ Add City</Button>
            </div>

            {loading ? (
                <Loader message="Loading cities…" fullscreen={false} />
            ) : (
                <TableContainer
                    columns={columns}
                    data={cities}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search cities"
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                    theadClass="sticky top-0 z-10"
                    isStickyHeader={true}
                    stickyTop={0}
                    fillHeight
                    tableHeight="58vh"
                />
            )}

            <SimpleModal
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                successButtonName={editing ? "Save" : "Create"}
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
            >
                <h5 className="mb-4">{editing ? "Edit City" : "Add City"}</h5>
                <FormGroup>
                    <Label>State *</Label>
                    <Select
                        isDisabled={!!editing}
                        options={stateOptions}
                        value={stateOptions.find((o) => o.value === form.state_name) || null}
                        onChange={(opt) => setForm({ ...form, state_name: opt?.value || "" })}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        placeholder="Select state"
                    />
                </FormGroup>
                <FormGroup>
                    <Label>City name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mumbai" />
                </FormGroup>
                <FormGroup check>
                    <Input type="checkbox" id="is_metro" checked={!!form.is_metro} onChange={(e) => setForm({ ...form, is_metro: e.target.checked })} />
                    <Label for="is_metro" className="mb-0">Metro city</Label>
                </FormGroup>
                {saving && <div className="text-xs text-ink-muted">Saving…</div>}
            </SimpleModal>

            <DeleteModal show={!!deleteTarget} onCloseClick={() => setDeleteTarget(null)} onDeleteClick={handleDelete} loading={deleting} />
        </div>
    )
}

export default PincodeMasterCitiesTab
