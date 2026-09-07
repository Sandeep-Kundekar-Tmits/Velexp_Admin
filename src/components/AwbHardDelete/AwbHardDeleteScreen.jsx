// Shared screen for SPD Remove / RTS Remove — hard-deletes the given status marking
// for a list of AWBs. Backed by BULK_HARD_DELETE_SPD_STATUS / BULK_HARD_DELETE_RTS_STATUS.
import { useMemo, useState } from "react"
import axios from "axios"
import {
    Alert, Button, Card, CardBody, Col, Collapse, FormFeedback, Modal,
    ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from "reactstrap"
import { AlertCircle, CheckCircle, ChevronDown, SkipForward, XCircle } from "lucide-react"
import MainHeaderComp from "../MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"

const parseAwbList = (text) =>
    [...new Set(text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean))]

// Result buckets — response shape isn't guaranteed, so try a few likely keys per bucket.
const BUCKETS = [
    { id: "deleted", label: "Removed", keys: ["deleted", "removed", "hard_deleted", "success"], color: "#34c38f", Icon: CheckCircle },
    { id: "not_found", label: "Not Found", keys: ["not_found", "notfound", "missing"], color: "#f1b44c", Icon: AlertCircle },
    { id: "skipped", label: "Skipped", keys: ["skipped", "skip"], color: "#74788d", Icon: SkipForward },
    { id: "failed", label: "Failed", keys: ["failed", "errors", "failure"], color: "#f46a6a", Icon: XCircle },
]

const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

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

const AwbHardDeleteScreen = ({ statusLabel, apiUrl, pageTitle, pageSubtitle, employeeIdField = "employee_id" }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [awbText, setAwbText] = useState("")
    const [remark, setRemark] = useState("")
    const [touched, setTouched] = useState({ awbText: false, remark: false })
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [openBuckets, setOpenBuckets] = useState({})

    const awbList = useMemo(() => parseAwbList(awbText), [awbText])
    const awbListError = awbList.length === 0 ? "Enter at least one AWB number" : ""
    const remarkError = !remark.trim() ? "Remark is required" : ""
    const isValid = !awbListError && !remarkError

    const authUser = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}"), [])
    const employeeId = authUser?.user?.id

    const resetForm = () => {
        setAwbText("")
        setRemark("")
        setTouched({ awbText: false, remark: false })
    }

    const handleOpenConfirm = () => {
        setTouched({ awbText: true, remark: true })
        if (awbListError) { ErrorToaster(awbListError); return }
        if (remarkError) { ErrorToaster(remarkError); return }
        setConfirmOpen(true)
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await axios.post(
                apiUrl,
                { awbno_list: awbList, [employeeIdField]: employeeId, remark: remark.trim(), apply: true },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            const data = res.data || {}
            const message = data.message || data.msg || `${statusLabel} status removed for ${awbList.length} AWB(s)`
            setResult({ ...data, message, requested: awbList, time: new Date().toLocaleString() })
            SucceesToaster(message)
            setConfirmOpen(false)
            setOpenBuckets({})
            resetForm()
        } catch (err) {
            const data = err.response?.data
            ErrorToaster(
                data?.message || data?.msg || data?.detail || data?.error || `Failed to remove ${statusLabel} status`
            )
        } finally {
            setLoading(false)
        }
    }

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
        <div className="page-content">
            <MainHeaderComp title={pageTitle} subTitle={pageSubtitle} />

            <div className="container-fluid px-3 py-3">
                <Row>
                    <Col lg={7}>
                        <Card>
                            <CardBody>
                                <Alert color="warning" className="d-flex align-items-start gap-2">
                                    <i className="bx bx-error-circle fs-4"></i>
                                    <div>
                                        <div className="fw-semibold">This permanently removes the {statusLabel} status</div>
                                        <div className="small">
                                            The {statusLabel} status marking for the AWBs listed below will be hard-deleted
                                            from the system. This cannot be undone.
                                        </div>
                                    </div>
                                </Alert>

                                <div className="mb-3">
                                    <label className="fw-bold form-label">AWB Numbers</label>
                                    <textarea
                                        className={`form-control ${touched.awbText && awbListError ? "is-invalid" : ""}`}
                                        rows={8}
                                        placeholder={"WEL400564\nWEL400549"}
                                        value={awbText}
                                        onBlur={() => setTouched((t) => ({ ...t, awbText: true }))}
                                        onChange={(e) => setAwbText(e.target.value)}
                                    />
                                    {touched.awbText && awbListError ? (
                                        <FormFeedback className="d-block">{awbListError}</FormFeedback>
                                    ) : (
                                        <div className="text-muted small mt-1">{awbList.length} AWB(s)</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label className="fw-bold form-label">Remark</label>
                                    <textarea
                                        className={`form-control ${touched.remark && remarkError ? "is-invalid" : ""}`}
                                        rows={2}
                                        placeholder={`Reason for removing the ${statusLabel} status`}
                                        value={remark}
                                        onBlur={() => setTouched((t) => ({ ...t, remark: true }))}
                                        onChange={(e) => setRemark(e.target.value)}
                                    />
                                    {touched.remark && remarkError && (
                                        <FormFeedback className="d-block">{remarkError}</FormFeedback>
                                    )}
                                </div>

                                {employeeId && (
                                    <div className="text-muted small mb-3">
                                        This action will be recorded under employee ID <span className="fw-semibold">{employeeId}</span>.
                                    </div>
                                )}

                                <div className="d-flex gap-2">
                                    <Button color="danger" onClick={handleOpenConfirm} disabled={loading || !isValid}>
                                        <i className="bx bx-trash me-1"></i>
                                        Remove {statusLabel} Status
                                    </Button>
                                    <Button color="secondary" outline onClick={resetForm} disabled={loading}>
                                        Clear
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        {result && (
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="bx bx-check-circle text-success fs-4"></i>
                                        <h5 className="m-0">Last Removal</h5>
                                    </div>
                                    <p className="mb-2">{result.message}</p>
                                    <div className="small text-muted mb-3">Completed at {result.time}</div>

                                    {buckets.some((b) => b.count > 0) && (
                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                            {buckets.map((b) => (
                                                <div key={b.id} className="px-3 py-2 rounded d-flex align-items-center gap-2" style={{ background: tint(b.color), color: b.color, minWidth: 100 }}>
                                                    <b.Icon size={18} />
                                                    <div>
                                                        <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1 }}>{b.count}</div>
                                                        <div style={{ fontSize: 11 }}>{b.label}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

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
                                </CardBody>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={confirmOpen} toggle={() => !loading && setConfirmOpen(false)} centered size="md">
                <ModalHeader toggle={() => !loading && setConfirmOpen(false)} className="text-danger border-bottom">
                    Confirm {statusLabel} Removal
                </ModalHeader>
                <ModalBody>
                    <p className="mb-2">
                        This will permanently hard-delete the <span className="fw-semibold">{statusLabel}</span> status for{" "}
                        <span className="fw-semibold">{awbList.length} AWB(s)</span>. This action cannot be undone.
                    </p>
                    <div className="border rounded p-2 mb-2" style={{ maxHeight: 160, overflowY: "auto", fontSize: 13 }}>
                        {awbList.map((awb) => (
                            <div key={awb} className="border-bottom py-1">{awb}</div>
                        ))}
                    </div>
                    <p className="text-muted small mb-0">
                        Remark: <span className="fw-normal">{remark}</span>
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setConfirmOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleSubmit} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : `Yes, Remove ${statusLabel} Status`}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default AwbHardDeleteScreen
