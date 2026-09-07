// Mark for RTO — CS flags shipment(s) RTO_APPROVAL so ops can book the return leg.
// AWBs are always the caller's selection (a single row's Approve, or the bulk
// "Approve Selected" action) — locked here, can't be added to.
import { useEffect, useMemo, useState } from "react"
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, FormGroup, Label, Input, FormFeedback, Collapse,
} from "reactstrap"
import { CheckCircle, XCircle, SkipForward, AlertCircle, ChevronDown, RotateCcw } from "lucide-react"
import { BULK_SET_SHIPMENT_FLAG } from "../../api"

const BUCKETS = [
    { id: "updated", label: "Flagged for RTO", color: "#34c38f", Icon: CheckCircle },
    { id: "skipped", label: "Skipped", color: "#f1b44c", Icon: SkipForward },
    { id: "not_found", label: "Not Found", color: "#74788d", Icon: XCircle },
]

const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

const MarkForRtoModal = ({ isOpen, toggle, onDone, initialAwbList = [] }) => {
    const [remark, setRemark] = useState("")
    const [remarkError, setRemarkError] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [openBuckets, setOpenBuckets] = useState({})

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id, [])

    useEffect(() => {
        if (isOpen) {
            setRemark("")
            setRemarkError(false)
            setResult(null)
            setErrorMsg("")
            setOpenBuckets({})
        }
    }, [isOpen])

    const handleClose = () => toggle()

    const submit = async () => {
        setErrorMsg("")
        if (initialAwbList.length === 0) {
            setErrorMsg("No AWBs selected")
            return
        }
        if (!remark.trim()) {
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
                    awbno_list: initialAwbList,
                    shipment_flag: "RTO_APPROVAL",
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
        return BUCKETS.map((b) => {
            const raw = result[b.id] || []
            const items = raw.map((it) =>
                typeof it === "string" ? { awbno: it, reason: "" } : { awbno: it?.awbno, reason: it?.reason || "" }
            )
            return { ...b, items, count: items.length }
        })
    }, [result])

    return (
        <Modal isOpen={isOpen} toggle={handleClose} size="lg" centered scrollable>
            <ModalHeader toggle={handleClose}>Mark for RTO</ModalHeader>
            <ModalBody>
                {!result ? (
                    <>
                        <FormGroup>
                            <Label className="fw-semibold">AWB(s) selected from the list</Label>
                            <div className="border rounded" style={{ maxHeight: 220, overflowY: "auto" }}>
                                {initialAwbList.length === 0 ? (
                                    <div className="text-muted text-center py-4">No AWBs selected</div>
                                ) : (
                                    initialAwbList.map((awb, i) => (
                                        <div key={`${awb}-${i}`} className="px-3 py-2 border-bottom fw-semibold" style={{ fontSize: 14 }}>
                                            {awb}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="text-muted small mt-1">
                                {initialAwbList.length} AWB(s) — from your selection, can't be edited here
                            </div>
                        </FormGroup>

                        <FormGroup className="mb-0">
                            <Label className="fw-semibold">Remark</Label>
                            <Input
                                type="textarea"
                                rows={3}
                                placeholder="Reason for RTO approval..."
                                value={remark}
                                invalid={remarkError}
                                onChange={(e) => {
                                    setRemark(e.target.value)
                                    if (e.target.value.trim()) setRemarkError(false)
                                }}
                            />
                            <FormFeedback>Remark is required to flag a shipment RTO_APPROVAL.</FormFeedback>
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
                        <Button color="primary" onClick={submit} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Mark for RTO"}
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

export default MarkForRtoModal
