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
            {/* No page-fit: an upload flow with a preview below it is taller
                than the viewport by design and should keep scrolling. */}
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                {/* No sticky wrapper: MainHeaderComp draws nothing inline now,
                    it hands the title and the template download to the layout's
                    PageHeader. */}
                <MainHeaderComp
                    title="Cancel Shipments"
                    subTitle="Cancel booked AWBs from a sheet or a pasted list."
                    extraFields={
                        <Button
                            onClick={downloadTemplate}
                            className="table-action-btn table-action-btn-export"
                        >
                            <MdFileDownload size={15} aria-hidden="true" /> Template
                        </Button>
                    }
                />

                <div className="container-fluid relative z-10 px-4 pb-4">

                    {/* ── Cancel form ── */}
                    <Card className="mb-4">
                        <CardBody className="py-4">
                            <Row className="gap-4 items-stretch">

                                {/* Upload zone */}
                                <Col md={4} className="border-end pr-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-xs">Upload Excel / CSV</span>
                                    </div>
                                    {/* Colours in classes, not inline: the dashed
                                        #adb5bd on #f8f9fa was a white panel on
                                        the dark theme, and inline styles are
                                        unreachable from any stylesheet. */}
                                    <label
                                        htmlFor="cancel-file-input"
                                        className="mb-0 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] border-dashed border-white/15 bg-white/3 px-3 py-6 text-center transition-colors hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/8"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            const file = e.dataTransfer.files?.[0]
                                            if (file) handleFile({ target: { files: [file], value: "" } })
                                        }}
                                    >
                                        <MdCloudUpload size={30} className="text-ink-muted mb-1" />
                                        <p className="mb-0 font-semibold text-ink-muted" style={{ fontSize: "0.8rem" }}>Click or drag &amp; drop</p>
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
                        <Card className="mb-4">
                            <CardBody>
                                <h6 className="font-bold mb-4">Results</h6>
                                {/* Tinted tiles, written as Tailwind alpha
                                    colours.

                                    These were `bg-success-500 bg-opacity-10
                                    border-success border-opacity-25` -- Bootstrap
                                    5 opacity utilities, which Tailwind does not
                                    provide, so they did nothing at all. Each
                                    tile rendered a SOLID success/danger/warning
                                    fill with same-coloured text on top: green
                                    on green, red on red, unreadable.

                                    Same shape as the stat tiles elsewhere:
                                    count large, label small and muted. */}
                                <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {[
                                        ["Cancelled", successList.length, "border-success-500/30 bg-success-500/12 text-success-500"],
                                        ["Failed", failedList.length, "border-danger-500/30 bg-danger-500/12 text-danger-500"],
                                        ["Not Allowed", notAllowedList.length, "border-warning-500/30 bg-warning-500/12 text-warning-500"],
                                        ["Already Cancelled", alreadyCancelledList.length, "border-white/10 bg-white/4 text-ink-muted"],
                                    ].map(([label, count, tone]) => (
                                        <div key={label} className={`rounded-xl border p-3 text-center ${tone}`}>
                                            <div className="text-[22px] font-semibold leading-tight tracking-tight">
                                                {count}
                                            </div>
                                            <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider opacity-80">
                                                {label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

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
