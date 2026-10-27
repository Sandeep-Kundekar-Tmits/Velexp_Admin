// Tab 4 — History: recent batches. Click a row to re-open its progress panel.
import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui"
import { MdCancel, MdRefresh, MdVisibility } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { BILLING_BATCH_BASE, BILLING_BATCH_LIST } from "../../../api"
import { getBatchStatusColor } from "./statusBadge"
import { formatDisplayDate } from "../../../helpers/formatDisplayDate"

// Only a batch that hasn't finished one way or another can be cancelled.
const CANCELABLE_STATUSES = new Set(["PENDING", "CREATED", "PROCESSING"])

const HistoryTab = ({ onOpenBatch }) => {
    const { apifunc: fetchBatches, loading } = usePostApiCall()
    const [batches, setBatches] = useState([])
    const [cancelTarget, setCancelTarget] = useState(null)

    const loadBatches = async () => {
        const res = await fetchBatches(BILLING_BATCH_LIST, { limit: 50 })
        const list = res?.result || res?.results || res?.batches || (Array.isArray(res) ? res : [])
        setBatches(list)
    }

    useEffect(() => {
        loadBatches()
    }, [])

    // usePostApiCall shows its own error toast and returns the parsed error
    // body (truthy) on a non-OK response -- toggle only runs past that early
    // return, so "on success" is exactly what the hook itself already means.
    const { apifunc: cancelBatch, loading: cancelling } = usePostApiCall(
        () => { setCancelTarget(null); loadBatches() },
        "Batch cancelled"
    )

    const handleCancelConfirm = () => {
        if (!cancelTarget) return
        cancelBatch(`${BILLING_BATCH_BASE}${cancelTarget.id}/cancel/`, {})
    }

    const columns = useMemo(() => [
        { header: "Batch ID", accessorKey: "id" },
        { header: "Type", accessorKey: "batch_type", cell: (c) => <Badge color="light" className="text-ink border">{c.getValue()}</Badge> },
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
            cell: (cell) => {
                const row = cell.row.original
                const cancelable = CANCELABLE_STATUSES.has(row.status?.toUpperCase())
                return (
                    <div className="flex gap-2 justify-center">
                        <Button color="info" size="sm" outline title="View progress" onClick={() => onOpenBatch(row.id)}>
                            <MdVisibility size={16} />
                        </Button>
                        {cancelable && (
                            <Button color="danger" size="sm" outline title="Cancel batch" onClick={() => setCancelTarget(row)}>
                                <MdCancel size={16} />
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ], [onOpenBatch])

    return (
        <Card className="shadow-sm border-0">
            <CardBody className="p-0">
                <div className="p-4 bg-canvas border-bottom flex justify-between items-center">
                    <h5 className="mb-0 font-bold">Recent Batches</h5>
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
                    SearchPlaceholder="Search batches..."
                    pagination="pagination pagination-rounded justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-hover mb-0"
                />
            </CardBody>

            <Modal isOpen={!!cancelTarget} toggle={() => setCancelTarget(null)} centered size="md">
                <ModalHeader toggle={() => setCancelTarget(null)} className="text-danger-500 border-bottom">
                    Cancel Batch #{cancelTarget?.id}?
                </ModalHeader>
                <ModalBody>
                    <p className="text-ink-muted mb-0">
                        This stops the batch where it stands -- any customers already processed keep
                        their result, the rest are left untouched. This cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setCancelTarget(null)}>
                        Back
                    </Button>
                    <Button color="danger" onClick={handleCancelConfirm} disabled={cancelling}>
                        {cancelling ? <Spinner size="sm" /> : "Yes, Cancel Batch"}
                    </Button>
                </ModalFooter>
            </Modal>
        </Card>
    )
}

export default HistoryTab
