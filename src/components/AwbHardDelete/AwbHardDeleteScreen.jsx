// Shared screen for SPD Remove / RTS Remove — hard-deletes the given status marking
// for a list of AWBs. Backed by BULK_HARD_DELETE_SPD_STATUS / BULK_HARD_DELETE_RTS_STATUS.
import { useMemo, useState } from "react"
import axios from "axios"
import {
    Alert, Button, Card, CardBody, Col, Collapse, FormFeedback, Modal,
    ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from "@/components/ui"
import { AlertCircle, CheckCircle, ChevronDown, SkipForward, Trash2, XCircle } from "lucide-react"
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
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title={pageTitle} subTitle={pageSubtitle} />

            <div className="container-fluid relative z-10 px-4 pb-4">
                <Alert color="warning" className="mb-4">
                    This permanently removes the <strong>{statusLabel}</strong> status marking for the AWBs listed
                    below. This cannot be undone.
                </Alert>

                <Row className="gap-4">
                    <Col lg={7}>
                        <Card>
                            <CardBody>
                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-bold text-ink-muted">AWB Numbers</label>
                                    <textarea
                                        className={`form-control ${touched.awbText && awbListError ? "is-invalid" : ""}`}
                                        rows={8}
                                        placeholder={"WEL400564\nWEL400549"}
                                        value={awbText}
                                        onBlur={() => setTouched((t) => ({ ...t, awbText: true }))}
                                        onChange={(e) => setAwbText(e.target.value)}
                                    />
                                    {touched.awbText && awbListError ? (
                                        <FormFeedback className="block">{awbListError}</FormFeedback>
                                    ) : (
                                        <div className="mt-1 text-xs text-ink-muted">{awbList.length} AWB(s)</div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="mb-1 block text-xs font-bold text-ink-muted">Remark</label>
                                    <textarea
                                        className={`form-control ${touched.remark && remarkError ? "is-invalid" : ""}`}
                                        rows={2}
                                        placeholder={`Reason for removing the ${statusLabel} status`}
                                        value={remark}
                                        onBlur={() => setTouched((t) => ({ ...t, remark: true }))}
                                        onChange={(e) => setRemark(e.target.value)}
                                    />
                                    {touched.remark && remarkError && (
                                        <FormFeedback className="block">{remarkError}</FormFeedback>
                                    )}
                                </div>

                                {employeeId && (
                                    <div className="mb-4 text-xs text-ink-muted">
                                        This action will be recorded under employee ID <span className="font-semibold text-ink">{employeeId}</span>.
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button color="danger" onClick={handleOpenConfirm} disabled={loading || !isValid}>
                                        <Trash2 size={15} className="mr-1" />
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
                                    <div className="mb-2 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-success-500" />
                                        <h5 className="m-0 text-ink">Last Removal</h5>
                                    </div>
                                    <p className="mb-2 text-ink">{result.message}</p>
                                    <div className="mb-3 text-xs text-ink-muted">Completed at {result.time}</div>

                                    {buckets.some((b) => b.count > 0) && (
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            {buckets.map((b) => (
                                                <div key={b.id} className="flex items-center gap-2 rounded px-3 py-2" style={{ background: tint(b.color), color: b.color, minWidth: 100 }}>
                                                    <b.Icon size={18} />
                                                    <div>
                                                        <div className="font-bold" style={{ fontSize: 18, lineHeight: 1 }}>{b.count}</div>
                                                        <div style={{ fontSize: 11 }}>{b.label}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {buckets.filter((b) => b.items.length > 0).map((b) => {
                                        const open = !!openBuckets[b.id]
                                        return (
                                            <div key={b.id} className="mb-2 rounded border border-white/8">
                                                <div
                                                    role="button"
                                                    onClick={() => setOpenBuckets((p) => ({ ...p, [b.id]: !p[b.id] }))}
                                                    className="flex items-center justify-between px-3 py-2"
                                                    style={{ cursor: "pointer", userSelect: "none" }}
                                                >
                                                    <span className="flex items-center gap-2 font-semibold" style={{ color: b.color }}>
                                                        <b.Icon size={16} /> {b.label} <span className="text-ink-muted">({b.items.length})</span>
                                                    </span>
                                                    <ChevronDown size={18} className="text-ink-muted" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
                                                </div>
                                                <Collapse isOpen={open}>
                                                    <div className="px-3 pb-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                                                        {b.items.map((it, i) => (
                                                            <div key={`${it.awbno}-${i}`} className="flex justify-between border-bottom py-1" style={{ fontSize: 13 }}>
                                                                <span className="font-semibold text-ink">{it.awbno}</span>
                                                                {it.reason && <span className="ml-2 text-right text-ink-muted">{it.reason}</span>}
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
                <ModalHeader toggle={() => !loading && setConfirmOpen(false)} className="text-danger-500 border-bottom">
                    Confirm {statusLabel} Removal
                </ModalHeader>
                <ModalBody>
                    <p className="mb-2 text-ink">
                        This will permanently hard-delete the <span className="font-semibold">{statusLabel}</span> status for{" "}
                        <span className="font-semibold">{awbList.length} AWB(s)</span>. This action cannot be undone.
                    </p>
                    <div className="mb-2 rounded border border-white/8 p-2" style={{ maxHeight: 160, overflowY: "auto", fontSize: 13 }}>
                        {awbList.map((awb) => (
                            <div key={awb} className="border-bottom py-1 text-ink">{awb}</div>
                        ))}
                    </div>
                    <p className="mb-0 text-xs text-ink-muted">
                        Remark: <span className="font-normal">{remark}</span>
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
