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
    CORPORATE_BILLING_RUNS_BULK_DOWNLOAD,
    CORPORATE_INVOICES_LIST,
    CORPORATE_INVOICE_BASE,
} from "../../../api"
import { getBatchStatusColor } from "./statusBadge"
import UploadPreviewModal from "./UploadPreviewModal"

const WorkingInvoicesTab = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchRuns, loading: runsLoading } = usePostApiCall()
    const { apifunc: fetchInvoices, loading: invoicesLoading } = usePostApiCall()
    const { apifunc: vecomAction } = usePostApiCall()

    const [runs, setRuns] = useState([])
    const [invoices, setInvoices] = useState([])
    const [uploadOpen, setUploadOpen] = useState(false)
    const [vecomBusyId, setVecomBusyId] = useState(null)
    const [selectedRunIds, setSelectedRunIds] = useState([])
    const [bulkDownloading, setBulkDownloading] = useState(false)

    const normalizeList = (res) =>
        res?.result || res?.results || (Array.isArray(res) ? res : [])

    const loadRuns = async () => {
        const res = await fetchRuns(CORPORATE_BILLING_RUNS, { status: "GENERATED" })
        const list = normalizeList(res)
        setRuns(list)
        setSelectedRunIds([])
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

    // ── Bulk download ─────────────────────────────────────────────
    const isAllSelected = runs.length > 0 && selectedRunIds.length === runs.length

    const toggleSelectAll = () => {
        setSelectedRunIds(isAllSelected ? [] : runs.map((r) => r.id))
    }

    const toggleRunSelect = (id) => {
        setSelectedRunIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleBulkDownload = async () => {
        if (!selectedRunIds.length) return
        setBulkDownloading(true)
        try {
            const res = await fetch(CORPORATE_BILLING_RUNS_BULK_DOWNLOAD, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ run_ids: selectedRunIds }),
            })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "billing_bulk.zip"
            a.click()
            window.URL.revokeObjectURL(url)
            SuccessToaster(`Downloaded ${selectedRunIds.length} working file(s)`)
        } catch (err) {
            ErrorToaster(err.message || "Bulk download failed")
        } finally {
            setBulkDownloading(false)
        }
    }

    const runColumns = useMemo(() => [
        {
            header: () => (
                <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                />
            ),
            id: "select",
            cell: (cell) => (
                <input
                    type="checkbox"
                    checked={selectedRunIds.includes(cell.row.original.id)}
                    onChange={() => toggleRunSelect(cell.row.original.id)}
                    style={{ cursor: "pointer" }}
                />
            ),
        },
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
    ], [isAllSelected, selectedRunIds, runs])

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
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="mb-0 fw-bold">Generated Working Files</h5>
                            {selectedRunIds.length > 0 && (
                                <Badge color="primary" pill>{selectedRunIds.length} selected</Badge>
                            )}
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            {selectedRunIds.length > 0 && (
                                <Button
                                    color="success"
                                    size="sm"
                                    onClick={handleBulkDownload}
                                    disabled={bulkDownloading}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {bulkDownloading ? <Spinner size="sm" /> : <MdFileDownload size={16} />}
                                    Bulk Download ({selectedRunIds.length})
                                </Button>
                            )}
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
