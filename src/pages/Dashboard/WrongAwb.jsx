// Wrong AWB workflow: flag/clear the WRONG_AWB shipment flag (bulk-set-shipment-flag),
// check eligibility before flagging, list what's currently flagged, and record the real
// correction (manual-status-update, status "WAB") once ops has fixed the AWB. See api/index.js
// for the full endpoint notes, including the employee_id vs user_id table mismatch on the
// correction endpoint.
import { useEffect, useMemo, useState } from "react"
import {
    Alert, Badge, Button, Card, CardBody, Collapse, FormFeedback, FormGroup,
    Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Table,
} from "@/components/ui"
import Select from "react-select"
import {
    AlertCircle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, Flag, FlagOff, RefreshCw, SkipForward, XCircle,
} from "lucide-react"
import MainHeaderComp from "@/components/MainHeaderCom"
import ToasterProvider from "@/helpers/ToasterProvider"
import { customStyles } from "@/helpers/CustomStyle"
import { useServiceCenters } from "@/hooks/queries/useReferenceData"
import { useCurrentEmployeeId } from "@/hooks/useCurrentEmployeeId"
import { authFetch } from "@/lib/http"
import {
    BULK_SET_SHIPMENT_FLAG, CHECK_WRONG_AWB_ELIGIBILITY, MANUAL_STATUS_UPDATE, WRONG_AWB_FLAGGED_LIST,
} from "@/api"

const parseAwbList = (text) =>
    [...new Set(text.split(/[\n,]/).map((s) => s.trim().toUpperCase()).filter(Boolean))]

const extractErrorMessage = (data) => {
    if (!data) return null
    if (typeof data === "string") return data
    return data.message || data.detail || data.error || data.msg || null
}

const fmtDate = (val) => {
    if (!val) return "—"
    const d = new Date(val)
    return isNaN(d.getTime()) ? val : d.toLocaleString()
}

const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

// Response shape for the flag/clear result isn't nailed down by the API doc, so try a few
// likely keys per bucket -- same defensive approach as AwbHardDeleteScreen/MarkForRtoModal.
const FLAG_BUCKETS = [
    { id: "updated", label: "Updated", keys: ["updated", "flagged", "success", "flagged_awbs"], color: "#34c38f", Icon: CheckCircle },
    { id: "skipped", label: "Skipped", keys: ["skipped", "skip"], color: "#f1b44c", Icon: SkipForward },
    { id: "not_found", label: "Not Found", keys: ["not_found", "notfound", "missing"], color: "#74788d", Icon: XCircle },
    { id: "failed", label: "Failed", keys: ["failed", "errors", "failure"], color: "#f46a6a", Icon: AlertCircle },
]

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

const toEligibilityRows = (data, requested) => {
    if (!data) return requested.map((awbno) => ({ awbno, eligible: null, reason: "" }))
    if (Array.isArray(data.results)) {
        return data.results.map((r) => ({
            awbno: r.awbno || r.awb || "—",
            eligible: r.eligible ?? r.is_eligible ?? !r.reason,
            reason: r.reason || r.message || "",
        }))
    }
    const eligible = data.eligible || data.eligible_awbs || []
    const ineligible = data.ineligible || data.not_eligible || data.ineligible_awbs || []
    if (eligible.length || ineligible.length) {
        const rowOf = (it, isEligible) => ({
            awbno: typeof it === "string" ? it : (it.awbno || it.awb || "—"),
            eligible: isEligible,
            reason: typeof it === "string" ? "" : (it.reason || it.message || ""),
        })
        return [...eligible.map((it) => rowOf(it, true)), ...ineligible.map((it) => rowOf(it, false))]
    }
    return requested.map((awbno) => ({ awbno, eligible: null, reason: "" }))
}

const toFlaggedRows = (data) => {
    const list = Array.isArray(data) ? data : data?.results || data?.flagged || data?.data || []
    return list.map((r) => ({
        awbno: r.awbno || r.awb || "—",
        service_center: r.service_center || r.sc || r.ec_code || "—",
        remark: r.remark || r.reason || "",
        flaggedBy: r.flagged_by_name || r.flagged_by || r.user || r.updated_by || "—",
        flaggedAt: r.flagged_at || r.updated_at || r.created_at || null,
    }))
}

const WrongAwb = () => {
    useEffect(() => { document.title = "Wrong AWB" }, [])
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const { data: scOptions = [] } = useServiceCenters()
    const { data: currentEmployeeId, isLoading: employeeIdLoading } = useCurrentEmployeeId()

    const authUser = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}"), [])
    const userId = authUser?.user?.id

    // --- Flag / clear form ---
    const [awbText, setAwbText] = useState("")
    const [remark, setRemark] = useState("")
    const [touched, setTouched] = useState({ awbText: false, remark: false })
    const [checking, setChecking] = useState(false)
    const [eligibility, setEligibility] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [flagResult, setFlagResult] = useState(null)
    const [openBuckets, setOpenBuckets] = useState({})

    const awbList = useMemo(() => parseAwbList(awbText), [awbText])
    const awbListError = awbList.length === 0 ? "Enter at least one AWB number" : ""

    const handleCheckEligibility = async () => {
        setTouched((t) => ({ ...t, awbText: true }))
        if (awbListError) { ErrorToaster(awbListError); return }
        setChecking(true)
        setEligibility(null)
        try {
            const res = await authFetch(CHECK_WRONG_AWB_ELIGIBILITY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbno_list: awbList }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok) {
                ErrorToaster(extractErrorMessage(json) || "Failed to check eligibility")
                return
            }
            setEligibility(toEligibilityRows(json, awbList))
        } catch {
            ErrorToaster("Failed to check eligibility")
        } finally {
            setChecking(false)
        }
    }

    const loadFlaggedList = async (filterOptions = scFilter) => {
        if (!filterOptions.length) return
        setFlaggedLoading(true)
        try {
            const body = { service_center: filterOptions.map((o) => o.value) }
            const res = await authFetch(WRONG_AWB_FLAGGED_LIST, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok) {
                ErrorToaster(extractErrorMessage(json) || "Failed to load flagged AWB list")
                setFlaggedRows([])
                return
            }
            setFlaggedRows(toFlaggedRows(json))
        } catch {
            ErrorToaster("Failed to load flagged AWB list")
        } finally {
            setFlaggedLoading(false)
        }
    }

    const submitFlag = async (flagValue) => {
        setTouched({ awbText: true, remark: flagValue !== null })
        if (awbListError) { ErrorToaster(awbListError); return }
        if (flagValue !== null && !remark.trim()) { ErrorToaster("Remark is required to flag as Wrong AWB"); return }

        setSubmitting(true)
        try {
            const body = { awbno_list: awbList, shipment_flag: flagValue, user_id: userId }
            if (flagValue !== null) body.remark = remark.trim()
            const res = await authFetch(BULK_SET_SHIPMENT_FLAG, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || json?.status === "error") {
                ErrorToaster(extractErrorMessage(json) || `Failed to ${flagValue ? "flag" : "clear the flag for"} the AWB(s)`)
                return
            }
            setFlagResult({ ...json, requestedFlag: flagValue, count: awbList.length, time: new Date().toLocaleString() })
            setOpenBuckets({})
            SucceesToaster(
                json?.message || (flagValue ? `${awbList.length} AWB(s) flagged WRONG_AWB` : `Flag cleared for ${awbList.length} AWB(s)`)
            )
            setAwbText("")
            setRemark("")
            setTouched({ awbText: false, remark: false })
            setEligibility(null)
            loadFlaggedList()
        } catch {
            ErrorToaster("Network error")
        } finally {
            setSubmitting(false)
        }
    }

    const buckets = useMemo(() => {
        if (!flagResult) return []
        return FLAG_BUCKETS.map((b) => {
            const key = b.keys.find((k) => flagResult[k] !== undefined)
            const raw = key ? flagResult[key] : undefined
            const items = toItems(raw)
            return { ...b, items, count: toCount(raw, items) }
        })
    }, [flagResult])

    // --- Flagged list ---
    const [scFilter, setScFilter] = useState([])
    const [flaggedRows, setFlaggedRows] = useState([])
    const [flaggedLoading, setFlaggedLoading] = useState(false)
    const [clearingAwb, setClearingAwb] = useState("")
    const [hasSearchedFlagged, setHasSearchedFlagged] = useState(false)
    const FLAGGED_PAGE_SIZE = 500
    const [flaggedPage, setFlaggedPage] = useState(1)

    const handleSearchFlagged = () => {
        if (!scFilter.length) { ErrorToaster("Select a Service Centre first"); return }
        setHasSearchedFlagged(true)
        setFlaggedPage(1)
        loadFlaggedList(scFilter)
    }

    const flaggedPageCount = Math.max(1, Math.ceil(flaggedRows.length / FLAGGED_PAGE_SIZE))
    useEffect(() => {
        if (flaggedPage > flaggedPageCount) setFlaggedPage(flaggedPageCount)
    }, [flaggedPageCount, flaggedPage])
    const pagedFlaggedRows = useMemo(
        () => flaggedRows.slice((flaggedPage - 1) * FLAGGED_PAGE_SIZE, flaggedPage * FLAGGED_PAGE_SIZE),
        [flaggedRows, flaggedPage]
    )

    const clearSingleFlag = async (awbno) => {
        setClearingAwb(awbno)
        try {
            const res = await authFetch(BULK_SET_SHIPMENT_FLAG, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbno_list: [awbno], shipment_flag: null, user_id: userId }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || json?.status === "error") {
                ErrorToaster(extractErrorMessage(json) || `Failed to clear the flag for ${awbno}`)
                return
            }
            SucceesToaster(json?.message || `Flag cleared for ${awbno}`)
            loadFlaggedList()
        } catch {
            ErrorToaster("Network error")
        } finally {
            setClearingAwb("")
        }
    }

    // --- Mark Corrected (manual-status-update, status WAB) ---
    const [correctionAwb, setCorrectionAwb] = useState(null)
    const [correctionRemark, setCorrectionRemark] = useState("")
    const [correctionSubmitting, setCorrectionSubmitting] = useState(false)

    const openCorrectionModal = (awbno) => {
        setCorrectionAwb(awbno)
        setCorrectionRemark("")
    }

    const submitCorrection = async () => {
        if (!currentEmployeeId) {
            ErrorToaster("Couldn't find an Employee record linked to your username -- can't record a correction until that's resolved.")
            return
        }
        if (!correctionRemark.trim()) { ErrorToaster("Remark is required"); return }
        setCorrectionSubmitting(true)
        try {
            const res = await authFetch(MANUAL_STATUS_UPDATE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    awbno: correctionAwb,
                    status: "WAB",
                    remark: correctionRemark.trim(),
                    employee_id: currentEmployeeId,
                }),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok || json?.status === "error") {
                ErrorToaster(extractErrorMessage(json) || "Failed to record the correction")
                return
            }
            SucceesToaster(json?.message || `${correctionAwb} corrected to WAB`)
            setCorrectionAwb(null)
            loadFlaggedList()
        } catch {
            ErrorToaster("Network error")
        } finally {
            setCorrectionSubmitting(false)
        }
    }

    const employeeIdMissing = !employeeIdLoading && !currentEmployeeId

    // --- Flag / Clear WRONG_AWB now lives in a popup, opened from the button
    // below, instead of always being visible inline on the page.
    const [showFlagModal, setShowFlagModal] = useState(false)
    const closeFlagModal = () => {
        if (submitting || checking) return
        setShowFlagModal(false)
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Wrong AWB"
                subTitle="Flag mislabeled AWBs, then record the correction once they're fixed"
                extraFields={
                    <Button color="danger" onClick={() => setShowFlagModal(true)}>
                        <Flag size={15} className="mr-1" />
                        Mark as Wrong AWB
                    </Button>
                }
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                <Card>
                    <CardBody>
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                            <h6 className="m-0 text-ink">Currently Flagged (WRONG_AWB)</h6>
                            <div className="flex items-end gap-2">
                                <div style={{ minWidth: 260 }}>
                                    <label className="mb-1 block text-xs font-bold text-ink-muted">Service Centre(s)</label>
                                    <Select
                                        isMulti
                                        isSearchable
                                        options={scOptions}
                                        value={scFilter}
                                        onChange={(opts) => setScFilter(opts || [])}
                                        placeholder="All service centres"
                                        styles={customStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>
                                <Button color="primary" size="sm" onClick={handleSearchFlagged} disabled={flaggedLoading || scFilter.length === 0}>
                                    {flaggedLoading ? <Spinner size="sm" /> : <RefreshCw size={14} className="mr-1" />}
                                    Search
                                </Button>
                            </div>
                        </div>

                        {employeeIdMissing && (
                            <Alert color="warning" className="mb-3 py-2 text-xs">
                                Couldn&apos;t find an Employee record linked to your username -- &quot;Mark Corrected&quot; is
                                disabled until that&apos;s resolved.
                            </Alert>
                        )}

                        {flaggedLoading ? (
                            <div className="flex justify-center py-6"><Spinner /></div>
                        ) : !hasSearchedFlagged ? (
                            <div className="py-6 text-center text-ink-muted text-sm">
                                Select a Service Centre and click Search to load flagged AWBs.
                            </div>
                        ) : flaggedRows.length === 0 ? (
                            <div className="py-6 text-center text-ink-muted text-sm">No AWBs are currently flagged WRONG_AWB.</div>
                        ) : (
                            <>
                                <div className="scroll-slim" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", overflowX: "auto" }}>
                                    <Table bordered hover size="sm" className="align-middle mb-0">
                                        <thead className="sticky top-0 bg-canvas" style={{ zIndex: 1 }}>
                                            <tr>
                                                <th>AWB No</th>
                                                <th>Service Centre</th>
                                                <th>Remark</th>
                                                <th>Flagged By</th>
                                                <th>Flagged At</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedFlaggedRows.map((r, i) => (
                                                <tr key={`${r.awbno}-${i}`}>
                                                    <td className="font-semibold">{r.awbno}</td>
                                                    <td><Badge color="secondary">{r.service_center}</Badge></td>
                                                    <td className="text-ink-muted">{r.remark || "—"}</td>
                                                    <td>{r.flaggedBy}</td>
                                                    <td>{fmtDate(r.flaggedAt)}</td>
                                                    <td>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm" color="primary" outline
                                                                disabled={employeeIdMissing || employeeIdLoading}
                                                                onClick={() => openCorrectionModal(r.awbno)}
                                                            >
                                                                Mark Corrected
                                                            </Button>
                                                            <Button
                                                                size="sm" color="secondary" outline
                                                                disabled={clearingAwb === r.awbno}
                                                                onClick={() => clearSingleFlag(r.awbno)}
                                                            >
                                                                {clearingAwb === r.awbno ? <Spinner size="sm" /> : "Clear Flag"}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>

                                {flaggedPageCount > 1 && (
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs text-ink-muted">
                                            Showing {(flaggedPage - 1) * FLAGGED_PAGE_SIZE + 1}–
                                            {Math.min(flaggedPage * FLAGGED_PAGE_SIZE, flaggedRows.length)} of {flaggedRows.length}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm" color="light" outline
                                                disabled={flaggedPage <= 1}
                                                onClick={() => setFlaggedPage((p) => Math.max(1, p - 1))}
                                            >
                                                <ChevronLeft size={14} />
                                            </Button>
                                            <span className="text-xs text-ink-muted">
                                                Page {flaggedPage} of {flaggedPageCount}
                                            </span>
                                            <Button
                                                size="sm" color="light" outline
                                                disabled={flaggedPage >= flaggedPageCount}
                                                onClick={() => setFlaggedPage((p) => Math.min(flaggedPageCount, p + 1))}
                                            >
                                                <ChevronRight size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Modal isOpen={showFlagModal} toggle={closeFlagModal} centered size="lg" scrollable>
                <ModalHeader toggle={closeFlagModal}>
                    Flag / Clear WRONG_AWB
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4">
                        <label className="mb-1 block text-xs font-bold text-ink-muted">AWB Numbers</label>
                        <textarea
                            className={`form-control ${touched.awbText && awbListError ? "is-invalid" : ""}`}
                            rows={6}
                            placeholder={"VE1234567\nVE7654321"}
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

                    <div className="mb-4 flex gap-2">
                        <Button color="light" size="sm" onClick={handleCheckEligibility} disabled={checking || submitting}>
                            {checking ? <Spinner size="sm" /> : "Check Eligibility"}
                        </Button>
                    </div>

                    {eligibility && (
                        <div className="mb-4 rounded border border-white/8 p-2" style={{ maxHeight: 200, overflowY: "auto" }}>
                            {eligibility.map((r, i) => (
                                <div key={`${r.awbno}-${i}`} className="flex items-center justify-between border-bottom py-1" style={{ fontSize: 13 }}>
                                    <span className="flex items-center gap-2 font-semibold text-ink">
                                        {r.eligible === true && <CheckCircle size={14} className="text-success-500" />}
                                        {r.eligible === false && <XCircle size={14} className="text-danger-500" />}
                                        {r.awbno}
                                    </span>
                                    {r.reason && <span className="text-right text-ink-muted">{r.reason}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="mb-1 block text-xs font-bold text-ink-muted">Remark (required to flag, not to clear)</label>
                        <textarea
                            className={`form-control ${touched.remark && flagResult === null && !remark.trim() ? "is-invalid" : ""}`}
                            rows={2}
                            placeholder="Vendor confirmed wrong AWB printed on label"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </div>

                    {userId && (
                        <div className="mb-4 text-xs text-ink-muted">
                            This action will be recorded under user ID <span className="font-semibold text-ink">{userId}</span>.
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button color="danger" onClick={() => submitFlag("WRONG_AWB")} disabled={submitting || checking}>
                            <Flag size={15} className="mr-1" />
                            Mark as Wrong AWB
                        </Button>
                        <Button color="secondary" outline onClick={() => submitFlag(null)} disabled={submitting || checking}>
                            <FlagOff size={15} className="mr-1" />
                            Clear Flag
                        </Button>
                    </div>

                    {flagResult && (
                        <div className="mt-4 border-top pt-3">
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle size={20} className="text-success-500" />
                                <h5 className="m-0 text-ink">
                                    {flagResult.requestedFlag ? "Last Flag" : "Last Clear"}
                                </h5>
                            </div>
                            <p className="mb-2 text-ink">{flagResult.message || `${flagResult.count} AWB(s) processed`}</p>
                            <div className="mb-3 text-xs text-ink-muted">Completed at {flagResult.time}</div>

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
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={closeFlagModal}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={!!correctionAwb} toggle={() => !correctionSubmitting && setCorrectionAwb(null)} centered size="md">
                <ModalHeader toggle={() => !correctionSubmitting && setCorrectionAwb(null)}>
                    Mark Corrected — {correctionAwb}
                </ModalHeader>
                <ModalBody>
                    <p className="mb-3 text-xs text-ink-muted">
                        Records the real WAB correction for this AWB. This does not clear the WRONG_AWB flag --
                        use &quot;Clear Flag&quot; separately once you&apos;re done.
                    </p>
                    <FormGroup className="mb-0">
                        <Label>Remark<span className="text-danger-500"> *</span></Label>
                        <Input
                            type="textarea"
                            rows={3}
                            value={correctionRemark}
                            onChange={(e) => setCorrectionRemark(e.target.value)}
                            placeholder="Wrong AWB corrected per CS flag"
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setCorrectionAwb(null)} disabled={correctionSubmitting}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={submitCorrection} disabled={correctionSubmitting}>
                        {correctionSubmitting ? <Spinner size="sm" /> : "Submit Correction"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default WrongAwb
