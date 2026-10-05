import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge, Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { PINCODE_MASTER_STATES_API } from "../../api"

// Plain DRF REST resource (see PincodeMasterPincodesTab.jsx's top comment for why
// this bypasses useGetApiCall/usePostApiCall/etc and calls rawRequest directly).
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const EMPTY_FORM = { name: "", code: "", region: "", zone: "", is_real: true }

const PincodeMasterStatesTab = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [states, setStates] = useState([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { ok, data } = await rawRequest(PINCODE_MASTER_STATES_API, { method: "GET" })
            if (ok) setStates(Array.isArray(data) ? data : data?.results || [])
            else { setStates([]); ErrorToaster(errorMessage(data, "Failed to load states")) }
        } catch {
            setStates([])
            ErrorToaster("Failed to load states — network error")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState(null) // null = create
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true) }
    const openEdit = (row) => {
        setEditing(row)
        setForm({ name: row?.name || "", code: row?.code || "", region: row?.region || "", zone: row?.zone || "", is_real: row?.is_real ?? true })
        setFormOpen(true)
    }

    const handleSave = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            if (editing) {
                const { ok, data } = await rawRequest(`${PINCODE_MASTER_STATES_API}${editing.id}/`, { method: "PATCH", body: form })
                if (ok) { SucceesToaster("State updated successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to update state"))
            } else {
                const { ok, data } = await rawRequest(PINCODE_MASTER_STATES_API, { method: "POST", body: form })
                if (ok) { SucceesToaster("State created successfully"); setFormOpen(false); load() }
                else ErrorToaster(errorMessage(data, "Failed to create state"))
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_STATES_API}${deleteTarget.id}/`, { method: "DELETE" })
            if (ok) { setDeleteTarget(null); setStates((prev) => prev.filter((s) => s.id !== deleteTarget.id)) }
            else ErrorToaster(errorMessage(data, "Failed to delete state"))
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "Name", accessorKey: "name", enableSorting: true },
        { header: "Code", accessorKey: "code", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Region", accessorKey: "region", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Zone", accessorKey: "zone", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Real", accessorKey: "is_real", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Real" : "Test"}</Badge>,
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
            <div className="flex justify-end mb-3">
                <Button color="primary" onClick={openCreate}>+ Add State</Button>
            </div>

            {loading ? (
                <Loader message="Loading states…" fullscreen={false} />
            ) : (
                <TableContainer
                    columns={columns}
                    data={states}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search states"
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                    theadClass="sticky top-0 z-10"
                    isStickyHeader={true}
                    stickyTop={0}
                    fillHeight
                    tableHeight="60vh"
                />
            )}

            <SimpleModal
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                successButtonName={editing ? "Save" : "Create"}
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
            >
                <h5 className="mb-4">{editing ? "Edit State" : "Add State"}</h5>
                <FormGroup>
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Maharashtra" />
                </FormGroup>
                <FormGroup>
                    <Label>Code</Label>
                    <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MH" />
                </FormGroup>
                <FormGroup>
                    <Label>Region</Label>
                    <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="WEST" />
                </FormGroup>
                <FormGroup>
                    <Label>Zone</Label>
                    <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="WEST" />
                </FormGroup>
                <FormGroup check>
                    <Input type="checkbox" id="is_real" checked={!!form.is_real} onChange={(e) => setForm({ ...form, is_real: e.target.checked })} />
                    <Label for="is_real" className="mb-0">Real state</Label>
                </FormGroup>
                {saving && <div className="text-xs text-ink-muted">Saving…</div>}
            </SimpleModal>

            <DeleteModal show={!!deleteTarget} onCloseClick={() => setDeleteTarget(null)} onDeleteClick={handleDelete} loading={deleting} />
        </div>
    )
}

export default PincodeMasterStatesTab
