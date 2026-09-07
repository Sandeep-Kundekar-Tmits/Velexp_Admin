// Tab 4 — History: recent batches. Click a row to re-open its progress panel.
import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Spinner, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap"
import { MdRefresh, MdVisibility, MdCancel } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { BILLING_BATCH_LIST, BILLING_BATCH_CANCEL } from "../../../api"
import { getBatchStatusColor } from "./statusBadge"

const CANCELABLE_STATUSES = ["PENDING", "PROCESSING", "CREATED"]

const HistoryTab = ({ onOpenBatch }) => {
    const { apifunc: fetchBatches, loading } = usePostApiCall()
    const { apifunc: cancelBatch } = usePostApiCall()
    const [batches, setBatches] = useState([])
    const [cancelingId, setCancelingId] = useState(null)
    const [pendingCancelId, setPendingCancelId] = useState(null)

    const loadBatches = async () => {
        const res = await fetchBatches(BILLING_BATCH_LIST, { limit: 50 })
        const list = res?.result || res?.results || res?.batches || (Array.isArray(res) ? res : [])
        setBatches(list)
    }

    useEffect(() => {
        loadBatches()
    }, [])

    const handleCancelClick = (batchId) => setPendingCancelId(batchId)
    const handleCancelDismiss = () => setPendingCancelId(null)

    const handleCancelConfirm = async () => {
        if (!pendingCancelId) return
        const batchId = pendingCancelId
        setPendingCancelId(null)
        setCancelingId(batchId)
        const res = await cancelBatch(BILLING_BATCH_CANCEL(batchId), {})
        setCancelingId(null)
        if (res) loadBatches()
    }

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
            cell: (cell) => {
                const row = cell.row.original
                const cancelable = CANCELABLE_STATUSES.includes(row.status?.toUpperCase())
                return (
                    <div className="d-flex gap-1">
                        <Button color="info" size="sm" outline title="View progress" onClick={() => onOpenBatch(row.id)}>
                            <MdVisibility size={16} />
                        </Button>
                        {cancelable && (
                            <Button
                                color="danger"
                                size="sm"
                                outline
                                title="Cancel batch"
                                onClick={() => handleCancelClick(row.id)}
                                disabled={cancelingId === row.id}
                            >
                                {cancelingId === row.id ? <Spinner size="sm" /> : <MdCancel size={16} />}
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ], [onOpenBatch, cancelingId])

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

            <Modal isOpen={!!pendingCancelId} toggle={handleCancelDismiss} centered>
                <ModalHeader toggle={handleCancelDismiss} className="text-danger border-bottom">
                    Confirm — Cancel Batch
                </ModalHeader>
                <ModalBody>
                    Are you sure you want to cancel batch #{pendingCancelId}? This cannot be undone.
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={handleCancelDismiss}>
                        No
                    </Button>
                    <Button color="danger" onClick={handleCancelConfirm}>
                        Yes, Cancel Batch
                    </Button>
                </ModalFooter>
            </Modal>
        </Card>
    )
}

export default HistoryTab
