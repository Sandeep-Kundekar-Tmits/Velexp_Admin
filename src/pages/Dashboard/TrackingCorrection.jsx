// Admin tool: fix a mistake in an AWB's tracking history (status / date-time / service
// center) without generating a new tracking event — no customer SMS/Vecom push fires.
// Backed by TRACKING_CORRECTION_INFO (lookup) / TRACKING_CORRECTION (submit).
import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import {
    Alert, Badge, Button, Card, CardBody, Col, FormFeedback, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner, Table,
} from "reactstrap"
import { Pencil, Search } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { TRACKING_CORRECTION_INFO, TRACKING_CORRECTION } from "../../api"

const fmtDate = (val) => {
    if (!val) return "—"
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
}

// datetime-local gives "YYYY-MM-DDTHH:MM" — the API also accepts "YYYY-MM-DD HH:MM:SS".
const toApiDate = (localValue) => `${localValue.replace("T", " ")}:00`

// Response shapes for error bodies and correction-history entries aren't nailed down by
// the API doc beyond a couple of examples, so extract fields defensively (same approach
// as AwbHardDeleteScreen's result parsing) instead of assuming one exact shape.
const extractErrorMessage = (data) => {
    if (!data) return null
    if (typeof data === "string") return data
    return data.message || data.detail || data.error || data.msg || null
}

const readCorrection = (c) => ({
    time: c.corrected_at || c.created_at || c.timestamp || c.time || c.date,
    by: c.corrected_by || c.employee || c.user || c.admin || c.by || c.updated_by,
    remark: c.remark || c.reason || "",
    original: c.original || c.before || c.old || {},
    corrected: c.corrected || c.after || c.new || {},
})

const FIELDS = [
    { key: "status", label: "Status" },
    { key: "status_date", label: "Date/Time", format: fmtDate },
    { key: "service_center", label: "Service Center" },
]

const FieldDiff = ({ original, corrected }) => (
    <div className="d-flex flex-column gap-1">
        {FIELDS.filter((f) => corrected?.[f.key] !== undefined).map((f) => {
            const before = original?.[f.key]
            const after = corrected?.[f.key]
            const fmt = f.format || ((v) => v ?? "—")
            return (
                <div key={f.key} style={{ fontSize: 12 }}>
                    <span className="text-muted">{f.label}: </span>
                    <span className="text-decoration-line-through text-muted">{fmt(before)}</span>
                    {" → "}
                    <span className="fw-semibold">{fmt(after)}</span>
                </div>
            )
        })}
    </div>
)

FieldDiff.propTypes = {
    original: PropTypes.object,
    corrected: PropTypes.object,
}

const TrackingCorrection = () => {
    useEffect(() => { document.title = "Tracking Correction" }, [])
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const authUser = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}"), [])

    const [awbno, setAwbno] = useState("")
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [loadedAwb, setLoadedAwb] = useState("")
    const [rows, setRows] = useState([])
    const [corrections, setCorrections] = useState([])

    const [modalRow, setModalRow] = useState(null)
    const [status, setStatus] = useState("")
    const [statusDate, setStatusDate] = useState("")
    const [serviceCenter, setServiceCenter] = useState("")
    const [remark, setRemark] = useState("")
    const [touched, setTouched] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [knownStatuses, setKnownStatuses] = useState(null)

    const resetModal = () => {
        setModalRow(null)
        setStatus("")
        setStatusDate("")
        setServiceCenter("")
        setRemark("")
        setTouched(false)
        setKnownStatuses(null)
    }

    const handleSearch = async () => {
        const awb = awbno.trim()
        if (!awb) { ErrorToaster("Enter an AWB number"); return }
        setSearching(true)
        try {
            const res = await axios.get(TRACKING_CORRECTION_INFO, { params: { awbno: awb }, withCredentials: true })
            const data = res.data?.data || {}
            setRows(data.tracking_rows || [])
            setCorrections(data.corrections || [])
            setLoadedAwb(data.awbno || awb)
            setSearched(true)
        } catch (err) {
            ErrorToaster(extractErrorMessage(err.response?.data) || "Failed to look up tracking rows for this AWB")
            setRows([])
            setCorrections([])
            setSearched(false)
        } finally {
            setSearching(false)
        }
    }

    const openCorrect = (row) => {
        resetModal()
        setModalRow(row)
    }

    const remarkError = touched && !remark.trim() ? "Remark is required" : ""
    const noFieldChosen = !status.trim() && !statusDate && !serviceCenter.trim()
    const fieldError = touched && noFieldChosen ? "Change at least one of status, date/time, or service center" : ""

    const handleSubmit = async () => {
        setTouched(true)
        if (!remark.trim()) { ErrorToaster("Remark is required"); return }
        if (noFieldChosen) { ErrorToaster("Change at least one of status, date/time, or service center"); return }

        setSubmitting(true)
        setKnownStatuses(null)
        try {
            const payload = { shipment_tracking_id: modalRow.id, remark: remark.trim() }
            if (status.trim()) payload.status = status.trim().toUpperCase()
            if (statusDate) payload.status_date = toApiDate(statusDate)
            if (serviceCenter.trim()) payload.service_center = serviceCenter.trim().toUpperCase()

            const res = await axios.post(TRACKING_CORRECTION, payload, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            })
            const data = res.data || {}

            SucceesToaster(
                data.message ||
                `Tracking record corrected${data.webhook_rows_updated ? ` (${data.webhook_rows_updated} mirrored row(s) updated)` : ""}`
            )

            setRows((prev) => prev.map((r) => (r.id === modalRow.id ? { ...r, ...data.corrected } : r)))
            setCorrections((prev) => [
                {
                    original: data.original,
                    corrected: data.corrected,
                    remark: payload.remark,
                    corrected_by: authUser?.user?.username || authUser?.user?.name || authUser?.user?.id,
                    corrected_at: new Date().toISOString(),
                },
                ...prev,
            ])
            resetModal()
        } catch (err) {
            const data = err.response?.data
            ErrorToaster(extractErrorMessage(data) || "Failed to submit correction")
            if (data && typeof data === "object" && Array.isArray(data.known_statuses)) {
                setKnownStatuses(data.known_statuses)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="page-content">
            <MainHeaderComp title="Tracking Correction" subTitle="Fix a mistake in an AWB's tracking history — status, date/time, or service center" />

            <div className="container-fluid px-3 py-3">
                <Card>
                    <CardBody>
                        <Alert color="info" className="d-flex align-items-start gap-2">
                            <i className="bx bx-info-circle fs-4"></i>
                            <div className="small">
                                This corrects a past tracking entry — it doesn&apos;t create a new one, and no customer
                                SMS or Vecom notification is sent. A status like OFD can appear more than once for
                                the same AWB, so look up the rows below and pick the exact one to fix.
                            </div>
                        </Alert>

                        <div className="d-flex gap-2 mb-3" style={{ maxWidth: 420 }}>
                            <Input
                                placeholder="AWB number"
                                value={awbno}
                                onChange={(e) => setAwbno(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button color="primary" onClick={handleSearch} disabled={searching}>
                                {searching ? <Spinner size="sm" /> : <><Search size={16} className="me-1" />Search</>}
                            </Button>
                        </div>

                        {searched && (
                            <>
                                <h6 className="mb-2">
                                    Tracking rows for <span className="fw-bold">{loadedAwb}</span>
                                    {rows.length === 0 && <span className="text-muted"> — none found</span>}
                                </h6>
                                {rows.length > 0 && (
                                    <div className="table-responsive mb-4">
                                        <Table bordered hover size="sm" className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Status</th>
                                                    <th>Date/Time</th>
                                                    <th>Service Center</th>
                                                    <th>Remarks</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>{row.id}</td>
                                                        <td>
                                                            {row.status}{" "}
                                                            {row.is_deleted && <Badge color="secondary" pill>deleted</Badge>}
                                                        </td>
                                                        <td>{fmtDate(row.status_date)}</td>
                                                        <td>{row.service_center || "—"}</td>
                                                        <td className="text-muted">{row.remarks || "—"}</td>
                                                        <td>
                                                            <Button size="sm" color="light" onClick={() => openCorrect(row)}>
                                                                <Pencil size={14} className="me-1" />Correct
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                <h6 className="mb-2">Correction history{corrections.length > 0 && ` (${corrections.length})`}</h6>
                                {corrections.length === 0 ? (
                                    <div className="text-muted small">No corrections have been made on this AWB yet.</div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table bordered size="sm" className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>When</th>
                                                    <th>By</th>
                                                    <th>Change</th>
                                                    <th>Remark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {corrections.map((raw, i) => {
                                                    const c = readCorrection(raw)
                                                    return (
                                                        <tr key={i}>
                                                            <td className="text-nowrap">{fmtDate(c.time)}</td>
                                                            <td>{c.by || "—"}</td>
                                                            <td><FieldDiff original={c.original} corrected={c.corrected} /></td>
                                                            <td className="text-muted">{c.remark || "—"}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Modal isOpen={!!modalRow} toggle={() => !submitting && resetModal()} centered size="md">
                <ModalHeader toggle={() => !submitting && resetModal()}>
                    Correct Tracking Row {modalRow?.id}
                </ModalHeader>
                <ModalBody>
                    {modalRow && (
                        <>
                            <div className="small text-muted mb-3">
                                Current: <span className="fw-semibold">{modalRow.status}</span> at{" "}
                                <span className="fw-semibold">{fmtDate(modalRow.status_date)}</span>, service center{" "}
                                <span className="fw-semibold">{modalRow.service_center || "—"}</span>.
                                Leave a field blank to keep its current value.
                            </div>

                            <Row>
                                <Col sm={6} className="mb-3">
                                    <Label className="fw-bold">Status</Label>
                                    <Input
                                        placeholder={modalRow.status}
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    />
                                    {knownStatuses && (
                                        <div className="small text-muted mt-1">
                                            Known statuses: {knownStatuses.join(", ")}
                                        </div>
                                    )}
                                </Col>
                                <Col sm={6} className="mb-3">
                                    <Label className="fw-bold">Service Center</Label>
                                    <Input
                                        placeholder={modalRow.service_center || "—"}
                                        value={serviceCenter}
                                        onChange={(e) => setServiceCenter(e.target.value)}
                                    />
                                </Col>
                            </Row>

                            <div className="mb-3">
                                <Label className="fw-bold">Date/Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={statusDate}
                                    onChange={(e) => setStatusDate(e.target.value)}
                                />
                            </div>

                            {fieldError && <Alert color="warning" className="py-2 small">{fieldError}</Alert>}

                            <div className="mb-2">
                                <Label className="fw-bold">Remark (required)</Label>
                                <textarea
                                    className={`form-control ${remarkError ? "is-invalid" : ""}`}
                                    rows={2}
                                    placeholder="Why is this being corrected?"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                                {remarkError && <FormFeedback className="d-block">{remarkError}</FormFeedback>}
                            </div>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={resetModal} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : "Submit Correction"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default TrackingCorrection
