// Tab 4 — History: recent batches. Click a row to re-open its progress panel.
import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Spinner } from "reactstrap"
import { MdRefresh, MdVisibility } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { BILLING_BATCH_LIST } from "../../../api"
import { getBatchStatusColor } from "./statusBadge"

const HistoryTab = ({ onOpenBatch }) => {
    const { apifunc: fetchBatches, loading } = usePostApiCall()
    const [batches, setBatches] = useState([])

    const loadBatches = async () => {
        const res = await fetchBatches(BILLING_BATCH_LIST, { limit: 50 })
        const list = res?.result || res?.results || res?.batches || (Array.isArray(res) ? res : [])
        setBatches(list)
    }

    useEffect(() => {
        loadBatches()
    }, [])

    const columns = useMemo(() => [
        { header: "Batch ID", accessorKey: "id" },
        { header: "Type", accessorKey: "batch_type", cell: (c) => <Badge color="light" className="text-dark border">{c.getValue()}</Badge> },
        {
            header: "Status",
            accessorKey: "status",
            cell: (c) => <Badge color={getBatchStatusColor(c.getValue())} className="p-2">{c.getValue()?.toUpperCase()}</Badge>,
        },
        { header: "Period Start", accessorKey: "billing_period_start" },
        { header: "Period End", accessorKey: "billing_period_end" },
        {
            header: "Progress",
            id: "progress",
            cell: (cell) => {
                const r = cell.row.original
                return `${r.processed_customers ?? 0} / ${r.total_customers ?? 0}`
            },
        },
        { header: "Created", accessorKey: "created_at", cell: (c) => c.getValue() || "—" },
        {
            header: "Action",
            id: "action",
            cell: (cell) => (
                <Button color="info" size="sm" outline title="View progress" onClick={() => onOpenBatch(cell.row.original.id)}>
                    <MdVisibility size={16} />
                </Button>
            ),
        },
    ], [onOpenBatch])

    return (
        <Card className="shadow-sm border-0">
            <CardBody className="p-0">
                <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">Recent Batches</h5>
                    <Button color="secondary" size="sm" onClick={loadBatches} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                    </Button>
                </div>
                <TableContainer
                    columns={columns}
                    data={batches}
                    isGlobalFilter={true}
                    isPagination={true}
                    SearchPlaceholder="Search batches..."
                    pagination="pagination pagination-rounded justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-hover mb-0"
                />
            </CardBody>
        </Card>
    )
}

export default HistoryTab
