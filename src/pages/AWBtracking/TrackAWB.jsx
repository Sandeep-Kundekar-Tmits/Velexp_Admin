import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button, Input, Label } from "reactstrap"
import { useNavigate } from "react-router-dom"
import { AlertCircle, RefreshCcw, ScanEye } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
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

// Same blue/green/orange scheme as the OPS tracking screen (Booking / Shipper / Consignee)
const OPS_COLORS = {
    blue: { bg: "#eff6ff", text: "#2563eb" },
    green: { bg: "#f0fdf4", text: "#16a34a" },
    orange: { bg: "#fff7ed", text: "#ea580c" },
}

// The blue used throughout the OPS timeline (status pill, dot, active AWB tab)
const OPS_BLUE = { 100: "#dbeafe", 300: "#93c5fd", 600: "#2563eb", 700: "#1d4ed8" }

const Section = ({ title, color, children }) => (
    <div className="border-bottom border-md-bottom-0 border-md-end p-3 h-100" style={{ backgroundColor: OPS_COLORS[color].bg }}>
        <p className="text-uppercase fw-bold small mb-2" style={{ fontSize: 11, color: OPS_COLORS[color].text }}>{title}</p>
        <div className="row row-cols-2 g-2">{children}</div>
    </div>
)

const Pair = ({ label, value, full }) => (
    <div className={full ? "col-12" : "col-6"}>
        <div className="fw-semibold text-dark text-break">{value || "-"}</div>
        <div className="text-muted text-capitalize small">{label}</div>
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
        <div className="page-content py-0 px-0">
            <MainHeaderComp
                title="Shipment & Bag Tracking"
                extraFields={
                    bookingData && (
                        <button className="btn btn-primary" onClick={() => setActiveComponent("edit_edd")}>
                            Edit Estimated Delivery Date
                        </button>
                    )
                }
            />

            <div className="container-fluid px-3" style={{ height: "90vh", overflowY: "auto" }}>

                {/* search bar */}
                <div className="mt-3 border-bottom w-100 d-flex flex-wrap pb-3 align-items-center justify-content-center gap-3">
                    <Input
                        type="text"
                        placeholder="AWB / Bag Number"
                        style={{ width: "260px" }}
                        value={trackingNo}
                        onChange={(e) => setTrackingNo(e.target.value ? e.target.value.toUpperCase() : "")}
                        onKeyDown={(e) => { if (e.key === "Enter") onTrack() }}
                    />

                    <div className="d-flex align-items-center gap-3">
                        <div className="form-check">
                            <Input
                                type="radio"
                                className="form-check-input"
                                id="search-type-shipment"
                                checked={searchType === "shipment"}
                                onChange={() => setSearchType("shipment")}
                            />
                            <Label className="form-check-label" htmlFor="search-type-shipment">Shipment</Label>
                        </div>
                        <div className="form-check">
                            <Input
                                type="radio"
                                className="form-check-input"
                                id="search-type-bag"
                                checked={searchType === "bag"}
                                onChange={() => setSearchType("bag")}
                            />
                            <Label className="form-check-label" htmlFor="search-type-bag">Bag</Label>
                        </div>
                    </div>

                    <Button className="bg-primary" onClick={onTrack} disabled={!trackingNo || isLoading}>
                        {isLoading ? "Tracking..." : "Track"}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : searchType === "bag" ? (
                    bagInfo && <BagTrackingResult bagInfo={bagInfo} bagNo={trackingNo} />
                ) : bookingData && (
                    <div>
                        {/* --------- header info --------- */}
                        <div className="d-flex align-items-center gap-2 border-bottom pb-2 mb-2">
                            <span className="fw-semibold" style={{ fontSize: 18 }}>
                                Shipment Details - AWB : {activeAwb}
                            </span>
                            <RefreshCcw
                                size={16}
                                className={isLoading ? "spin" : ""}
                                style={{ cursor: "pointer" }}
                                onClick={onTrack}
                            />
                        </div>

                        <div className="row g-0 border">
                            <div className="col-12 col-md-4">
                                <Section title="Booking Info" color="blue">
                                    {Object.entries(headerInfo.booking).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} />
                                    ))}
                                </Section>
                            </div>
                            <div className="col-12 col-md-4">
                                <Section title="Shipper Details" color="green">
                                    {Object.entries(headerInfo.shipper).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} full={label === "Location" || label === "Address"} />
                                    ))}
                                </Section>
                            </div>
                            <div className="col-12 col-md-4">
                                <Section title="Consignee Details" color="orange">
                                    {Object.entries(headerInfo.consignee).map(([label, value]) => (
                                        <Pair key={label} label={label} value={value} full={label === "Location" || label === "Address"} />
                                    ))}
                                </Section>
                            </div>
                        </div>

                        {/* --------- multipiece AWB tabs + timeline --------- */}
                        <div className="d-flex flex-column flex-md-row gap-3 mt-3">
                            <div className="border" style={{ minWidth: 180 }}>
                                <div className="bg-light px-3 py-2 border-bottom text-uppercase small fw-semibold">AWB No</div>
                                <div className="d-flex flex-row flex-md-column overflow-auto">
                                    {Object.keys(trackData).map((key) => {
                                        const active = key === activeAwb
                                        return (
                                            <div
                                                key={key}
                                                onClick={() => setActiveAwb(key)}
                                                className={`px-3 py-2 small text-nowrap border-start border-4 ${active ? "fw-semibold" : "border-transparent"}`}
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor: active ? OPS_BLUE[100] : "transparent",
                                                    borderColor: active ? OPS_BLUE[600] : "transparent",
                                                    color: active ? OPS_BLUE[700] : undefined,
                                                }}
                                            >
                                                {key}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div ref={timelineRef} className="flex-fill" style={{ maxHeight: "55vh", overflowY: "auto" }}>
                                {dataList.map((item, index) => (
                                    <div key={index} className="d-flex align-items-start gap-3 position-relative pb-4">
                                        <div className="text-center" style={{ minWidth: 110 }}>
                                            <span className="badge rounded-pill px-2 py-1" style={{ backgroundColor: OPS_BLUE[600] }}>{item.status}</span>
                                            <div className="small fw-semibold mt-1">{item.date}</div>
                                            <div className="small text-muted">At {item.time}</div>
                                        </div>

                                        <div className="d-flex flex-column align-items-center" style={{ width: 24 }}>
                                            <div
                                                className="rounded-circle border border-4 flex-shrink-0"
                                                style={{
                                                    width: 20, height: 20,
                                                    backgroundColor: item.active ? OPS_BLUE[600] : "#fff",
                                                    borderColor: OPS_BLUE[300],
                                                }}
                                            />
                                            {index < dataList.length - 1 && (
                                                <div style={{ width: 2, flex: 1, borderRight: `2px dashed ${OPS_BLUE[300]}`, minHeight: 40 }} />
                                            )}
                                        </div>

                                        <div className="border rounded p-2 flex-fill row row-cols-2 row-cols-md-3 g-2">
                                            <div>
                                                <div className="fw-semibold small">Service Center</div>
                                                <div className="text-muted small">{item.service_center}</div>
                                            </div>
                                            <div>
                                                <div className="fw-semibold small">Remark</div>
                                                <div className="text-muted small">{item.remark}</div>
                                            </div>
                                            {item.bag_no?.trim?.() && (
                                                <div>
                                                    <div className="fw-semibold small">Bag No</div>
                                                    <div className="text-muted small">{item.bag_no}</div>
                                                </div>
                                            )}
                                            {item.manifest_no?.trim?.() && (
                                                <div>
                                                    <div className="fw-semibold small">Manifest No</div>
                                                    <div className="text-muted small">{item.manifest_no}</div>
                                                </div>
                                            )}
                                            {String(item.employee_id ?? "").trim() && (
                                                <div>
                                                    <div className="fw-semibold small">Employee ID</div>
                                                    <div className="text-muted small">{item.employee_id}</div>
                                                </div>
                                            )}
                                            {String(item.employee_name ?? "").trim() && (
                                                <div>
                                                    <div className="fw-semibold small">Employee Name</div>
                                                    <div className="text-muted small">{item.employee_name}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {dataList.length === 0 && (
                                    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                                        <AlertCircle size={32} className="text-muted mb-2" />
                                        <p className="text-muted fw-medium">{noDataMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !bookingData && !bagInfo && hasSearched && (
                    <div className="text-center text-muted py-5">No results found</div>
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

            {/* Floating Detail View Button */}
            {searchType === "shipment" && bookingData && (
                <button
                    className="btn btn-info btn-lg rounded-circle position-fixed"
                    style={{
                        bottom: "30px", right: "30px", width: "60px", height: "60px",
                        zIndex: 1000, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onClick={handleDetailView}
                    title="View Detailed Shipment Trace"
                >
                    <ScanEye size={26} />
                </button>
            )}

            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

export default TrackAWB
