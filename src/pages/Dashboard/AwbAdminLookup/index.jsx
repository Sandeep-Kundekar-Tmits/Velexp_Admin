// Admin tool: one AWB search returns the full Booking record plus its entire tracking
// history in a single call, and lets an admin correct either from here.
// Backed by AWB_ADMIN_LOOKUP (combined lookup) + AWB_ADMIN_BOOKING_CORRECTION (booking edit)
// -- both new -- and the existing TRACKING_CORRECTION_INFO/TRACKING_CORRECTION pair that
// already power the standalone Tracking Correction screen, reused here as-is.
import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import {
    Alert, Badge, Button, Card, CardBody, CardHeader, Col, Collapse, Input, Row, Spinner, Table,
} from "@/components/ui"
import { MdKeyboardArrowDown } from "react-icons/md"
import { Pencil, Search } from "lucide-react"
import MainHeaderComp from "../../../components/MainHeaderCom"
import ToasterProvider from "../../../helpers/ToasterProvider"
import TrackingRowCorrectionModal from "../../../components/Common/TrackingRowCorrectionModal"
import { AWB_ADMIN_LOOKUP } from "../../../api"
import { EDITABLE_GROUPS, EDITABLE_FIELD_KEYS, humanizeKey } from "./fieldGroups"
import BookingEditModal from "./BookingEditModal"

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/

const fmtDate = (val) => {
    if (!val) return "—"
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
}

const fmtValue = (val) => {
    if (val === null || val === undefined || val === "") return "—"
    if (typeof val === "boolean") return val ? "Yes" : "No"
    if (typeof val === "string" && ISO_DATE_RE.test(val)) return fmtDate(val)
    return String(val)
}

const extractErrorMessage = (data) => {
    if (!data) return null
    if (typeof data === "string") return data
    return data.message || data.detail || data.error || data.msg || null
}

// Both correction-history arrays are audit-logged server-side but their exact per-entry
// shape isn't pinned down by the API doc beyond the booking-correction POST response's own
// `changes: {field: {before, after}}` map -- so accept that shape directly, or fall back to
// full before/after objects (the shape tracking-correction's response uses) and diff those.
const readAudit = (c) => {
    const changes = c.changes && typeof c.changes === "object"
        ? c.changes
        : (() => {
            const corrected = c.corrected || c.after || c.new || {}
            const original = c.original || c.before || c.old || {}
            const out = {}
            Object.keys(corrected).forEach((k) => { out[k] = { before: original[k], after: corrected[k] } })
            return out
        })()
    return {
        time: c.corrected_at || c.created_at || c.timestamp || c.time || c.date,
        by: c.corrected_by || c.employee || c.user || c.admin || c.by || c.updated_by,
        remark: c.remark || c.reason || "",
        changes,
    }
}

const ChangesList = ({ changes }) => {
    const keys = Object.keys(changes || {})
    if (keys.length === 0) return <span className="text-ink-muted">—</span>
    return (
        <div className="flex flex-col gap-1">
            {keys.map((k) => {
                const { before, after } = changes[k] || {}
                return (
                    <div key={k} style={{ fontSize: 12 }}>
                        <span className="text-ink-muted">{humanizeKey(k)}: </span>
                        <span className="text-ink-muted line-through">{fmtValue(before)}</span>
                        {" → "}
                        <span className="font-semibold text-ink">{fmtValue(after)}</span>
                    </div>
                )
            })}
        </div>
    )
}

ChangesList.propTypes = { changes: PropTypes.object }

const AwbAdminLookup = () => {
    useEffect(() => { document.title = "AWB Admin Lookup" }, [])
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const authUser = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}"), [])

    const [awbno, setAwbno] = useState("")
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [loadedAwb, setLoadedAwb] = useState("")

    const [booking, setBooking] = useState(null)
    const [editableFields, setEditableFields] = useState([])
    const [trackingRows, setTrackingRows] = useState([])
    const [bookingCorrections, setBookingCorrections] = useState([])
    const [trackingCorrections, setTrackingCorrections] = useState([])
    const [showDeleted, setShowDeleted] = useState(false)
    const [showOther, setShowOther] = useState(false)

    const [editingBooking, setEditingBooking] = useState(false)

    // Tracking-row correction modal -- shared with the standalone Tracking Correction
    // screen, since both edit one ShipmentTracking row via the same existing endpoint.
    const [modalRow, setModalRow] = useState(null)

    const handleSearch = async () => {
        const awb = awbno.trim()
        if (!awb) { ErrorToaster("Enter an AWB number"); return }
        setSearching(true)
        try {
            const res = await axios.get(AWB_ADMIN_LOOKUP, { params: { awbno: awb }, withCredentials: true })
            const data = res.data?.data || {}
            setBooking(data.booking || null)
            setEditableFields(data.editable_booking_fields || [])
            setTrackingRows(data.tracking_rows || [])
            setBookingCorrections(data.booking_corrections || [])
            setTrackingCorrections(data.tracking_corrections || [])
            setLoadedAwb(data.awbno || awb)
            setSearched(true)
        } catch (err) {
            ErrorToaster(extractErrorMessage(err.response?.data) || "Failed to look up this AWB")
            setBooking(null)
            setTrackingRows([])
            setBookingCorrections([])
            setTrackingCorrections([])
            setSearched(false)
        } finally {
            setSearching(false)
        }
    }

    const handleBookingSaved = (data) => {
        const changes = data.changes || {}
        if (Object.keys(changes).length === 0) {
            SucceesToaster(data.message || "No changes detected — nothing to save")
        } else {
            SucceesToaster(data.message || "Booking corrected")
            setBooking((prev) => {
                const next = { ...prev }
                Object.keys(changes).forEach((k) => { next[k] = changes[k].after })
                return next
            })
            setBookingCorrections((prev) => [
                { changes, remark: data.remark, corrected_by: authUser?.user?.username || authUser?.user?.name, corrected_at: new Date().toISOString() },
                ...prev,
            ])
        }
        setEditingBooking(false)
    }

    const handleRowCorrected = (data, payload, row) => {
        setTrackingRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data.corrected } : r)))
        setTrackingCorrections((prev) => [
            {
                original: data.original,
                corrected: data.corrected,
                remark: payload.remark,
                corrected_by: authUser?.user?.username || authUser?.user?.name || authUser?.user?.id,
                corrected_at: new Date().toISOString(),
            },
            ...prev,
        ])
    }

    const otherFields = useMemo(() => {
        if (!booking) return []
        const skip = new Set(["id", "awbno", ...EDITABLE_FIELD_KEYS])
        return Object.keys(booking).filter((k) => !skip.has(k))
    }, [booking])

    const visibleTrackingRows = showDeleted ? trackingRows : trackingRows.filter((r) => !r.is_deleted)

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="AWB Admin Lookup" subTitle="Look up one AWB's full booking record and tracking history, and correct either." />

            <div className="container-fluid relative z-10 px-4 pb-4">
                <Card className="mb-4">
                    <CardBody>
                        <Alert color="info" className="mb-4 flex items-start gap-2">
                            <div className="text-xs">
                                One search returns the whole Booking record and its entire tracking history,
                                including soft-deleted rows. Edits here are corrections, not new events — no
                                customer SMS or Vecom notification fires, and every change is audit-logged.
                            </div>
                        </Alert>

                        <div className="flex gap-2" style={{ maxWidth: 420 }}>
                            <Input
                                placeholder="AWB number"
                                value={awbno}
                                onChange={(e) => setAwbno(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            />
                            <Button color="primary" onClick={handleSearch} disabled={searching}>
                                {searching ? <Spinner size="sm" /> : <><Search size={16} className="mr-1" />Search</>}
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {searched && !booking && (
                    <Alert color="warning">No booking or tracking rows found for {loadedAwb}.</Alert>
                )}

                {searched && booking && (
                    <>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h5 className="mb-0 text-ink">
                                Booking <span className="font-bold">{booking.awbno}</span>
                                <span className="text-ink-muted font-normal ml-2" style={{ fontSize: 13 }}>#{booking.id}</span>
                            </h5>
                            <Button color="primary" size="sm" onClick={() => setEditingBooking(true)}>
                                <Pencil size={14} className="mr-1" />Edit Booking
                            </Button>
                        </div>

                        <div className="flex flex-col gap-4 mb-6">
                            {EDITABLE_GROUPS.map((g) => (
                                <Card key={g.title}>
                                    <CardHeader className="py-2">
                                        <h6 className="mb-0 font-semibold" style={{ fontSize: 13 }}>{g.title}</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <Row className="gap-y-2">
                                            {g.fields.map((f) => (
                                                <Col sm={6} md={4} lg={3} key={f.key}>
                                                    <div className="text-ink-muted" style={{ fontSize: 11 }}>{f.label}</div>
                                                    <div className="text-ink" style={{ fontSize: 13 }}>{fmtValue(booking[f.key])}</div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </CardBody>
                                </Card>
                            ))}

                            <Card>
                                <CardBody
                                    className="p-3"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setShowOther((v) => !v)}
                                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowOther((v) => !v)}
                                    style={{ cursor: "pointer", userSelect: "none" }}
                                >
                                    <div className="flex items-center justify-between">
                                        <h6 className="mb-0 font-semibold" style={{ fontSize: 13 }}>
                                            Other / System Fields
                                            <span className="text-ink-muted font-normal ml-2" style={{ fontSize: 11 }}>({otherFields.length})</span>
                                        </h6>
                                        <MdKeyboardArrowDown size={20} className="text-ink-muted" style={{ transition: "transform 0.2s", transform: showOther ? "rotate(180deg)" : "rotate(0deg)" }} />
                                    </div>
                                </CardBody>
                                <Collapse isOpen={showOther}>
                                    <CardBody className="pt-0">
                                        <Row className="gap-y-2">
                                            {otherFields.map((k) => (
                                                <Col sm={6} md={4} lg={3} key={k}>
                                                    <div className="text-ink-muted" style={{ fontSize: 11 }}>{humanizeKey(k)}</div>
                                                    <div className="text-ink" style={{ fontSize: 13 }}>{fmtValue(booking[k])}</div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </CardBody>
                                </Collapse>
                            </Card>
                        </div>

                        <Card className="mb-6">
                            <CardBody>
                                <h6 className="mb-2 text-ink">
                                    Booking correction history{bookingCorrections.length > 0 && ` (${bookingCorrections.length})`}
                                </h6>
                                {bookingCorrections.length === 0 ? (
                                    <div className="text-xs text-ink-muted">No corrections have been made on this booking yet.</div>
                                ) : (
                                    <div className="scroll-slim overflow-x-auto">
                                        <Table bordered size="sm" className="align-middle">
                                            <thead>
                                                <tr><th>When</th><th>By</th><th>Change</th><th>Remark</th></tr>
                                            </thead>
                                            <tbody>
                                                {bookingCorrections.map((raw, i) => {
                                                    const c = readAudit(raw)
                                                    return (
                                                        <tr key={i}>
                                                            <td className="whitespace-nowrap">{fmtDate(c.time)}</td>
                                                            <td>{c.by || "—"}</td>
                                                            <td><ChangesList changes={c.changes} /></td>
                                                            <td className="text-ink-muted">{c.remark || "—"}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody>
                                <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
                                    <h6 className="mb-0 text-ink">
                                        Tracking rows
                                        {visibleTrackingRows.length !== trackingRows.length && (
                                            <span className="text-ink-muted font-normal ml-2" style={{ fontSize: 12 }}>
                                                ({visibleTrackingRows.length} of {trackingRows.length})
                                            </span>
                                        )}
                                    </h6>
                                    <label className="flex items-center gap-1 text-xs text-ink-muted" style={{ cursor: "pointer" }}>
                                        <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                                        Show deleted rows
                                    </label>
                                </div>
                                {visibleTrackingRows.length === 0 ? (
                                    <div className="text-xs text-ink-muted">No tracking rows.</div>
                                ) : (
                                    <div className="scroll-slim mb-6 overflow-x-auto">
                                        <Table bordered hover size="sm" className="align-middle">
                                            <thead>
                                                <tr>
                                                    <th>ID</th><th>Status</th><th>Date/Time</th><th>Service Center</th><th>Remarks</th><th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visibleTrackingRows.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>{row.id}</td>
                                                        <td>
                                                            {row.status}{" "}
                                                            {row.is_deleted && <Badge color="secondary" pill>deleted</Badge>}
                                                        </td>
                                                        <td>{fmtDate(row.status_date)}</td>
                                                        <td>{row.service_center || "—"}</td>
                                                        <td className="text-ink-muted">{row.remarks || "—"}</td>
                                                        <td>
                                                            <Button size="sm" color="light" onClick={() => setModalRow(row)}>
                                                                <Pencil size={14} className="mr-1" />Correct
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                <h6 className="mb-2 text-ink">
                                    Tracking correction history{trackingCorrections.length > 0 && ` (${trackingCorrections.length})`}
                                </h6>
                                {trackingCorrections.length === 0 ? (
                                    <div className="text-xs text-ink-muted">No tracking corrections have been made on this AWB yet.</div>
                                ) : (
                                    <div className="scroll-slim overflow-x-auto">
                                        <Table bordered size="sm" className="align-middle">
                                            <thead>
                                                <tr><th>When</th><th>By</th><th>Change</th><th>Remark</th></tr>
                                            </thead>
                                            <tbody>
                                                {trackingCorrections.map((raw, i) => {
                                                    const c = readAudit(raw)
                                                    return (
                                                        <tr key={i}>
                                                            <td className="whitespace-nowrap">{fmtDate(c.time)}</td>
                                                            <td>{c.by || "—"}</td>
                                                            <td><ChangesList changes={c.changes} /></td>
                                                            <td className="text-ink-muted">{c.remark || "—"}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </>
                )}
            </div>

            <BookingEditModal
                isOpen={editingBooking}
                booking={booking}
                editableFields={editableFields}
                onClose={() => setEditingBooking(false)}
                onSaved={handleBookingSaved}
            />

            <TrackingRowCorrectionModal row={modalRow} onClose={() => setModalRow(null)} onCorrected={handleRowCorrected} />
        </div>
    )
}

export default AwbAdminLookup
