// Tab 3 — Working & Invoices: runs list (download working), upload->preview->generate,
// and the invoice list with PDF download + Vecom push/revert.
import { useEffect, useMemo, useState } from "react"
import { Badge, Button, Card, CardBody, Spinner } from "reactstrap"
import { MdFileDownload, MdPictureAsPdf, MdRefresh, MdUpload, MdCloudUpload, MdCloudOff } from "react-icons/md"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import ToasterProvider from "../../../helpers/ToasterProvider"
import {
    CORPORATE_BILLING_RUNS,
    CORPORATE_INVOICES_LIST,
    CORPORATE_INVOICE_BASE,
} from "../../../api"
import { getBatchStatusColor } from "./statusBadge"
import UploadPreviewModal from "./UploadPreviewModal"

const WorkingInvoicesTab = () => {
    const { SuccessToaster } = ToasterProvider()
    const { apifunc: fetchRuns, loading: runsLoading } = usePostApiCall()
    const { apifunc: fetchInvoices, loading: invoicesLoading } = usePostApiCall()
    const { apifunc: vecomAction } = usePostApiCall()

    const [runs, setRuns] = useState([])
    const [invoices, setInvoices] = useState([])
    const [uploadOpen, setUploadOpen] = useState(false)
    const [vecomBusyId, setVecomBusyId] = useState(null)

    const normalizeList = (res) =>
        res?.result || res?.results || (Array.isArray(res) ? res : [])

    const loadRuns = async () => {
        const res = await fetchRuns(CORPORATE_BILLING_RUNS, { status: "GENERATED" })
        setRuns(normalizeList(res))
    }

    const loadInvoices = async () => {
        const res = await fetchInvoices(CORPORATE_INVOICES_LIST, {})
        setInvoices(normalizeList(res))
    }

    useEffect(() => {
        loadRuns()
        loadInvoices()
    }, [])

    const handleRunDownload = (runId) => {
        window.open(`${CORPORATE_BILLING_RUNS}${runId}/download/`, "_blank")
    }

    const handlePdf = (invId) => {
        window.open(`${CORPORATE_INVOICE_BASE}${invId}/download-pdf/`, "_blank")
    }

    const handleVecom = async (invId, revert = false) => {
        setVecomBusyId(invId)
        const url = `${CORPORATE_INVOICE_BASE}${invId}/${revert ? "revert-vecom" : "sync-vecom"}/`
        const res = await vecomAction(url, {})
        setVecomBusyId(null)
        if (res?.status === "success" || res?.status === true) {
            SuccessToaster(revert ? "Reverted from Vecom" : "Pushed to Vecom")
            loadInvoices()
        }
    }

    const runColumns = useMemo(() => [
        { header: "Run ID", accessorKey: "id" },
        { header: "Customer", accessorKey: "customer_name" },
        { header: "Start", accessorKey: "billing_period_start" },
        { header: "End", accessorKey: "billing_period_end" },
        { header: "Shipments", accessorKey: "total_shipments" },
        {
            header: "Status",
            accessorKey: "status",
            cell: (c) => <Badge color={getBatchStatusColor(c.getValue())} className="p-2">{c.getValue()?.toUpperCase()}</Badge>,
        },
        {
            header: "Action",
            id: "action",
            cell: (cell) => (
                <Button color="success" size="sm" title="Download working file" onClick={() => handleRunDownload(cell.row.original.id)}>
                    <MdFileDownload size={16} />
                </Button>
            ),
        },
    ], [])

    const invoiceColumns = useMemo(() => [
        { header: "Invoice ID", accessorKey: "id" },
        { header: "Invoice No", accessorKey: "invoice_number", cell: (c) => c.getValue() || "—" },
        { header: "Customer", accessorKey: "customer_name", cell: (c) => c.getValue() || "—" },
        { header: "Date", accessorKey: "invoice_date", cell: (c) => c.getValue() || "—" },
        { header: "Amount", accessorKey: "total_amount", cell: (c) => c.getValue() ?? "—" },
        {
            header: "Actions",
            id: "actions",
            cell: (cell) => {
                const inv = cell.row.original
                const busy = vecomBusyId === inv.id
                return (
                    <div className="d-flex gap-2 justify-content-center">
                        <Button color="danger" size="sm" outline title="Download PDF" onClick={() => handlePdf(inv.id)}>
                            <MdPictureAsPdf size={16} />
                        </Button>
                        <Button color="primary" size="sm" outline title="Push to Vecom" disabled={busy} onClick={() => handleVecom(inv.id, false)}>
                            {busy ? <Spinner size="sm" /> : <MdCloudUpload size={16} />}
                        </Button>
                        <Button color="warning" size="sm" outline title="Revert from Vecom" disabled={busy} onClick={() => handleVecom(inv.id, true)}>
                            <MdCloudOff size={16} />
                        </Button>
                    </div>
                )
            },
        },
    ], [vecomBusyId])

    return (
        <div>
            <UploadPreviewModal
                isOpen={uploadOpen}
                toggle={() => setUploadOpen(!uploadOpen)}
                onGenerated={loadInvoices}
            />

            {/* Runs list */}
            <Card className="shadow-sm border-0 mb-4">
                <CardBody className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Generated Working Files</h5>
                        <div className="d-flex gap-2">
                            <Button color="primary" size="sm" onClick={() => setUploadOpen(true)} className="d-flex align-items-center gap-1">
                                <MdUpload size={16} /> Upload &amp; Invoice
                            </Button>
                            <Button color="secondary" size="sm" onClick={loadRuns} disabled={runsLoading}>
                                {runsLoading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                            </Button>
                        </div>
                    </div>
                    <TableContainer
                        columns={runColumns}
                        data={runs}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search runs..."
                        pagination="pagination pagination-rounded justify-content-end mb-2"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-hover mb-0"
                    />
                </CardBody>
            </Card>

            {/* Invoice list */}
            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Invoices</h5>
                        <Button color="secondary" size="sm" onClick={loadInvoices} disabled={invoicesLoading}>
                            {invoicesLoading ? <Spinner size="sm" /> : <><MdRefresh size={16} /> Refresh</>}
                        </Button>
                    </div>
                    <TableContainer
                        columns={invoiceColumns}
                        data={invoices}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search invoices..."
                        pagination="pagination pagination-rounded justify-content-end mb-2"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-hover mb-0"
                    />
                </CardBody>
            </Card>
        </div>
    )
}

export default WorkingInvoicesTab
