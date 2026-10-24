// Admin tool: fix a mistake in an AWB's tracking history (status / date-time / service
// center) without generating a new tracking event — no customer SMS/Vecom push fires.
// Backed by TRACKING_CORRECTION_INFO (lookup) / TRACKING_CORRECTION (submit, via the shared
// TrackingRowCorrectionModal).
import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import { Alert, Badge, Button, Card, CardBody, Input, Spinner, Table } from "@/components/ui"
import { Pencil, Search } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
import TrackingRowCorrectionModal from "../../components/Common/TrackingRowCorrectionModal"
import ToasterProvider from "../../helpers/ToasterProvider"
import { TRACKING_CORRECTION_INFO } from "../../api"

const fmtDate = (val) => {
    if (!val) return "—"
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
}

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
    <div className="flex flex-col gap-1">
        {FIELDS.filter((f) => corrected?.[f.key] !== undefined).map((f) => {
            const before = original?.[f.key]
            const after = corrected?.[f.key]
            const fmt = f.format || ((v) => v ?? "—")
            return (
                <div key={f.key} style={{ fontSize: 12 }}>
                    <span className="text-ink-muted">{f.label}: </span>
                    <span className="text-ink-muted line-through">{fmt(before)}</span>
                    {" → "}
                    <span className="font-semibold text-ink">{fmt(after)}</span>
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
    const { ErrorToaster } = ToasterProvider()
    const authUser = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}"), [])

    const [awbno, setAwbno] = useState("")
    const [searching, setSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [loadedAwb, setLoadedAwb] = useState("")
    const [rows, setRows] = useState([])
    const [corrections, setCorrections] = useState([])
    const [modalRow, setModalRow] = useState(null)

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

    const handleRowCorrected = (data, payload, row) => {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data.corrected } : r)))
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
    }

    return (
        <div className="page-content relative min-h-full overflow-x-clip py-0 antialiased">
            <MainHeaderComp title="Tracking Correction" subTitle="Fix a mistake in an AWB's tracking history — status, date/time, or service center" />

            <div className="container-fluid relative z-10 px-4 pb-4">
                <div className="sticky top-0 z-20 -mx-4 mb-4 bg-canvas px-4 py-2">
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
                </div>

                <Card>
                    <CardBody>
                        <Alert color="info" className="mb-4 flex items-start gap-2">
                            <div className="text-xs">
                                This corrects a past tracking entry — it doesn&apos;t create a new one, and no customer
                                SMS or Vecom notification is sent. A status like OFD can appear more than once for
                                the same AWB, so look up the rows below and pick the exact one to fix.
                            </div>
                        </Alert>

                        {searched && (
                            <>
                                <h6 className="mb-2 text-ink">
                                    Tracking rows for <span className="font-bold">{loadedAwb}</span>
                                    {rows.length === 0 && <span className="text-ink-muted"> — none found</span>}
                                </h6>
                                {rows.length > 0 && (
                                    <div className="scroll-slim mb-6 overflow-x-auto">
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

                                <h6 className="mb-2 text-ink">Correction history{corrections.length > 0 && ` (${corrections.length})`}</h6>
                                {corrections.length === 0 ? (
                                    <div className="text-xs text-ink-muted">No corrections have been made on this AWB yet.</div>
                                ) : (
                                    <div className="scroll-slim overflow-x-auto">
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
                                                            <td className="whitespace-nowrap">{fmtDate(c.time)}</td>
                                                            <td>{c.by || "—"}</td>
                                                            <td><FieldDiff original={c.original} corrected={c.corrected} /></td>
                                                            <td className="text-ink-muted">{c.remark || "—"}</td>
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

            <TrackingRowCorrectionModal row={modalRow} onClose={() => setModalRow(null)} onCorrected={handleRowCorrected} />
        </div>
    )
}

export default TrackingCorrection
