import React, { useMemo, useRef, useState } from "react"
import { Badge, Button, Card, CardBody, Col, Input, Label, Row, Spinner } from "reactstrap"
import * as XLSX from "xlsx"
import axios from "axios"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BULK_CANCEL_BOOKING, USER_CANCELLATION_REPORT } from "../../api"
import { MdCancel, MdCloudUpload, MdFileDownload, MdOutlineCheckCircle, MdSearch } from "react-icons/md"
import DateRangePicker from "../../components/Common/DateRangePicker"
import TableContainer from "../../components/Table/TableContainer"

const todayISO = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const isoToDMY = (iso) => {
    const [y, m, d] = iso.split("-")
    return `${d}-${m}-${y}`
}

const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["AWB No"], ["VE123456789"], ["VE987654321"]])
    ws["!cols"] = [{ wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cancel AWBs")
    XLSX.writeFile(wb, "cancel_shipments_template.xlsx")
}

const parseText = (text) =>
    [...new Set(
        text.split(/[\n,;\t]+/).map((s) => s.trim().toUpperCase()).filter(Boolean)
    )]

const CancelShipments = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const fileRef = useRef()

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id, [])

    // --- Cancel form state ---
    const [text, setText] = useState("")
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)

    // --- Report state ---
    const [fromDate, setFromDate] = useState(todayISO())
    const [toDate, setToDate] = useState(todayISO())
    const [reportLoading, setReportLoading] = useState(false)
    const [reportData, setReportData] = useState(null)

    const awbs = parseText(text)

    // --- Report columns (built from first row keys if dynamic, or fixed set) ---
    const reportColumns = useMemo(() => {
        if (!reportData?.length) return []
        const keys = Object.keys(reportData[0])
        return keys.map((k) => ({
            header: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            accessorKey: k,
            enableSorting: true,
            cell: (c) => {
                const val = c.getValue()
                if (val === null || val === undefined || val === "") return <span className="text-muted">—</span>
                if (k.toLowerCase().includes("status")) {
                    const lower = String(val).toLowerCase()
                    const color = lower.includes("cancel") ? "danger" : lower.includes("success") ? "success" : "secondary"
                    return <Badge color={color} className="fw-normal">{val}</Badge>
                }
                return String(val)
            },
        }))
    }, [reportData])

    const handleFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: "array" })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
                const extracted = rows
                    .flat()
                    .map((v) => String(v ?? "").trim().toUpperCase())
                    .filter((v) => v && !["AWBNO", "AWB NO", "AWB"].includes(v))
                setText((prev) => {
                    const existing = prev.trim()
                    return existing ? `${existing}\n${extracted.join("\n")}` : extracted.join("\n")
                })
                setResults(null)
                SucceesToaster(`${extracted.length} AWB(s) loaded from file`)
            } catch {
                ErrorToaster("Could not parse file — use .xlsx or .csv")
            }
        }
        reader.readAsArrayBuffer(file)
        e.target.value = ""
    }

    const handleCancel = async () => {
        if (!awbs.length) { ErrorToaster("Enter at least one AWB number"); return }
        setLoading(true)
        setResults(null)
        try {
            const res = await axios.post(
                BULK_CANCEL_BOOKING,
                { awbnos: awbs, user_id: userId },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            setResults(res.data)
            const cancelled = res.data?.cancelled?.length ?? 0
            const failed = res.data?.failed?.length ?? 0
            if (cancelled > 0) SucceesToaster(`${cancelled} shipment(s) cancelled`)
            if (failed > 0) ErrorToaster(`${failed} shipment(s) failed`)
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.detail || "Cancellation failed")
        } finally {
            setLoading(false)
        }
    }

    const handleFetchReport = async () => {
        setReportLoading(true)
        setReportData(null)
        try {
            const res = await axios.post(
                USER_CANCELLATION_REPORT,
                { user_id: userId, fromDate: isoToDMY(fromDate), toDate: isoToDMY(toDate) },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            const rows = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.results || []
            setReportData(rows)
            if (!rows.length) SucceesToaster("No records found for selected range")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.detail || "Failed to fetch report")
        } finally {
            setReportLoading(false)
        }
    }

    const successList = results?.cancelled || results?.success || []
    const failedList  = results?.failed   || results?.errors  || []

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: 0, zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Cancel Shipments" />
                </div>

                <div className="container-fluid px-3 py-3">

                    {/* ── Cancel form ── */}
                    <Card className="shadow-sm border-0 mb-3">
                        <CardBody className="py-3">
                            <Row className="g-3 align-items-stretch">

                                {/* Upload zone */}
                                <Col md={4} className="border-end pe-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="fw-bold small">Upload Excel / CSV</span>
                                        <Button color="outline-success" size="sm" onClick={downloadTemplate} className="d-flex align-items-center gap-1 py-0 px-2" style={{ fontSize: "0.75rem" }}>
                                            <MdFileDownload size={14} /> Template
                                        </Button>
                                    </div>
                                    <label
                                        htmlFor="cancel-file-input"
                                        className="rounded-3 d-flex flex-column align-items-center justify-content-center text-center w-100 mb-0"
                                        style={{ border: "1.5px dashed #adb5bd", background: "#f8f9fa", cursor: "pointer", padding: "22px 12px" }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const file = e.dataTransfer.files?.[0]
                                            if (file) handleFile({ target: { files: [file], value: "" } })
                                        }}
                                    >
                                        <MdCloudUpload size={30} className="text-muted mb-1" />
                                        <p className="mb-0 fw-semibold text-muted" style={{ fontSize: "0.8rem" }}>Click or drag & drop</p>
                                        <p className="mb-0 text-muted" style={{ fontSize: "0.72rem" }}>.xlsx or .csv</p>
                                        <input id="cancel-file-input" ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="d-none" onChange={handleFile} />
                                    </label>
                                </Col>

                                {/* AWB textarea + cancel button */}
                                <Col md={8}>
                                    <Label className="fw-bold small mb-1">
                                        AWB Numbers
                                        <span className="fw-normal text-muted ms-1">(newline / comma / semicolon separated)</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        rows={5}
                                        placeholder={"VE123456789\nVE987654321\nVE111222333"}
                                        value={text}
                                        onChange={(e) => { setText(e.target.value); setResults(null) }}
                                        style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "none" }}
                                    />
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                        {text.trim() && (
                                            <span className="text-muted small">{awbs.length} AWB{awbs.length !== 1 ? "s" : ""}</span>
                                        )}
                                        <div className="flex-grow-1" />
                                        {text.trim() && (
                                            <Button color="outline-secondary" size="sm" onClick={() => { setText(""); setResults(null) }}>
                                                Clear
                                            </Button>
                                        )}
                                        <Button
                                            color="danger"
                                            size="sm"
                                            className="d-flex align-items-center gap-1 fw-bold px-3"
                                            onClick={handleCancel}
                                            disabled={loading || !awbs.length}
                                        >
                                            {loading
                                                ? <><Spinner size="sm" /> Cancelling…</>
                                                : <><MdCancel size={15} /> Cancel Shipments {awbs.length > 0 && `(${awbs.length})`}</>}
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Cancel results ── */}
                    {results && (
                        <Card className="shadow-sm border-0 mb-3">
                            <CardBody>
                                <h6 className="fw-bold mb-3">Results</h6>
                                <Row className="g-2 mb-3">
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 p-2 text-center">
                                            <div className="fw-bold text-success" style={{ fontSize: "1.5rem" }}>{successList.length}</div>
                                            <div className="small text-success">Cancelled</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 p-2 text-center">
                                            <div className="fw-bold text-danger" style={{ fontSize: "1.5rem" }}>{failedList.length}</div>
                                            <div className="small text-danger">Failed</div>
                                        </div>
                                    </Col>
                                </Row>

                                {successList.length > 0 && (
                                    <div className="mb-2">
                                        <p className="small fw-semibold text-success mb-1 d-flex align-items-center gap-1">
                                            <MdOutlineCheckCircle /> Cancelled
                                        </p>
                                        <div className="d-flex flex-wrap gap-1">
                                            {successList.map((awb) => (
                                                <Badge key={awb} color="success" className="fw-normal" style={{ fontFamily: "monospace" }}>{awb}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {failedList.length > 0 && (
                                    <div>
                                        <p className="small fw-semibold text-danger mb-1 d-flex align-items-center gap-1">
                                            <MdCancel /> Failed
                                        </p>
                                        <div className="d-flex flex-wrap gap-1">
                                            {failedList.map((item) => {
                                                const awb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                const reason = typeof item === "object" ? (item.reason || item.message || item.error) : null
                                                return (
                                                    <Badge key={awb} color="danger" className="fw-normal" style={{ fontFamily: "monospace" }} title={reason || ""}>
                                                        {awb}{reason ? ` — ${reason}` : ""}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    {/* ── Cancellation Report ── */}
                    <Card className="shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="fw-bold mb-0">Cancelled Shipments Report</h6>
                            </div>

                            <Row className="g-2 align-items-end mb-3">
                                <Col md={4}>
                                    <DateRangePicker
                                        label="Date Range"
                                        startDate={fromDate}
                                        endDate={toDate}
                                        onChange={(s, e) => { setFromDate(s); setToDate(e); setReportData(null) }}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="d-flex align-items-center gap-1 fw-bold px-3"
                                        onClick={handleFetchReport}
                                        disabled={reportLoading}
                                    >
                                        {reportLoading
                                            ? <><Spinner size="sm" /> Fetching…</>
                                            : <><MdSearch size={16} /> Fetch Report</>}
                                    </Button>
                                </Col>
                            </Row>

                            {reportData && reportData.length > 0 && (
                                <TableContainer
                                    columns={reportColumns}
                                    data={reportData}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    SearchPlaceholder="Search AWB, status…"
                                    isDownloadExcle={true}
                                    onDownloadExcle={() => {
                                        const ws = XLSX.utils.json_to_sheet(reportData)
                                        const wb = XLSX.utils.book_new()
                                        XLSX.utils.book_append_sheet(wb, ws, "Cancellations")
                                        XLSX.writeFile(wb, `cancelled_shipments_${fromDate}_${toDate}.xlsx`)
                                    }}
                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                                    tableClass="table-hover mb-0"
                                />
                            )}

                            {reportData && reportData.length === 0 && (
                                <div className="text-center py-4 text-muted">
                                    <MdCancel size={32} className="mb-2 opacity-25" />
                                    <p className="mb-0">No cancellations found for the selected date range.</p>
                                </div>
                            )}

                            {!reportData && !reportLoading && (
                                <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                                    Select a date range and click Fetch Report
                                </div>
                            )}
                        </CardBody>
                    </Card>

                </div>
            </div>
        </React.Fragment>
    )
}

export default CancelShipments
