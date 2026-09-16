// "Correct Tracking Row" -- shared by TrackingCorrection.jsx and AwbAdminLookup, both of
// which edit one ShipmentTracking row via the same existing endpoint. Status and Service
// Center render as dropdowns when their reference lists load; if a list is empty (e.g.
// GET_ALL_STATUSES's shape turns out not to match any of the parsed forms), the field falls
// back to the original free-text input rather than presenting an empty, unusable <select>.
import { useEffect, useState } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import {
    Alert, Button, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter,
    ModalHeader, Row, Spinner,
} from "@/components/ui"
import { TRACKING_CORRECTION } from "@/api"
import { useServiceCenters, useTrackingStatuses } from "@/hooks/queries/useReferenceData"
import ToasterProvider from "@/helpers/ToasterProvider"

const fmtDate = (val) => {
    if (!val) return "—"
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
}

// datetime-local gives "YYYY-MM-DDTHH:MM" -- the API also accepts "YYYY-MM-DD HH:MM:SS".
const toApiDate = (localValue) => `${localValue.replace("T", " ")}:00`

const extractErrorMessage = (data) => {
    if (!data) return null
    if (typeof data === "string") return data
    return data.message || data.detail || data.error || data.msg || null
}

const TrackingRowCorrectionModal = ({ row, onClose, onCorrected }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const { data: statusOptions = [] } = useTrackingStatuses()
    const { data: serviceCenterOptions = [] } = useServiceCenters()

    const [status, setStatus] = useState("")
    const [statusDate, setStatusDate] = useState("")
    const [serviceCenter, setServiceCenter] = useState("")
    const [remark, setRemark] = useState("")
    const [touched, setTouched] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [knownStatuses, setKnownStatuses] = useState(null)

    useEffect(() => {
        setStatus("")
        setStatusDate("")
        setServiceCenter("")
        setRemark("")
        setTouched(false)
        setKnownStatuses(null)
    }, [row])

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
            const payload = { shipment_tracking_id: row.id, remark: remark.trim() }
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
            onCorrected(data, payload, row)
            onClose()
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
        <Modal isOpen={!!row} toggle={() => !submitting && onClose()} centered size="md">
            <ModalHeader toggle={() => !submitting && onClose()}>
                Correct Tracking Row {row?.id}
            </ModalHeader>
            <ModalBody>
                {row && (
                    <>
                        <div className="mb-4 text-xs text-ink-muted">
                            Current: <span className="font-semibold text-ink">{row.status}</span> at{" "}
                            <span className="font-semibold text-ink">{fmtDate(row.status_date)}</span>, service center{" "}
                            <span className="font-semibold text-ink">{row.service_center || "—"}</span>.
                            Leave a field blank to keep its current value.
                        </div>

                        <Row className="gap-4">
                            <Col sm={6}>
                                <Label className="font-bold">Status</Label>
                                {statusOptions.length > 0 ? (
                                    <Input type="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="">— keep current ({row.status}) —</option>
                                        {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Input>
                                ) : (
                                    <Input placeholder={row.status} value={status} onChange={(e) => setStatus(e.target.value)} />
                                )}
                                {knownStatuses && (
                                    <div className="mt-1 text-xs text-ink-muted">Known statuses: {knownStatuses.join(", ")}</div>
                                )}
                            </Col>
                            <Col sm={6}>
                                <Label className="font-bold">Service Center</Label>
                                {serviceCenterOptions.length > 0 ? (
                                    <Input type="select" value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)}>
                                        <option value="">— keep current ({row.service_center || "none"}) —</option>
                                        {serviceCenterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Input>
                                ) : (
                                    <Input placeholder={row.service_center || "—"} value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} />
                                )}
                            </Col>
                        </Row>

                        <div className="mb-4 mt-4">
                            <Label className="font-bold">Date/Time</Label>
                            <Input type="datetime-local" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
                        </div>

                        {fieldError && <Alert color="warning" className="mb-4 py-2 text-xs">{fieldError}</Alert>}

                        <div className="mb-2">
                            <Label className="font-bold">Remark (required)</Label>
                            <Input
                                type="textarea"
                                rows={2}
                                invalid={!!remarkError}
                                placeholder="Why is this being corrected?"
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                            />
                            {remarkError && <FormFeedback className="block">{remarkError}</FormFeedback>}
                        </div>
                    </>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button color="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : "Submit Correction"}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

TrackingRowCorrectionModal.propTypes = {
    row: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onCorrected: PropTypes.func.isRequired,
}

export default TrackingRowCorrectionModal
