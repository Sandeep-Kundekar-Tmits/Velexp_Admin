// Mark / Remove RTO via Excel — standalone bulk flow, independent of any table selection.
// CS uploads a file of AWBs (one per row) to either flag them RTO_APPROVAL or clear that flag.
import { useEffect, useMemo, useRef, useState } from "react"
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, FormGroup, Label, Input, FormFeedback, Collapse,
} from "reactstrap"
import * as XLSX from "xlsx"
import { CheckCircle, XCircle, SkipForward, AlertCircle, ChevronDown, RotateCcw, Upload, Download } from "lucide-react"
import { BULK_SET_SHIPMENT_FLAG } from "../../api"

const MODE_CONFIG = {
    mark: {
        title: "Mark for RTO — Excel Upload",
        flag: "RTO_APPROVAL",
        remarkRequired: true,
        remarkLabel: "Remark",
        remarkPlaceholder: "Reason for RTO approval...",
        remarkFeedback: "Remark is required to flag a shipment RTO_APPROVAL.",
        submitLabel: "Mark for RTO",
        successLabel: "Flagged for RTO",
        templateFileName: "mark_for_rto_template.csv",
    },
    remove: {
        title: "Remove RTO — Excel Upload",
        flag: null,
        remarkRequired: false,
        remarkLabel: "Remark (optional)",
        remarkPlaceholder: "Reason for removing RTO...",
        remarkFeedback: "",
        submitLabel: "Remove RTO",
        successLabel: "Removed from RTO",
        templateFileName: "remove_rto_template.csv",
    },
}

const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

const downloadTemplate = (fileName) => {
    const blob = new Blob(["awbno\n"], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

const MarkForRtoExcelModal = ({ isOpen, toggle, onDone, mode = "mark" }) => {
    const config = MODE_CONFIG[mode]
    const buckets_def = [
        { id: "updated", label: config.successLabel, color: "#34c38f", Icon: CheckCircle },
        { id: "skipped", label: "Skipped", color: "#f1b44c", Icon: SkipForward },
        { id: "not_found", label: "Not Found", color: "#74788d", Icon: XCircle },
    ]
    const [awbList, setAwbList] = useState([])
    const [fileName, setFileName] = useState("")
    const [dragOver, setDragOver] = useState(false)
    const [remark, setRemark] = useState("")
    const [remarkError, setRemarkError] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [openBuckets, setOpenBuckets] = useState({})
    const fileInputRef = useRef(null)

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id, [])

    useEffect(() => {
        if (isOpen) {
            setAwbList([])
            setFileName("")
            setRemark("")
            setRemarkError(false)
            setResult(null)
            setErrorMsg("")
            setOpenBuckets({})
        }
    }, [isOpen])

    const handleClose = () => toggle()

    const acceptFile = (file) => {
        if (!file) return
        if (!/\.(xlsx|csv)$/i.test(file.name)) {
            setErrorMsg("Please select an .xlsx or .csv file")
            return
        }
        const reader = new FileReader()
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(ev.target.result, { type: "array" })
                const ws = wb.Sheets[wb.SheetNames[0]]
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
                const extracted = [...new Set(
                    rows.flat()
                        .map((v) => String(v ?? "").trim())
                        .filter((v) => v && !["AWBNO", "AWB NO", "AWB"].includes(v.toUpperCase()))
                )]
                setAwbList(extracted)
                setFileName(file.name)
                setErrorMsg("")
            } catch {
                setErrorMsg("Could not parse file — use .xlsx or .csv")
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        acceptFile(e.dataTransfer.files?.[0])
    }

    const submit = async () => {
        setErrorMsg("")
        if (awbList.length === 0) {
            setErrorMsg("Please upload a file with at least one AWB number")
            return
        }
        if (config.remarkRequired && !remark.trim()) {
            setRemarkError(true)
            return
        }
        setRemarkError(false)

        try {
            setLoading(true)
            const res = await fetch(BULK_SET_SHIPMENT_FLAG, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    awbno_list: awbList,
                    shipment_flag: config.flag,
                    remark,
                    user_id: userId,
                }),
            })
            const json = await res.json()
            if (!res.ok || json?.status === "error") {
                setErrorMsg(json?.message || "Request failed")
                return
            }
            setResult(json)
            onDone?.()
        } catch (err) {
            setErrorMsg(err?.message || "Network error")
        } finally {
            setLoading(false)
        }
    }

    const buckets = useMemo(() => {
        if (!result) return []
        return buckets_def.map((b) => {
            const raw = result[b.id] || []
            const items = raw.map((it) =>
                typeof it === "string" ? { awbno: it, reason: "" } : { awbno: it?.awbno, reason: it?.reason || "" }
            )
            return { ...b, items, count: items.length }
        })
    }, [result])

    return (
        <Modal isOpen={isOpen} toggle={handleClose} size="lg" centered scrollable>
            <ModalHeader toggle={handleClose}>{config.title}</ModalHeader>
            <ModalBody>
                {!result ? (
                    <>
                        <FormGroup>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Label className="fw-semibold mb-0">Upload AWB list</Label>
                                <Button color="link" className="p-0 d-flex align-items-center gap-1" onClick={() => downloadTemplate(config.templateFileName)}>
                                    <Download size={15} /> Template
                                </Button>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                className="text-center p-4 rounded"
                                style={{
                                    cursor: "pointer",
                                    border: `2px dashed ${dragOver ? "#556ee6" : "#ced4da"}`,
                                    background: dragOver ? "rgba(85,110,230,0.06)" : "#fbfbfd",
                                    transition: "all .15s ease",
                                }}
                            >
                                <Upload size={34} className="text-primary mb-2" />
                                <div className="fw-semibold">{fileName || "Drag & drop or click to select"}</div>
                                <div className="text-muted small">Accepts .xlsx or .csv, one AWB per row</div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.csv"
                                    className="d-none"
                                    onChange={(e) => acceptFile(e.target.files?.[0])}
                                />
                            </div>
                            {awbList.length > 0 && (
                                <div className="text-muted small mt-1">{awbList.length} AWB(s) loaded from file</div>
                            )}
                        </FormGroup>

                        <FormGroup className="mb-0">
                            <Label className="fw-semibold">{config.remarkLabel}</Label>
                            <Input
                                type="textarea"
                                rows={3}
                                placeholder={config.remarkPlaceholder}
                                value={remark}
                                invalid={remarkError}
                                onChange={(e) => {
                                    setRemark(e.target.value)
                                    if (e.target.value.trim()) setRemarkError(false)
                                }}
                            />
                            {config.remarkFeedback && <FormFeedback>{config.remarkFeedback}</FormFeedback>}
                        </FormGroup>

                        {errorMsg && (
                            <div className="d-flex align-items-center gap-2 mt-3 text-danger small">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {buckets.map((b) => (
                                <div key={b.id} className="px-3 py-2 rounded d-flex align-items-center gap-2" style={{ background: tint(b.color), color: b.color, minWidth: 130 }}>
                                    <b.Icon size={18} />
                                    <div>
                                        <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1 }}>{b.count}</div>
                                        <div style={{ fontSize: 11 }}>{b.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {buckets.filter((b) => b.items.length > 0).map((b) => {
                            const open = !!openBuckets[b.id]
                            return (
                                <div key={b.id} className="border rounded mb-2">
                                    <div
                                        role="button"
                                        onClick={() => setOpenBuckets((p) => ({ ...p, [b.id]: !p[b.id] }))}
                                        className="d-flex align-items-center justify-content-between px-3 py-2"
                                        style={{ cursor: "pointer", userSelect: "none" }}
                                    >
                                        <span className="d-flex align-items-center gap-2 fw-semibold" style={{ color: b.color }}>
                                            <b.Icon size={16} /> {b.label} <span className="text-muted">({b.items.length})</span>
                                        </span>
                                        <ChevronDown size={18} className="text-muted" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
                                    </div>
                                    <Collapse isOpen={open}>
                                        <div className="px-3 pb-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                                            {b.items.map((it, i) => (
                                                <div key={`${it.awbno}-${i}`} className="d-flex justify-content-between border-bottom py-1" style={{ fontSize: 13 }}>
                                                    <span className="fw-semibold">{it.awbno}</span>
                                                    {it.reason && <span className="text-muted ms-2 text-end">{it.reason}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </Collapse>
                                </div>
                            )
                        })}
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                {!result ? (
                    <>
                        <Button color="secondary" outline onClick={handleClose} disabled={loading}>Cancel</Button>
                        <Button color={mode === "remove" ? "danger" : "primary"} onClick={submit} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : config.submitLabel}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="primary" outline onClick={() => setResult(null)} className="d-flex align-items-center gap-1">
                            <RotateCcw size={16} /> Back
                        </Button>
                        <Button color="secondary" onClick={handleClose}>Close</Button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    )
}

export default MarkForRtoExcelModal
