import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button, Input, Label } from "@/components/ui"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CalendarClock, Eye, Monitor, Smartphone } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import usePostApiCall from "../../hooks/usePostApiCall"
import { rawRequest } from "@/lib/http"
import { GET_AWB_TRACKING, GET_BAG_TRACKING, ITRACK_SCANS } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import EditEDD from "../../components/AWBTracking/EditEDD"
import BagTrackingResult from "../../components/AWBTracking/BagTrackingResult"
import BookingInfoPanels, { buildBookingInfo } from "../../components/AWBTracking/BookingInfoPanels"
import AwbSelect from "../../components/AWBTracking/AwbSelect"
import PodViewer from "../../components/AWBTracking/PodViewer"

const formatDate = (iso) => {
    if (!iso) return "-"
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "-"
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    return `${dd}-${mm}-${date.getFullYear()}`
}

const formatTime = (iso) => (iso ? iso.split("T")[1]?.split(".")[0] : "-")

// Fire-and-forget audit trail: every lookup here is logged to /itrack/scans/
// the same way the reference app (Velocity-Ops) does on its Tracking page --
// so a search showing up in this screen never has to be inferred, it's
// recorded explicitly, by whoever searched it. Never blocks or surfaces an
// error to the user; a missed audit row isn't worth failing the lookup over.
const logTrackScan = async (awb, screenName) => {
    try {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "null")
        const user = authUser?.user || {}
        const scannedBy = user.first_name || user.username || ""
        await rawRequest(ITRACK_SCANS, {
            method: "POST",
            body: {
                awb,
                employee_code: user.employee_code || "",
                scanned_by: scannedBy,
                service_center: user.service_center_code?.[0] || "",
                screen_name: scannedBy ? `${screenName} by ${scannedBy}` : screenName,
            },
        })
    } catch {
        // best-effort only
    }
}

// The accent blue the modernised tracking screens use throughout (see
// ShipmentTraceDetail). border/tint/solid stay a fixed accent blue in both
// themes, same as elsewhere; text used to be a pastel blue (#93C5FD) tuned
// only for the dark glass it always sat on -- on a light-theme card that
// pastel-on-pale-tint pairing goes low-contrast, so it's the theme's own
// ink token instead.
const ACCENT = { border: "rgba(59,130,246,0.3)", tint: "rgba(59,130,246,0.15)", text: "var(--color-ink)", solid: "#3B82F6" }

const TrackAWB = () => {
    const navigate = useNavigate()
    const [trackingNo, setTrackingNo] = useState("")
    const [searchType, setSearchType] = useState("shipment") // "shipment" | "bag"
    const [activeComponent, setActiveComponent] = useState("")

    const [bookingData, setBookingData] = useState(null)
    const [trackData, setTrackData] = useState({}) // { awbno: [events] | "message" }
    const [activeAwb, setActiveAwb] = useState(null)
    const [bagInfo, setBagInfo] = useState(null)
    const [hasSearched, setHasSearched] = useState(false)

    const timelineRef = useRef(null)
    const [histHeight, setHistHeight] = useState(360)

    useEffect(() => {
        document.title = "Shipment & Bag Tracking"
    }, [])

    const { apifunc: trackShipment, loading: shipmentLoading } = usePostApiCall()
    const { apifunc: trackBag, loading: bagLoading } = usePostApiCall()
    const { ErrorToaster } = ToasterProvider()

    const isLoading = shipmentLoading || bagLoading

    const onTrack = async () => {
        if (!trackingNo) {
            ErrorToaster(searchType === "bag" ? "Please enter a Bag number" : "Please enter an AWB number")
            return
        }

        if (searchType === "bag") {
            const res = await trackBag(GET_BAG_TRACKING, { bag_no: trackingNo })
            setHasSearched(true)
            if (res?.parent_bag_data) {
                setBagInfo(res)
                logTrackScan(trackingNo, "Bag Tracking")
            } else {
                setBagInfo(null)
                ErrorToaster(res?.message || "Bag not found")
            }
            setBookingData(null)
            setTrackData({})
            setActiveAwb(null)
        } else {
            const res = await trackShipment(GET_AWB_TRACKING, { awbno: trackingNo })
            setHasSearched(true)
            // A shipment that is booked but not scanned yet comes back with
            // booking_data and an empty track_data ({}) -- that is still a hit,
            // the booking panels just have no timeline under them.
            const trackKeys = res?.track_data ? Object.keys(res.track_data) : []
            const hasBooking = !!res?.booking_data && Object.keys(res.booking_data).length > 0
            if (trackKeys.length > 0 || hasBooking) {
                setBookingData(res.booking_data || null)
                setTrackData(res.track_data || {})
                setActiveAwb(
                    trackKeys.includes(trackingNo)
                        ? trackingNo
                        : trackKeys[0] || res.booking_data?.awbno || trackingNo,
                )
                logTrackScan(trackingNo, "Shipment Tracking")
            } else {
                setBookingData(null)
                setTrackData({})
                setActiveAwb(null)
                ErrorToaster(res?.message || "AWB not found")
            }
            setBagInfo(null)
        }
    }

    // The history fills whatever screen height is left under the fixed cards and scrolls inside it.
    useLayoutEffect(() => {
        const scrollParent = (node) => {
            for (let n = node?.parentElement; n; n = n.parentElement) {
                const oy = getComputedStyle(n).overflowY
                if (oy === "auto" || oy === "scroll") return n
            }
            return null
        }
        const fit = () => {
            const el = timelineRef.current
            if (!el) return
            // Offset of the history inside its scroll box, independent of the current scroll position,
            // so the bottom edge always lands inside the visible area.
            const parent = scrollParent(el)
            const viewH = parent ? parent.clientHeight : window.innerHeight
            const offset = parent
                ? el.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop
                : el.getBoundingClientRect().top + window.scrollY
            // 32px: breathing room for the container's bottom padding
            setHistHeight(Math.max(240, Math.floor(viewH - offset - 32)))
        }
        fit()
        window.addEventListener("resize", fit)
        return () => window.removeEventListener("resize", fit)
    }, [bookingData, activeAwb, isLoading, searchType])

    // whenever the selected AWB tab changes, scroll its timeline back to the top
    useLayoutEffect(() => {
        if (timelineRef.current) timelineRef.current.scrollTop = 0
    }, [activeAwb])

    const dataList = useMemo(() => {
        if (!activeAwb || !trackData?.[activeAwb]) return []
        const activeTrack = trackData[activeAwb]
        if (!Array.isArray(activeTrack)) return []
        return [...activeTrack]
            .sort((a, b) => new Date(b.status_date) - new Date(a.status_date))
            .map((ele, index) => ({
                status: ele.status || "-",
                date: formatDate(ele.status_date),
                time: formatTime(ele.status_date),
                service_center: ele.service_center || "-",
                service_center_city: ele.service_center_city || "",
                remark: ele.remarks || "-",
                bag_no: ele.bag_no,
                manifest_no: ele.manifest_no,
                manifest_destination: ele.manifest_destination,
                employee_id: ele.employee_id,
                employee_name: ele.employee_name,
                updated_via: ele.updated_via || "",
                active: index === 0,
            }))
    }, [activeAwb, trackData])

    // One entry per AWB (piece) in the shipment, each with its latest status for the picker.
    const awbOptions = useMemo(() => {
        const keys = Object.keys(trackData || {})
        const list = keys.length > 0 ? keys : [activeAwb].filter(Boolean)
        return list.map((key) => {
            const events = Array.isArray(trackData?.[key]) ? trackData[key] : []
            const latest = [...events].sort((x, y) => new Date(y.status_date) - new Date(x.status_date))[0]
            return { value: key, status: latest?.status || "" }
        })
    }, [trackData, activeAwb])

    const noDataMessage = activeAwb && trackData?.[activeAwb] && !Array.isArray(trackData[activeAwb])
        ? trackData[activeAwb]
        : "No tracking data available"

    // Same panels (and data mapping) as the Shipment Trace detail screen.
    // EDD isn't on booking_data -- it rides on the checkpoint events of the active AWB.
    const headerInfo = useMemo(() => {
        if (!bookingData) return null
        return buildBookingInfo(bookingData, trackData?.[activeAwb]?.[0])
    }, [bookingData, trackData, activeAwb])

    const handleDetailView = () => {
        if (!activeAwb) {
            ErrorToaster("Please track an AWB first")
            return
        }
        navigate(`/track-awb/${activeAwb}/details`)
    }

    const showShipment = searchType === "shipment" && !!bookingData

    return (
        // overflow-x-clip, not -hidden: hidden turns this div into its own scroll container,
        // which would pin the sticky search bar to it instead of the layout's scrolling box.
        <div className="page-content relative min-h-full overflow-x-clip py-0 antialiased">
            <MainHeaderComp
                title="Shipment & Bag Tracking"
                subTitle="Look up a shipment's checkpoints, or trace a bag's movement."
                onRefresh={showShipment ? onTrack : null}
                refreshing={isLoading}
                extraFields={
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Input
                                type="text"
                                placeholder="AWB / Bag Number"
                                className="w-56"
                                value={trackingNo}
                                onChange={(e) => setTrackingNo(e.target.value ? e.target.value.toUpperCase() : "")}
                                onKeyDown={(e) => { if (e.key === "Enter") onTrack() }}
                            />
                            {/* Real radio inputs: a single either/or choice, not two more actions. */}
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                    <Input type="radio" id="search-type-shipment" name="searchType"
                                        checked={searchType === "shipment"} onChange={() => setSearchType("shipment")} />
                                    <Label for="search-type-shipment" className="mb-0 cursor-pointer text-[13px] font-medium">Shipment</Label>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Input type="radio" id="search-type-bag" name="searchType"
                                        checked={searchType === "bag"} onChange={() => setSearchType("bag")} />
                                    <Label for="search-type-bag" className="mb-0 cursor-pointer text-[13px] font-medium">Bag</Label>
                                </div>
                            </div>
                            <Button className="table-action-btn table-action-btn-primary" onClick={onTrack} disabled={!trackingNo || isLoading}>
                                {isLoading ? "Tracking..." : "Track"}
                            </Button>
                        </div>
                        {bookingData && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    className="table-action-btn table-action-btn-ghost"
                                    onClick={() => setActiveComponent("edit_edd")}
                                >
                                    <CalendarClock aria-hidden="true" size={15} />
                                    EDD
                                </Button>
                            </div>
                        )}
                    </div>
                }
            />

            {/* No height:90vh with its own scrollbar: the layout's box already scrolls. */}
            <div className="container-fluid relative z-10 px-4 pb-4">

                {isLoading ? (
                    <Loader message="Tracking shipment…" fullscreen={false} />
                ) : searchType === "bag" ? (
                    bagInfo && <BagTrackingResult bagInfo={bagInfo} bagNo={trackingNo} />
                ) : bookingData && (
                    <div>
                        {/* sticky: the three cards stay put while the history scrolls underneath */}
                        <div className="sticky top-0 z-20 bg-canvas pb-2">
                            <BookingInfoPanels
                                info={headerInfo}
                                awb={activeAwb}
                                showWeight={false}
                                rtoApproved={bookingData.rto_approval === true && !!bookingData.shipment_flag}
                            />
                        </div>

                        {/* --------- multipiece AWB tabs + timeline --------- */}
                        <div className="mt-2 flex flex-col gap-1">
                            <div className="mb-1.5 flex items-center gap-2">
                                <AwbSelect options={awbOptions} value={activeAwb || ""} onChange={setActiveAwb} />
                                <PodViewer awbNo={activeAwb} thumbnail />
                            </div>

                            <div ref={timelineRef} className="scroll-slim min-w-0 flex-1" style={{ height: histHeight, overflowY: "auto" }}>
                                {dataList.map((item, index) => (
                                    <div key={index} className="relative flex items-stretch gap-1.5">
                                        <div className="self-start pb-4 text-center" style={{ minWidth: 110 }}>
                                            <span
                                                className="badge px-3 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm"
                                                style={{ borderRadius: 999, backgroundColor: ACCENT.solid, border: `1px solid ${ACCENT.solid}` }}
                                            >
                                                {item.status}
                                            </span>
                                            <div className="mt-1.5 text-[13px] font-bold text-ink">{item.date}</div>
                                            <div className="text-[12px] font-medium text-ink">At {item.time}</div>
                                        </div>

                                        <div className="flex flex-col items-center" style={{ width: 20 }}>
                                            <div
                                                className="flex-shrink-0 rounded-full border-4"
                                                style={{
                                                    width: 20, height: 20,
                                                    backgroundColor: item.active ? ACCENT.solid : "transparent",
                                                    borderColor: ACCENT.border,
                                                }}
                                            />
                                            {index < dataList.length - 1 && (
                                                <div style={{ flex: 1, minHeight: 16, borderRight: `2px dashed ${ACCENT.border}` }} />
                                            )}
                                        </div>

                                        <div className="relative mb-4 grid flex-1 self-start grid-cols-2 gap-3 rounded-xl border border-[rgb(var(--overlay-rgb)/0.08)] bg-[var(--glass-surface)] backdrop-blur-xl p-3 md:grid-cols-4">
                                            {item.updated_via && (
                                                <span
                                                    className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold capitalize ${
                                                        item.updated_via.toLowerCase() === "mobile"
                                                            ? "border-success-500/50 bg-success-500/20 text-success-500"
                                                            : "border-[#3B82F6]/50 bg-[#3B82F6]/20 text-ink"
                                                    }`}
                                                >
                                                    {item.updated_via.toLowerCase() === "mobile" ? <Smartphone size={10} /> : <Monitor size={10} />}
                                                    {item.updated_via}
                                                </span>
                                            )}
                                                                                        <div>
                                                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Service Center</div>
                                                <div className="text-[13px] font-semibold text-ink">
                                                    {item.service_center}
                                                    {item.service_center_city?.trim?.() ? `-${item.service_center_city}` : ""}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Remark</div>
                                                <div className="text-[13px] font-semibold text-ink">{item.remark}</div>
                                            </div>
                                            {item.bag_no?.trim?.() && (
                                                <div>
                                                    <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Bag No</div>
                                                    <div className="text-[13px] font-semibold text-ink">{item.bag_no}</div>
                                                </div>
                                            )}
                                            {item.manifest_no?.trim?.() && (
                                                <div>
                                                    <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Manifest No</div>
                                                    <div className="text-[13px] font-semibold text-ink">{item.manifest_no}</div>
                                                </div>
                                            )}
                                            {item.manifest_destination?.trim?.() && (
                                                <div>
                                                    <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Manifest Destination</div>
                                                    <div className="text-[13px] font-semibold text-ink">{item.manifest_destination}</div>
                                                </div>
                                            )}
                                            {String(item.employee_id ?? "").trim() && (
                                                <div>
                                                    <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Employee ID</div>
                                                    <div className="text-[13px] font-semibold text-ink">{item.employee_id}</div>
                                                </div>
                                            )}
                                            {String(item.employee_name ?? "").trim() && (
                                                <div>
                                                    <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Employee Name</div>
                                                    <div className="text-[13px] font-semibold text-ink">{item.employee_name}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {dataList.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <AlertCircle size={32} className="mb-2 text-ink-muted" />
                                        <p className="font-medium text-ink-muted">{noDataMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !bookingData && !bagInfo && hasSearched && (
                    <div className="py-10 text-center text-ink-muted">No results found</div>
                )}
            </div>

            {showShipment && !isLoading && (
                <button
                    type="button"
                    onClick={handleDetailView}
                    title="View Detail"
                    aria-label="View Detail"
                    className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border-0 bg-brand-500 text-white shadow-lg hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <Eye aria-hidden="true" size={22} />
                </button>
            )}

            <EditEDD
                shipmentDetails={{ awbno: activeAwb }}
                currentEdd={headerInfo?.booking?.EDD || ""}
                isOpen={activeComponent === "edit_edd"}
                toggle={() => setActiveComponent("")}
                onSuccess={(newEdd) => {
                    // Patches the first track_data event's EDD, matching what
                    // headerInfo now reads the displayed EDD from -- updating
                    // bookingData.edd here would no longer be reflected on screen.
                    setTrackData((prev) => {
                        const events = prev?.[activeAwb]
                        if (!activeAwb || !Array.isArray(events) || !events.length) return prev
                        const updated = [...events]
                        updated[0] = { ...updated[0], EDD: newEdd }
                        return { ...prev, [activeAwb]: updated }
                    })
                }}
            />

            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

export default TrackAWB
