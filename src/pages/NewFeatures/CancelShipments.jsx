import React, { useMemo, useRef, useState } from "react"
import { Badge, Button, Card, CardBody, Col, Input, Label, Row, Spinner } from "@/components/ui"
import * as XLSX from "xlsx"
import axios from "axios"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BULK_CANCEL_BOOKING } from "../../api"
import { MdBlock, MdCancel, MdCloudUpload, MdFileDownload, MdHistory, MdOutlineCheckCircle } from "react-icons/md"

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

    const awbs = parseText(text)

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
            const s = res.data?.summary || {}
            const cancelled = s.success_count ?? res.data?.success?.length ?? res.data?.cancelled?.length ?? 0
            const failed = s.failed_count ?? res.data?.failed?.length ?? 0
            const notAllowed = s.not_allowed_count ?? res.data?.not_allowed?.length ?? 0
            const alreadyCancelled = s.already_cancelled_count ?? res.data?.already_cancelled?.length ?? 0
            if (cancelled > 0) SucceesToaster(`${cancelled} shipment(s) cancelled`)
            if (failed > 0) ErrorToaster(`${failed} shipment(s) failed`)
            if (notAllowed > 0) ErrorToaster(`${notAllowed} shipment(s) not allowed to cancel`)
            if (alreadyCancelled > 0) SucceesToaster(`${alreadyCancelled} shipment(s) already cancelled`)
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.detail || "Cancellation failed")
        } finally {
            setLoading(false)
        }
    }

    const successList = results?.success || results?.cancelled || []
    const failedList  = results?.failed   || results?.errors  || []
    const notAllowedList = results?.not_allowed || []
    const alreadyCancelledList = results?.already_cancelled || []

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: 0, zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Cancel Shipments" />
                </div>

                <div className="container-fluid px-4 py-4">

                    {/* ── Cancel form ── */}
                    <Card className="shadow-sm border-0 mb-4">
                        <CardBody className="py-4">
                            <Row className="gap-4 items-stretch">

                                {/* Upload zone */}
                                <Col md={4} className="border-end pr-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-xs">Upload Excel / CSV</span>
                                        <Button color="outline-success" size="sm" onClick={downloadTemplate} className="flex items-center gap-1 py-0 px-2" style={{ fontSize: "0.75rem" }}>
                                            <MdFileDownload size={14} /> Template
                                        </Button>
                                    </div>
                                    <label
                                        htmlFor="cancel-file-input"
                                        className="rounded-3 flex flex-col items-center justify-center text-center w-full mb-0"
                                        style={{ border: "1.5px dashed #adb5bd", background: "#f8f9fa", cursor: "pointer", padding: "22px 12px" }}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const file = e.dataTransfer.files?.[0]
                                            if (file) handleFile({ target: { files: [file], value: "" } })
                                        }}
                                    >
                                        <MdCloudUpload size={30} className="text-ink-muted mb-1" />
                                        <p className="mb-0 font-semibold text-ink-muted" style={{ fontSize: "0.8rem" }}>Click or drag & drop</p>
                                        <p className="mb-0 text-ink-muted" style={{ fontSize: "0.72rem" }}>.xlsx or .csv</p>
                                        <input id="cancel-file-input" ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                                    </label>
                                </Col>

                                {/* AWB textarea + cancel button */}
                                <Col md={8}>
                                    <Label className="font-bold text-xs mb-1">
                                        AWB Numbers
                                        <span className="font-normal text-ink-muted ml-1">(newline / comma / semicolon separated)</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        rows={5}
                                        placeholder={"VE123456789\nVE987654321\nVE111222333"}
                                        value={text}
                                        onChange={(e) => { setText(e.target.value); setResults(null) }}
                                        style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "none" }}
                                    />
                                    <div className="flex items-center gap-2 mt-2">
                                        {text.trim() && (
                                            <span className="text-ink-muted text-xs">{awbs.length} AWB{awbs.length !== 1 ? "s" : ""}</span>
                                        )}
                                        <div className="grow" />
                                        {text.trim() && (
                                            <Button color="outline-secondary" size="sm" onClick={() => { setText(""); setResults(null) }}>
                                                Clear
                                            </Button>
                                        )}
                                        <Button
                                            color="danger"
                                            size="sm"
                                            className="flex items-center gap-1 font-bold px-4"
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
                        <Card className="shadow-sm border-0 mb-4">
                            <CardBody>
                                <h6 className="font-bold mb-4">Results</h6>
                                <Row className="gap-2 mb-4">
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-success-500 bg-opacity-10 border border-success border-opacity-25 p-2 text-center">
                                            <div className="font-bold text-success-500" style={{ fontSize: "1.5rem" }}>{successList.length}</div>
                                            <div className="text-xs text-success-500">Cancelled</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-danger-500 bg-opacity-10 border border-danger border-opacity-25 p-2 text-center">
                                            <div className="font-bold text-danger-500" style={{ fontSize: "1.5rem" }}>{failedList.length}</div>
                                            <div className="text-xs text-danger-500">Failed</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-warning-500 bg-opacity-10 border border-warning border-opacity-25 p-2 text-center">
                                            <div className="font-bold text-warning-500" style={{ fontSize: "1.5rem" }}>{notAllowedList.length}</div>
                                            <div className="text-xs text-warning-500">Not Allowed</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 p-2 text-center">
                                            <div className="font-bold text-ink-muted" style={{ fontSize: "1.5rem" }}>{alreadyCancelledList.length}</div>
                                            <div className="text-xs text-ink-muted">Already Cancelled</div>
                                        </div>
                                    </Col>
                                </Row>

                                {successList.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-success-500 mb-1 flex items-center gap-1">
                                            <MdOutlineCheckCircle /> Cancelled
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {successList.map((item, i) => {
                                                const awb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                return (
                                                    <Badge key={`${awb}-${i}`} color="success" className="font-normal" style={{ fontFamily: "monospace" }}>{awb}</Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {failedList.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-danger-500 mb-1 flex items-center gap-1">
                                            <MdCancel /> Failed
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {failedList.map((item, i) => {
                                                const awb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                const reason = typeof item === "object" ? (item.reason || item.message || item.error) : null
                                                return (
                                                    <Badge key={`${awb}-${i}`} color="danger" className="font-normal" style={{ fontFamily: "monospace" }} title={reason || ""}>
                                                        {awb}{reason ? ` — ${reason}` : ""}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {notAllowedList.length > 0 && (
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-warning-500 mb-1 flex items-center gap-1">
                                            <MdBlock /> Not Allowed
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {notAllowedList.map((item, i) => {
                                                const awb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                const reason = typeof item === "object" ? (item.reason || item.message || item.error) : null
                                                return (
                                                    <Badge key={`${awb}-${i}`} color="warning" className="font-normal text-ink" style={{ fontFamily: "monospace" }} title={reason || ""}>
                                                        {awb}{reason ? ` — ${reason}` : ""}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {alreadyCancelledList.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-ink-muted mb-1 flex items-center gap-1">
                                            <MdHistory /> Already Cancelled
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {alreadyCancelledList.map((item, i) => {
                                                const awb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                const reason = typeof item === "object" ? (item.reason || item.message || item.error) : null
                                                return (
                                                    <Badge key={`${awb}-${i}`} color="secondary" className="font-normal" style={{ fontFamily: "monospace" }} title={reason || ""}>
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

                </div>
            </div>
        </React.Fragment>
    )
}

export default CancelShipments
