// Working — generated working-file runs: download working files, upload->preview->generate invoice.
import { useEffect, useMemo, useState } from "react"
import {
    Badge, Button, Card, CardBody, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Spinner,
} from "reactstrap"
import { MdRefresh, MdUpload } from "react-icons/md"
import { FaFileArchive, FaLayerGroup } from "react-icons/fa"
import TableContainer from "../../../components/Table/TableContainer"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import ToasterProvider from "../../../helpers/ToasterProvider"
import {
    BILLING_BATCH_LIST,
    BILLING_BATCH_BASE,
    CORPORATE_BILLING_RUNS_BULK_DOWNLOAD,
} from "../../../api"
import { getBatchStatusColor } from "./statusBadge"
import UploadPreviewModal from "./UploadPreviewModal"

const WorkingTab = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: fetchRuns, loading: runsLoading } = usePostApiCall()
    const { apifunc: fetchBatchDetail } = useGetApiCall()

    const [runs, setRuns] = useState([])
    const [uploadOpen, setUploadOpen] = useState(false)

    // Batch detail modal
    const [batchDetailOpen, setBatchDetailOpen] = useState(false)
    const [batchDetail, setBatchDetail] = useState(null)
    const [batchDetailLoading, setBatchDetailLoading] = useState(false)
    const [selectedRunIds, setSelectedRunIds] = useState([])
    const [zipDownloading, setZipDownloading] = useState(false)
    const [combinedDownloading, setCombinedDownloading] = useState(false)

    const normalizeList = (res) =>
        res?.result || res?.results || (Array.isArray(res) ? res : [])

    const loadRuns = async () => {
        const res = await fetchRuns(BILLING_BATCH_LIST, { batch_type: "GENERATE_WORKING", status: "COMPLETED" })
        const list = normalizeList(res)
        setRuns(list)
    }

    useEffect(() => {
        loadRuns()
    }, [])

    const handleRunDownload = (batchId) => {
        window.open(`${BILLING_BATCH_BASE}${batchId}/download/`, "_blank")
    }

    const handleOpenBatchDetail = async (batch) => {
        setBatchDetailOpen(true)
        setBatchDetail(null)
        setSelectedRunIds([])
        setBatchDetailLoading(true)
        const res = await fetchBatchDetail(`${BILLING_BATCH_BASE}${batch.id}/`)
        const detail = res?.batch || res
        setBatchDetail(detail)
        // Default: select all DONE runs
        const defaultSelected = (detail?.progress || [])
            .filter((p) => p.stage_status === "DONE")
            .map((p) => p.billing_run_id)
        setSelectedRunIds(defaultSelected)
        setBatchDetailLoading(false)
    }

    const toggleRunSelect = (runId) => {
        setSelectedRunIds((prev) =>
            prev.includes(runId) ? prev.filter((x) => x !== runId) : [...prev, runId]
        )
    }

    const allProgress = batchDetail?.progress || []
    const selectableRuns = allProgress.filter((p) => p.billing_run_id)
    const isAllSelected = selectableRuns.length > 0 && selectedRunIds.length === selectableRuns.length

    const toggleSelectAll = () => {
        setSelectedRunIds(isAllSelected ? [] : selectableRuns.map((p) => p.billing_run_id))
    }

    const downloadSelected = async (fmt) => {
        if (!batchDetail || !selectedRunIds.length) return
        if (fmt === "zip") {
            setZipDownloading(true)
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
                a.download = `batch_${batchDetail.id}_billing.zip`
                a.click()
                window.URL.revokeObjectURL(url)
                SuccessToaster(`Downloaded ${selectedRunIds.length} file(s)`)
            } catch (err) {
                ErrorToaster(err.message || "Zip download failed")
            } finally {
                setZipDownloading(false)
            }
        } else {
            setCombinedDownloading(true)
            try {
                const res = await fetch(`${BILLING_BATCH_BASE}${batchDetail.id}/download/?fmt=combined`, {
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
                a.download = `batch_${batchDetail.id}_combined.xlsx`
                a.click()
                window.URL.revokeObjectURL(url)
                SuccessToaster(`Combined Excel downloaded for ${selectedRunIds.length} customer(s)`)
            } catch (err) {
                ErrorToaster(err.message || "Combined download failed")
            } finally {
                setCombinedDownloading(false)
            }
        }
    }

    const runColumns = useMemo(() => [
        {
            header: "Batch ID",
            accessorKey: "id",
            cell: (c) => (
                <span className="fw-semibold text-primary" style={{ cursor: "pointer" }} onClick={() => handleOpenBatchDetail(c.row.original)}>
                    #{c.getValue()}
                </span>
            ),
        },
        {
            header: "Period",
            id: "period",
            cell: (cell) => {
                const r = cell.row.original
                const fmt = (d) => d ? d.slice(0, 10).split("-").reverse().join("-") : "—"
                return <span className="small">{fmt(r.billing_period_start)} – {fmt(r.billing_period_end)}</span>
            },
        },
        {
            header: "Customers",
            id: "customers",
            cell: (cell) => {
                const r = cell.row.original
                return <span>{r.processed_customers ?? 0} / {r.total_customers ?? 0}</span>
            },
        },
        {
            header: "Summary",
            id: "summary",
            cell: (cell) => {
                const t = cell.row.original.summary?.totals || {}
                return (
                    <div className="d-flex flex-wrap gap-1">
                        {t.done > 0 && <Badge color="success" className="fw-normal">Done: {t.done}</Badge>}
                        {t.failed > 0 && <Badge color="danger" className="fw-normal">Failed: {t.failed}</Badge>}
                        {t.skipped > 0 && <Badge color="secondary" className="fw-normal">Skipped: {t.skipped}</Badge>}
                    </div>
                )
            },
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: (c) => <Badge color={getBatchStatusColor(c.getValue())} className="p-2">{c.getValue()?.toUpperCase()}</Badge>,
        },
        {
            header: "Created",
            accessorKey: "created_at",
            cell: (c) => {
                const v = c.getValue()
                if (!v) return "—"
                return (
                    <div>
                        <div>{v.slice(0, 10).split("-").reverse().join("-")}</div>
                        <div className="text-muted small">{v.slice(11, 16)}</div>
                    </div>
                )
            },
        },
        {
            header: "Action",
            id: "action",
            cell: (cell) => {
                const id = cell.row.original.id
                return (
                    <div className="d-flex gap-2 justify-content-center">
                        <Button color="success" size="sm" title="Download working files (zip)" onClick={() => handleRunDownload(id)}>
                            <FaFileArchive size={15} />
                        </Button>
                        <Button color="primary" size="sm" title="Download combined" onClick={() => window.open(`${BILLING_BATCH_BASE}${id}/download/?fmt=combined`, "_blank")}>
                            <FaLayerGroup size={15} />
                        </Button>
                    </div>
                )
            },
        },
    ], [])

    return (
        <div>
            <UploadPreviewModal
                isOpen={uploadOpen}
                toggle={() => setUploadOpen(!uploadOpen)}
            />

            <Card className="shadow-sm border-0">
                <CardBody className="p-0">
                    <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="mb-0 fw-bold">Generated Working Files</h5>
                        <div className="d-flex gap-2 flex-wrap">
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
                        handleUserClick={handleOpenBatchDetail}
                    />
                </CardBody>
            </Card>

            {/* ── Batch Detail / Customer Selection Modal ── */}
            <Modal isOpen={batchDetailOpen} toggle={() => setBatchDetailOpen(false)} size="lg" centered scrollable>
                <ModalHeader toggle={() => setBatchDetailOpen(false)}>
                    {batchDetail
                        ? `Batch #${batchDetail.id} — ${batchDetail.billing_period_start?.slice(0, 10).split("-").reverse().join("-")} to ${batchDetail.billing_period_end?.slice(0, 10).split("-").reverse().join("-")}`
                        : "Loading batch…"}
                </ModalHeader>
                <ModalBody>
                    {batchDetailLoading && (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    )}
                    {!batchDetailLoading && batchDetail && (
                        <>
                            {/* Select-all header */}
                            <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-2">
                                    <Input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <Label className="mb-0 fw-semibold small">Select All ({selectableRuns.length})</Label>
                                </div>
                                <span className="text-muted small">{selectedRunIds.length} selected</span>
                            </div>

                            {/* Customer list */}
                            <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                                {allProgress.map((p) => {
                                    const statusColor = p.stage_status === "DONE" ? "success"
                                        : p.stage_status === "EMPTY" ? "secondary"
                                            : p.stage_status === "ISSUES" ? "warning"
                                                : "danger"
                                    return (
                                        <div
                                            key={p.billing_run_id || p.customer_id}
                                            className="d-flex align-items-center gap-3 py-2 px-1 border-bottom"
                                            style={{ cursor: p.billing_run_id ? "pointer" : "default" }}
                                            onClick={() => p.billing_run_id && toggleRunSelect(p.billing_run_id)}
                                        >
                                            <Input
                                                type="checkbox"
                                                checked={selectedRunIds.includes(p.billing_run_id)}
                                                disabled={!p.billing_run_id}
                                                onChange={() => { }}
                                                style={{ cursor: p.billing_run_id ? "pointer" : "not-allowed", flexShrink: 0 }}
                                            />
                                            <div className="flex-grow-1 min-w-0">
                                                <div className="fw-semibold small text-truncate">{p.customer_name}</div>
                                                <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                                    Run #{p.billing_run_id ?? "—"} &nbsp;·&nbsp; {p.total_shipments ?? 0} shipments
                                                    {p.message && <> &nbsp;·&nbsp; <span className="fst-italic">{p.message}</span></>}
                                                </div>
                                            </div>
                                            <Badge color={statusColor} className="fw-normal flex-shrink-0">{p.stage_status}</Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <span className="me-auto text-muted small">{selectedRunIds.length} customer(s) selected</span>
                    <Button color="success" disabled={!selectedRunIds.length || zipDownloading} onClick={() => downloadSelected("zip")} className="d-flex align-items-center gap-2">
                        {zipDownloading ? <Spinner size="sm" /> : <FaFileArchive size={15} />} Download Zip
                    </Button>
                    {/* <Button color="primary" disabled={!selectedRunIds.length || combinedDownloading} onClick={() => downloadSelected("combined")} className="d-flex align-items-center gap-2">
                        {combinedDownloading ? <Spinner size="sm" /> : <FaLayerGroup size={15} />} Download Combined
                    </Button> */}
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default WorkingTab
