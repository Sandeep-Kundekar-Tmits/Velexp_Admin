import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button, Input } from "@/components/ui"
import { useNavigate } from "react-router-dom"
import { AlertCircle, CalendarClock, FileSearch, RefreshCcw } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import usePostApiCall from "../../hooks/usePostApiCall"
import { GET_AWB_TRACKING, GET_BAG_TRACKING } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import EditEDD from "../../components/AWBTracking/EditEDD"
import BagTrackingResult from "../../components/AWBTracking/BagTrackingResult"

const formatDate = (iso) => {
    if (!iso) return "-"
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "-"
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    return `${dd}-${mm}-${date.getFullYear()}`
}

const formatTime = (iso) => (iso ? iso.split("T")[1]?.split(".")[0] : "-")

// The accent blue the modernised tracking screens use throughout (see ShipmentTraceDetail)
const ACCENT = { border: "rgba(59,130,246,0.3)", tint: "rgba(59,130,246,0.15)", text: "#93C5FD", solid: "#3B82F6" }

const ACCENTS = {
    blue: { header: "bg-[#3B82F6]/12", text: "text-[#93C5FD]" },
    green: { header: "bg-success-500/12", text: "text-success-500" },
    red: { header: "bg-danger-500/12", text: "text-danger-500" },
}

/*
 * Same glass panel as the rest of the app (see the "Section" this replaced),
 * now with a colour-coded header so Booking / Shipper / Consignee read apart
 * at a glance -- matching the convention ShipmentTraceDetail already set for
 * this same three-way split.
 */
const Section = ({ title, accent = "blue", children }) => (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
        <div className={`border-b border-white/8 px-4 py-2.5 ${ACCENTS[accent].header}`}>
            <h6 className={`m-0 text-[11px] font-semibold uppercase tracking-wider ${ACCENTS[accent].text}`}>{title}</h6>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">{children}</div>
    </div>
)

const Pair = ({ label, value, full }) => (
    <div className={full ? "col-span-2 min-w-0" : "min-w-0"}>
        <div className="break-words text-[13px] font-semibold text-ink">{value || "-"}</div>
        <div className="text-[11px] capitalize text-ink-muted">{label}</div>
    </div>
)

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
            if (res?.track_data && Object.keys(res.track_data).length > 0) {
                setBookingData(res.booking_data || null)
                setTrackData(res.track_data)
                const keys = Object.keys(res.track_data)
                setActiveAwb(keys.includes(trackingNo) ? trackingNo : keys[0])
            } else {
                setBookingData(null)
                setTrackData({})
                setActiveAwb(null)
                ErrorToaster(res?.message || "AWB not found")
            }
            setBagInfo(null)
        }
    }

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
                remark: ele.remarks || "-",
                bag_no: ele.bag_no,
                manifest_no: ele.manifest_no,
                employee_id: ele.employee_id,
                employee_name: ele.employee_name,
                active: index === 0,
            }))
    }, [activeAwb, trackData])

    const noDataMessage = activeAwb && trackData?.[activeAwb] && !Array.isArray(trackData[activeAwb])
        ? trackData[activeAwb]
        : "No tracking data available"

    const headerInfo = useMemo(() => {
        if (!bookingData) return null
        return {
            booking: {
                "AWB No": bookingData.awbno,
                "Order ID": bookingData.orderid,
                Customer: bookingData.customer_name,
                "Booking Date": formatDate(bookingData.booking_date || bookingData.booked_date),
                Product: bookingData.product,
                Weight: bookingData.weight != null ? `${bookingData.weight} Kg` : null,
                "Vol. Weight": bookingData.volumetric_weight != null ? `${bookingData.volumetric_weight} Kg` : null,
                Pieces: bookingData.no_of_pieces,
                Attempts: bookingData.attempt_count,
                "RTO AWB No": bookingData.RTO_awbno,
                EDD: bookingData.edd ? bookingData.edd.slice(0, 10) : null,
            },
            shipper: {
                Name: bookingData.shipper_name,
                Mobile: bookingData.shipper_mobile,
                Location: (bookingData.shipper_city && bookingData.shipper_state)
                    ? `${bookingData.shipper_city}, ${bookingData.shipper_state} (${bookingData.shipper_pincode || ""})`
                    : null,
                Address: bookingData.shipper_address,
            },
            consignee: {
                Name: bookingData.consignee_name,
                Mobile: bookingData.consignee_mobile,
                Location: (bookingData.consignee_city && bookingData.consignee_state)
                    ? `${bookingData.consignee_city}, ${bookingData.consignee_state} (${bookingData.consignee_pincode || ""})`
                    : null,
                Address: bookingData.consignee_address,
            },
        }
    }, [bookingData])

    const handleDetailView = () => {
        if (!activeAwb) {
            ErrorToaster("Please track an AWB first")
            return
        }
        navigate(`/track-awb/${activeAwb}/details`)
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Shipment & Bag Tracking"
                subTitle="Look up a shipment's checkpoints, or trace a bag's movement."
                extraFields={
                    bookingData && (
                        <div className="flex items-center gap-2">
                            <Button
                                className="table-action-btn table-action-btn-ghost"
                                onClick={() => setActiveComponent("edit_edd")}
                            >
                                <CalendarClock aria-hidden="true" size={15} />
                                Edit Estimated Delivery Date
                            </Button>
                            <Button
                                className="table-action-btn table-action-btn-primary"
                                onClick={handleDetailView}
                            >
                                <FileSearch aria-hidden="true" size={15} />
                                View Full Trace
                            </Button>
                        </div>
                    )
                }
            />

            {/* No height:90vh with its own scrollbar: the layout's box already scrolls. */}
            <div className="container-fluid relative z-10 px-4 pb-4">

                {/* search bar */}
                <div className="filter-row">
                    <div className="filter-group">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Input
                                type="text"
                                placeholder="AWB / Bag Number"
                                value={trackingNo}
                                onChange={(e) => setTrackingNo(e.target.value ? e.target.value.toUpperCase() : "")}
                                onKeyDown={(e) => { if (e.key === "Enter") onTrack() }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSearchType("shipment")}
                                className={`table-action-btn ${searchType === "shipment" ? "table-action-btn-primary" : "table-action-btn-ghost"}`}
                            >
                                Shipment
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType("bag")}
                                className={`table-action-btn ${searchType === "bag" ? "table-action-btn-primary" : "table-action-btn-ghost"}`}
                            >
                                Bag
                            </button>
                        </div>

                        <Button
                            className="table-action-btn table-action-btn-primary"
                            onClick={onTrack}
                            disabled={!trackingNo || isLoading}
                        >
                            {isLoading ? "Tracking..." : "Track"}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <Loader message="Tracking shipment…" fullscreen={false} />
                ) : searchType === "bag" ? (
                    bagInfo && <BagTrackingResult bagInfo={bagInfo} bagNo={trackingNo} />
                ) : bookingData && (
                    <div className="mt-3">
                        {/* --------- header info --------- */}
                        <div className="mb-3 flex items-center gap-2 border-b border-white/8 pb-2">
                            <span className="font-semibold text-ink" style={{ fontSize: 18 }}>
                                Shipment Details - AWB : {activeAwb}
                            </span>
                            <RefreshCcw
                                size={16}
                                className={`text-ink-muted ${isLoading ? "spin" : ""}`}
                                style={{ cursor: "pointer" }}
                                onClick={onTrack}
                            />
                            {bookingData.rto_approval === true && bookingData.shipment_flag ? (
                                <span className="badge border border-success-500/30 bg-success-500/15 text-success-500">
                                    RTO Approved
                                </span>
                            ) : (
                                <span className="badge border border-white/15 bg-white/5 text-ink-muted">Not RTO Approved</span>
                            )}
                        </div>

                        <div className="row gap-y-3">
                            <div className="col-12 col-lg-4">
                                <Section title="Booking Info" accent="blue">
                                    {Object.entries(headerInfo.booking).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} />
                                    ))}
                                </Section>
                            </div>
                            <div className="col-12 col-lg-4">
                                <Section title="Shipper Details" accent="green">
                                    {Object.entries(headerInfo.shipper).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} full={label === "Location" || label === "Address"} />
                                    ))}
                                </Section>
                            </div>
                            <div className="col-12 col-lg-4">
                                <Section title="Consignee Details" accent="red">
                                    {Object.entries(headerInfo.consignee).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} full={label === "Location" || label === "Address"} />
                                    ))}
                                </Section>
                            </div>
                        </div>

                        {/* --------- multipiece AWB tabs + timeline --------- */}
                        <div className="mt-3 flex flex-col gap-3 md:flex-row">
                            <div className="overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl md:w-44 md:flex-shrink-0">
                                <div className="border-b border-white/8 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                    AWB No
                                </div>
                                <div className="flex flex-wrap md:flex-col">
                                    {Object.keys(trackData).map((key) => {
                                        const active = key === activeAwb
                                        return (
                                            <div
                                                key={key}
                                                onClick={() => setActiveAwb(key)}
                                                className="whitespace-nowrap border-l-4 px-3 py-2 text-[13px]"
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor: active ? ACCENT.tint : "transparent",
                                                    borderColor: active ? ACCENT.solid : "transparent",
                                                    color: active ? ACCENT.text : undefined,
                                                    fontWeight: active ? 600 : 400,
                                                }}
                                            >
                                                {key}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div ref={timelineRef} className="scroll-slim flex-1" style={{ maxHeight: "55vh", overflowY: "auto" }}>
                                {dataList.map((item, index) => (
                                    <div key={index} className="relative flex items-start gap-3 pb-4">
                                        <div className="text-center" style={{ minWidth: 110 }}>
                                            <span
                                                className="badge px-2 py-1"
                                                style={{ borderRadius: 999, backgroundColor: ACCENT.tint, border: `1px solid ${ACCENT.border}`, color: ACCENT.text }}
                                            >
                                                {item.status}
                                            </span>
                                            <div className="mt-1 text-[12px] font-semibold text-ink">{item.date}</div>
                                            <div className="text-[11px] text-ink-muted">At {item.time}</div>
                                        </div>

                                        <div className="flex flex-col items-center" style={{ width: 24 }}>
                                            <div
                                                className="flex-shrink-0 rounded-full border-4"
                                                style={{
                                                    width: 20, height: 20,
                                                    backgroundColor: item.active ? ACCENT.solid : "transparent",
                                                    borderColor: ACCENT.border,
                                                }}
                                            />
                                            {index < dataList.length - 1 && (
                                                <div style={{ width: 2, flex: 1, borderRight: `2px dashed ${ACCENT.border}`, minHeight: 40 }} />
                                            )}
                                        </div>

                                        <div className="grid flex-1 grid-cols-2 gap-3 rounded-xl border border-white/8 bg-white/2 p-3 md:grid-cols-3">
                                            <div>
                                                <div className="text-[12px] font-semibold text-ink">Service Center</div>
                                                <div className="text-[12px] text-ink-muted">{item.service_center}</div>
                                            </div>
                                            <div>
                                                <div className="text-[12px] font-semibold text-ink">Remark</div>
                                                <div className="text-[12px] text-ink-muted">{item.remark}</div>
                                            </div>
                                            {item.bag_no?.trim?.() && (
                                                <div>
                                                    <div className="text-[12px] font-semibold text-ink">Bag No</div>
                                                    <div className="text-[12px] text-ink-muted">{item.bag_no}</div>
                                                </div>
                                            )}
                                            {item.manifest_no?.trim?.() && (
                                                <div>
                                                    <div className="text-[12px] font-semibold text-ink">Manifest No</div>
                                                    <div className="text-[12px] text-ink-muted">{item.manifest_no}</div>
                                                </div>
                                            )}
                                            {String(item.employee_id ?? "").trim() && (
                                                <div>
                                                    <div className="text-[12px] font-semibold text-ink">Employee ID</div>
                                                    <div className="text-[12px] text-ink-muted">{item.employee_id}</div>
                                                </div>
                                            )}
                                            {String(item.employee_name ?? "").trim() && (
                                                <div>
                                                    <div className="text-[12px] font-semibold text-ink">Employee Name</div>
                                                    <div className="text-[12px] text-ink-muted">{item.employee_name}</div>
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

            <EditEDD
                shipmentDetails={{ awbno: activeAwb }}
                isOpen={activeComponent === "edit_edd"}
                toggle={() => setActiveComponent("")}
                onSuccess={(newEdd) => {
                    setBookingData((prev) => (prev ? { ...prev, edd: newEdd } : prev))
                }}
            />

            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

export default TrackAWB
