import { useCallback, useEffect, useMemo, useState } from "react"
import Select from "react-select"
import { Badge, Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { PINCODE_MASTER_STATES_API, PINCODE_MASTER_CITIES_API, PINCODE_MASTER_ALIASES_API } from "../../api"

// Plain DRF REST resource (see PincodeMasterPincodesTab.jsx's top comment for why
// this bypasses useGetApiCall/usePostApiCall/etc and calls rawRequest directly).
const errorMessage = (data, fallback) => data?.detail || data?.error || data?.message || fallback

const ALIAS_TYPE_OPTIONS = [
    { value: "STATE", label: "State" },
    { value: "CITY", label: "City" },
]

const PincodeMasterAliasesTab = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [typeFilter, setTypeFilter] = useState(ALIAS_TYPE_OPTIONS[0])

    const [aliases, setAliases] = useState([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_ALIASES_API}?alias_type=${typeFilter.value}`, { method: "GET" })
            if (ok) setAliases(Array.isArray(data) ? data : data?.results || [])
            else { setAliases([]); ErrorToaster(errorMessage(data, "Failed to load aliases")) }
        } catch {
            setAliases([])
            ErrorToaster("Failed to load aliases — network error")
        } finally {
            setLoading(false)
        }
    }, [typeFilter])

    useEffect(() => { load() }, [load])

    // reference options for the "maps to" picker in the create form
    const [stateOptions, setStateOptions] = useState([])
    const [cityOptions, setCityOptions] = useState([])

    useEffect(() => {
        (async () => {
            const { ok, data } = await rawRequest(PINCODE_MASTER_STATES_API, { method: "GET" })
            if (ok) {
                const list = Array.isArray(data) ? data : data?.results || []
                setStateOptions(list.map((s) => ({ value: s.id, label: s.name })))
            }
        })()
    }, [])
    useEffect(() => {
        (async () => {
            const { ok, data } = await rawRequest(PINCODE_MASTER_CITIES_API, { method: "GET" })
            if (ok) {
                const list = Array.isArray(data) ? data : data?.results || []
                setCityOptions(list.map((c) => ({ value: c.id, label: `${c.name}${c.state_name ? ` (${c.state_name})` : ""}` })))
            }
        })()
    }, [])

    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState({ alias_type: "STATE", alias: "", target: null })
    const [saving, setSaving] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const openCreate = () => { setForm({ alias_type: typeFilter.value, alias: "", target: null }); setFormOpen(true) }

    const handleSave = async () => {
        if (!form.alias.trim() || !form.target) return
        setSaving(true)
        try {
            const payload = {
                alias_type: form.alias_type,
                alias: form.alias,
                ...(form.alias_type === "STATE" ? { state: form.target.value } : { city: form.target.value }),
            }
            const { ok, data } = await rawRequest(PINCODE_MASTER_ALIASES_API, { method: "POST", body: payload })
            if (ok) { SucceesToaster("Alias created successfully"); setFormOpen(false); load() }
            else ErrorToaster(errorMessage(data, "Failed to create alias"))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const { ok, data } = await rawRequest(`${PINCODE_MASTER_ALIASES_API}${deleteTarget.id}/`, { method: "DELETE" })
            if (ok) { setDeleteTarget(null); setAliases((prev) => prev.filter((a) => a.id !== deleteTarget.id)) }
            else ErrorToaster(errorMessage(data, "Failed to delete alias"))
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo(() => [
        { header: "Alias", accessorKey: "alias", enableSorting: true },
        {
            header: "Type", accessorKey: "alias_type", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() === "STATE" ? "info" : "secondary"} pill>{getValue()}</Badge>,
        },
        {
            header: "Resolves to", id: "target", enableSorting: false,
            cell: ({ row }) => row.original?.state_name || row.original?.state?.name || row.original?.city_name || row.original?.city?.name || "—",
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => <Button color="danger" size="sm" onClick={() => setDeleteTarget(row.original)}>Delete</Button>,
        },
    ], [])

    return (
        <div className="page-fit-body">
            <div className="flex justify-between items-end mb-3 gap-3">
                <div style={{ minWidth: 220 }}>
                    <Label>Alias type</Label>
                    <Select options={ALIAS_TYPE_OPTIONS} value={typeFilter} onChange={setTypeFilter} styles={customStyles} menuPortalTarget={document.body} />
                </div>
                <Button color="primary" onClick={openCreate}>+ Add Alias</Button>
            </div>

            {loading ? (
                <Loader message="Loading aliases…" fullscreen={false} />
            ) : (
                <TableContainer
                    columns={columns}
                    data={aliases}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    SearchPlaceholder="Search aliases"
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
                successButtonName="Create"
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
            >
                <h5 className="mb-4">Add Alias</h5>
                <FormGroup>
                    <Label>Type *</Label>
                    <Select
                        options={ALIAS_TYPE_OPTIONS}
                        value={ALIAS_TYPE_OPTIONS.find((o) => o.value === form.alias_type)}
                        onChange={(opt) => setForm({ ...form, alias_type: opt.value, target: null })}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                    />
                </FormGroup>
                <FormGroup>
                    <Label>Alias text *</Label>
                    <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="e.g. Bombay State" />
                </FormGroup>
                <FormGroup>
                    <Label>Resolves to {form.alias_type === "STATE" ? "state" : "city"} *</Label>
                    <Select
                        options={form.alias_type === "STATE" ? stateOptions : cityOptions}
                        value={form.target}
                        onChange={(opt) => setForm({ ...form, target: opt })}
                        styles={customStyles}
                        menuPortalTarget={document.body}
                        placeholder={`Select ${form.alias_type === "STATE" ? "state" : "city"}`}
                    />
                </FormGroup>
                {saving && <div className="text-xs text-ink-muted">Saving…</div>}
            </SimpleModal>

            <DeleteModal show={!!deleteTarget} onCloseClick={() => setDeleteTarget(null)} onDeleteClick={handleDelete} loading={deleting} />
        </div>
    )
}

export default PincodeMasterAliasesTab
