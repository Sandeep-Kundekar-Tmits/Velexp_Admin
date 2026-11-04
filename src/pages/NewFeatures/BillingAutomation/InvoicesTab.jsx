// Invoices -- recent direct-invoice runs, from the batch list API
// (POST batch/list/ { batch_type: "DIRECT_INVOICE", limit: 50 }).
// A row is a batch; the eye opens its progress panel, same as History.
import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import { Badge, Button, Card, CardBody, Spinner } from "@/components/ui"
import { MdFolderZip, MdRefresh, MdVisibility } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { BILLING_BATCH_DOWNLOAD, BILLING_BATCH_LIST } from "../../../api"
import { authFetch } from "@/lib/http"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { getBatchStatusColor } from "./statusBadge"
import { formatDisplayDate } from "../../../helpers/formatDisplayDate"

const InvoicesTab = ({ onOpenBatch }) => {
    const { apifunc: fetchBatches, loading } = usePostApiCall()
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const [batches, setBatches] = useState([])
    const [zipBusyId, setZipBusyId] = useState(null)

    // Download the batch's invoices as one zip
    const downloadZip = async (id) => {
        setZipBusyId(id)
        try {
            const res = await authFetch(BILLING_BATCH_DOWNLOAD(id), { method: "GET", credentials: "include" })
            if (!res.ok) {
                let msg = `Error ${res.status}`
                try {
                    const err = await res.json()
                    msg = (Array.isArray(err) ? err.join(", ") : err?.error || err?.msg || err?.message || err?.detail) || msg
                } catch { /* non-JSON error body */ }
                throw new Error(msg)
            }
            const blob = await res.blob()
            // a zip starts with "PK"; anything else would only open as a corrupt file
            const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
            if (!(head[0] === 0x50 && head[1] === 0x4b)) {
                const text = (await blob.text()).trim()
                let msg = ""
                try { const j = JSON.parse(text); msg = j?.error || j?.msg || j?.message || j?.detail || "" } catch { /* not JSON */ }
                throw new Error(msg || "The server did not return a zip file")
            }
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `batch_${id}_invoices.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            SuccessToaster(`Batch ${id} invoices downloaded`)
        } catch (err) {
            ErrorToaster(err.message || "Download failed")
        } finally {
            setZipBusyId(null)
        }
    }

    const loadBatches = async () => {
        const res = await fetchBatches(BILLING_BATCH_LIST, { batch_type: "DIRECT_INVOICE", limit: 50 })
        const list = res?.result || res?.results || res?.batches || (Array.isArray(res) ? res : [])
        setBatches(Array.isArray(list) ? list : [])
    }

    useEffect(() => {
        loadBatches()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const columns = useMemo(() => [
        { header: "Batch ID", accessorKey: "id" },
        {
            header: "Status",
            accessorKey: "status",
            cell: (c) => <Badge color={getBatchStatusColor(c.getValue())} className="p-2">{c.getValue()?.toUpperCase()}</Badge>,
        },
        { header: "Period Start", accessorKey: "billing_period_start", cell: (c) => formatDisplayDate(c.getValue()) || "—" },
        { header: "Period End", accessorKey: "billing_period_end", cell: (c) => formatDisplayDate(c.getValue()) || "—" },
        {
            header: "Progress",
            id: "progress",
            cell: (cell) => {
                const r = cell.row.original
                return `${r.processed_customers ?? 0} / ${r.total_customers ?? 0}`
            },
        },
        { header: "Created", accessorKey: "created_at", cell: (c) => formatDisplayDate(c.getValue()) || "—" },
        {
            header: "Action",
            id: "action",
            cell: (cell) => (
                <div className="flex gap-2 justify-center">
                    <Button color="info" size="sm" outline title="View progress" onClick={() => onOpenBatch?.(cell.row.original.id)}>
                        <MdVisibility size={16} />
                    </Button>
                    <Button
                        color="success"
                        size="sm"
                        outline
                        title="Download invoices (zip)"
                        disabled={zipBusyId === cell.row.original.id}
                        onClick={() => downloadZip(cell.row.original.id)}
                    >
                        {zipBusyId === cell.row.original.id ? <Spinner size="sm" /> : <MdFolderZip size={16} />}
                    </Button>
                </div>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [onOpenBatch, zipBusyId])

    return (
        <Card className="shadow-sm border-0">
            <CardBody className="p-0">
                <div className="p-4 bg-canvas border-bottom flex justify-between items-center">
                    <h5 className="mb-0 font-bold">Invoices</h5>
                    <Button color="secondary" size="sm" onClick={loadBatches} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                    </Button>
                </div>
                <TableContainer
                    headerAlign="left"
                    columns={columns}
                    data={batches}
                    isGlobalFilter={true}
                    isPagination={true}
                    SearchPlaceholder="Search invoices..."
                    pagination="pagination pagination-rounded justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-hover mb-0"
                />
            </CardBody>
        </Card>
    )
}

InvoicesTab.propTypes = { onOpenBatch: PropTypes.func }

export default InvoicesTab
