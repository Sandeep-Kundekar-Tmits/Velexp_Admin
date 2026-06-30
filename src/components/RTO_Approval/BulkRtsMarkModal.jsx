// Bulk RTS Mark — modal to mark shipments as RTS (Return to Shipper) in bulk,
// either by Excel/CSV upload or by pasting AWB numbers manually.
// Mirrors the flow/logic of the existing Velocity-Ops project.
import { useMemo, useRef, useState } from "react"
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Nav, NavItem, NavLink, TabContent, TabPane,
    Button, Spinner, Collapse,
} from "reactstrap"
import classnames from "classnames"
import {
    Upload, FileText, Download, CheckCircle, XCircle, Clock,
    SkipForward, AlertCircle, ChevronDown, RotateCcw,
} from "lucide-react"
import { BULK_RTA_UPLOAD, BULK_RTS_STATUS_UPDATE } from "../../api"

// --- auth / identity from the stored session ---
const getAuth = () => {
    const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
    return {
        employeeId: authUser?.user?.id,
        serviceCenter: authUser?.user?.service_center || authUser?.user?.ec_code || "",
        token: authUser?.token || authUser?.access || authUser?.access_token || "",
    }
}

// Result buckets — each tries a few possible response keys for resilience.
const BUCKETS = [
    { id: "rts", label: "RTS Marked", keys: ["rts_marked", "rts", "marked_rts"], color: "#34c38f", Icon: CheckCircle },
    { id: "rto", label: "RTO Marked", keys: ["rto_marked", "rto", "already_rto"], color: "#556ee6", Icon: RotateCcw },
    { id: "pending", label: "Pending", keys: ["pending"], color: "#f1b44c", Icon: Clock },
    { id: "skipped", label: "Skipped", keys: ["skipped", "skip"], color: "#74788d", Icon: SkipForward },
    { id: "failed", label: "Failed", keys: ["failed", "errors", "failure"], color: "#f46a6a", Icon: XCircle },
]

const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

// normalize a bucket value into a list of { awbno, reason }
const toItems = (val) => {
    const arr = Array.isArray(val) ? val : Array.isArray(val?.items) ? val.items : Array.isArray(val?.awbno_list) ? val.awbno_list : []
    return arr.map((it) =>
        typeof it === "string"
            ? { awbno: it, reason: "" }
            : { awbno: it?.awbno || it?.awb || "—", reason: it?.reason || it?.message || it?.remark || it?.error || "" }
    )
}
const toCount = (val, items) =>
    typeof val === "number" ? val : typeof val?.count === "number" ? val.count : items.length

const BulkRtsMarkModal = ({ isOpen, toggle }) => {
    const [activeTab, setActiveTab] = useState("excel")
    const [file, setFile] = useState(null)
    const [awbText, setAwbText] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [dragOver, setDragOver] = useState(false)
    const [openBuckets, setOpenBuckets] = useState({})
    const fileInputRef = useRef(null)

    const { employeeId, serviceCenter, token } = useMemo(getAuth, [])
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

    const resetAll = () => {
        setFile(null)
        setAwbText("")
        setResult(null)
        setErrorMsg("")
        setOpenBuckets({})
    }

    const handleClose = () => {
        resetAll()
        toggle()
    }

    // --- file selection (browse + drag/drop) ---
    const acceptFile = (f) => {
        if (!f) return
        const ok = /\.(xlsx|csv)$/i.test(f.name)
        if (!ok) {
            setErrorMsg("Please select an .xlsx or .csv file")
            return
        }
        setErrorMsg("")
        setFile(f)
    }
    const onDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        acceptFile(e.dataTransfer.files?.[0])
    }

    // --- template download (single awbno column) ---
    const downloadTemplate = () => {
        const blob = new Blob(["awbno\n"], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "bulk_rts_template.csv"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // --- submit ---
    const submit = async () => {
        setErrorMsg("")
        try {
            setLoading(true)
            let res
            if (activeTab === "excel") {
                if (!file) { setErrorMsg("Please choose a file first"); setLoading(false); return }
                const fd = new FormData()
                fd.append("file", file)
                fd.append("employee_id", employeeId ?? "")
                fd.append("service_center", serviceCenter ?? "")
                res = await fetch(BULK_RTA_UPLOAD, { method: "POST", credentials: "include", headers: { ...authHeaders }, body: fd })
            } else {
                const list = awbText
                    .split(/[\n,]/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                if (list.length === 0) { setErrorMsg("Please paste at least one AWB number"); setLoading(false); return }
                const payload = {
                    awbno_list: list.map((awbno) => ({ awbno, employee_id: employeeId, service_center: serviceCenter })),
                }
                res = await fetch(BULK_RTS_STATUS_UPDATE, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json", ...authHeaders },
                    body: JSON.stringify(payload),
                })
            }
            const json = await res.json()
            if (json?.status === "success") {
                setResult(json?.data || json)
            } else {
                setErrorMsg(json?.msg || json?.error || json?.message || "Request failed")
            }
        } catch (err) {
            setErrorMsg(err?.message || "Network error")
        } finally {
            setLoading(false)
        }
    }

    // --- derived buckets for results view ---
    const buckets = useMemo(() => {
        if (!result) return []
        return BUCKETS.map((b) => {
            const key = b.keys.find((k) => result[k] !== undefined)
            const raw = key ? result[key] : undefined
            const items = toItems(raw)
            return { ...b, items, count: toCount(raw, items) }
        })
    }, [result])

    return (
        <Modal isOpen={isOpen} toggle={handleClose} size="lg" centered scrollable>
            <ModalHeader toggle={handleClose}>Bulk RTS Mark</ModalHeader>
            <ModalBody>
                {!result ? (
                    <>
                        <Nav tabs className="mb-3">
                            <NavItem>
                                <NavLink className={classnames({ active: activeTab === "excel" })} onClick={() => setActiveTab("excel")} style={{ cursor: "pointer" }}>
                                    <Upload size={16} className="me-1" /> Excel Upload
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink className={classnames({ active: activeTab === "manual" })} onClick={() => setActiveTab("manual")} style={{ cursor: "pointer" }}>
                                    <FileText size={16} className="me-1" /> Manual Entry
                                </NavLink>
                            </NavItem>
                        </Nav>

                        <TabContent activeTab={activeTab}>
                            {/* Excel upload */}
                            <TabPane tabId="excel">
                                <div className="d-flex justify-content-end mb-2">
                                    <Button color="link" className="p-0 d-flex align-items-center gap-1" onClick={downloadTemplate}>
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
                                    <div className="fw-semibold">{file ? file.name : "Drag & drop or click to select"}</div>
                                    <div className="text-muted small">Accepts .xlsx or .csv</div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.csv"
                                        className="d-none"
                                        onChange={(e) => acceptFile(e.target.files?.[0])}
                                    />
                                </div>
                            </TabPane>

                            {/* Manual entry */}
                            <TabPane tabId="manual">
                                <label className="fw-semibold mb-1">Paste AWB numbers (one per line)</label>
                                <textarea
                                    className="form-control"
                                    rows={8}
                                    placeholder={"VO0001234\nVO0001235\nVO0001236"}
                                    value={awbText}
                                    onChange={(e) => setAwbText(e.target.value)}
                                />
                                <div className="text-muted small mt-1">
                                    {awbText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length} AWB(s)
                                </div>
                            </TabPane>
                        </TabContent>

                        {errorMsg && (
                            <div className="d-flex align-items-center gap-2 mt-3 text-danger small">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}
                    </>
                ) : (
                    /* ---------- Results view ---------- */
                    <>
                        <div className="d-flex flex-wrap gap-2 mb-3">
                            {buckets.map((b) => (
                                <div key={b.id} className="px-3 py-2 rounded d-flex align-items-center gap-2" style={{ background: tint(b.color), color: b.color, minWidth: 120 }}>
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
                        <Button color="primary" onClick={submit} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Mark RTS"}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button color="primary" outline onClick={resetAll} className="d-flex align-items-center gap-1">
                            <RotateCcw size={16} /> Mark More
                        </Button>
                        <Button color="secondary" onClick={handleClose}>Close</Button>
                    </>
                )}
            </ModalFooter>
        </Modal>
    )
}

export default BulkRtsMarkModal
