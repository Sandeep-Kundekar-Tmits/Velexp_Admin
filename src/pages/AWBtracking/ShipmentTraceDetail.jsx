import { Button, Spinner } from "@/components/ui"
import { ChevronDown } from "lucide-react"
import Loader from "@/Loaders/Loader"
import MainHeaderComp from "../../components/MainHeaderCom"
import { useState, useEffect, useMemo } from "react"
import usePostApiCall from "../../hooks/usePostApiCall"
import { SHIPMENT_TRACE, GET_IN_DETAILED_TRACKING } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import { useParams, useNavigate } from "react-router-dom"
import axios from 'axios'

const formatDate = (dateString) => {
    if (!dateString) return "-"
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    } catch {
        return dateString
    }
}

const formatDateTime = (dateString) => {
    if (!dateString) return "-"
    try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
        return dateString
    }
}

// The accent blue the modernised tracking screens use throughout (see TrackAWB)
const ACCENT_TINT = "rgba(59,130,246,0.15)"
const ACCENT_SOLID = "#3B82F6"

// Chain of bag hops (bag -> manifest -> vehicle/driver) linked to one tracking status
const BagMovementChain = ({ bagTracking = [] }) => {
    if (bagTracking.length === 0) {
        return <div className="py-2 pl-2 text-xs text-ink-muted">Bag details not available for this status</div>
    }
    return (
        <div className="flex flex-col gap-2 pl-2 pt-2">
            {bagTracking.map((bag, i) => (
                <div key={bag.id ?? i} className="flex items-stretch gap-2">
                    <div className="flex flex-col items-center">
                        <div className="rounded-full" style={{ width: 10, height: 10, marginTop: 6, backgroundColor: ACCENT_SOLID }} />
                        {i < bagTracking.length - 1 && <div style={{ width: 2, flex: 1, background: "rgba(59,130,246,0.35)" }} />}
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-2 rounded-xl border border-white/8 bg-white/2 p-2 md:grid-cols-4" style={{ fontSize: 13 }}>
                        <div><span className="font-semibold text-ink">Bag No:</span> <span className="text-ink-muted">{bag.bag_no || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Manifest:</span> <span className="text-ink-muted">{bag.bag_manifest_no || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Status:</span> <span className="text-ink-muted">{bag.status || "-"} {bag.remark ? `(${bag.remark})` : ""}</span></div>
                        <div><span className="font-semibold text-ink">Current SC:</span> <span className="text-ink-muted">{bag.current_service_center || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Source:</span> <span className="text-ink-muted">{bag.source_service_center || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Destination:</span> <span className="text-ink-muted">{bag.destination_service_center || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Vehicle No:</span> <span className="text-ink-muted">{bag.vehicle_no || "-"}</span></div>
                        <div><span className="font-semibold text-ink">Driver:</span> <span className="text-ink-muted">{bag.driver_name || "-"} {bag.driver_mobile ? `(${bag.driver_mobile})` : ""}</span></div>
                        <div className="col-span-2 text-ink-muted md:col-span-4"><span className="font-semibold text-ink">Updated:</span> {formatDateTime(bag.created_at)}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

const ShipmentTraceDetail = () => {
    const { awbno } = useParams()
    const navigate = useNavigate()
    const [shipmentTrace, setShipmentTrace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [expandedIndex, setExpandedIndex] = useState(0)

    const { apifunc: fetchDetailedTracking } = usePostApiCall()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()

    useEffect(() => {
        fetchTraceData()
    }, [awbno])

    const fetchTraceData = async () => {
        if (!awbno) {
            ErrorToaster("AWB number not found")
            navigate(-1)
            return
        }

        setLoading(true)
        try {
            const res = await fetchDetailedTracking(GET_IN_DETAILED_TRACKING, { awbno })
            if (res?.status === "success") {
                setShipmentTrace(res)
                setExpandedIndex(0)
            } else {
                ErrorToaster(res?.message || "Failed to fetch shipment details")
                navigate(-1)
            }
        } catch {
            ErrorToaster("Error fetching shipment details")
            navigate(-1)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async () => {
        if (!awbno) return

        setDownloading(true)
        try {
            const response = await axios.post(
                SHIPMENT_TRACE,
                { awbno_list: [awbno] },
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${awbno}-shipment-trace.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)

            SucceesToaster("File downloaded successfully")
        } catch (error) {
            ErrorToaster("Error downloading file")
            console.error(error)
        } finally {
            setDownloading(false)
        }
    }

    const booking = shipmentTrace?.booking_data
    const trackEvents = useMemo(() => {
        const tracking = shipmentTrace?.tracking
        if (!tracking) return []
        const entry = tracking[awbno] || tracking[Object.keys(tracking)[0]]
        return (entry?.track_data || [])
            .slice()
            .sort((a, b) => new Date(b.status_date) - new Date(a.status_date))
    }, [shipmentTrace, awbno])

    if (loading) {
        return (
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                <MainHeaderComp title="Shipment Trace Details" subTitle={`AWB: ${awbno}`} />
                <Loader message="Loading shipment trace…" fullscreen={false} />
            </div>
        )
    }

    if (!shipmentTrace) {
        return (
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                <MainHeaderComp title="Shipment Trace Details" subTitle={`AWB: ${awbno}`} />
                <div className="container-fluid relative z-10 px-4 pb-4">
                    <p className="m-0 rounded-xl border border-white/8 bg-white/2 px-4 py-12 text-center text-[13px] text-ink-muted">
                        No data found for AWB: {awbno}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Shipment Trace Details"
                subTitle={`AWB: ${awbno}`}
                extraFields={
                    <div className="flex gap-2">
                        <Button className="table-action-btn table-action-btn-ghost" onClick={() => navigate(-1)}>
                            ← Back
                        </Button>
                        <Button className="table-action-btn table-action-btn-export" onClick={handleDownload} disabled={downloading}>
                            {downloading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-download mr-2"></i>Download Excel
                                </>
                            )}
                        </Button>
                    </div>
                }
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                {/* Same "Shipment Details - AWB : ..." sub-heading TrackAWB shows */}
                <div className="mb-3 flex items-center gap-2 border-b border-white/8 pb-2 font-semibold text-ink" style={{ fontSize: 18 }}>
                    Shipment Details - AWB : {awbno}
                    {booking?.rto_approval === true && booking?.shipment_flag ? (
                        <span className="badge border border-success-500/30 bg-success-500/15 text-success-500">RTO Approved</span>
                    ) : (
                        <span className="badge border border-white/15 bg-white/5 text-ink-muted">Not RTO Approved</span>
                    )}
                </div>

                {/* Booking Info */}
                <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
                    <div className="card-header border-b border-white/8 bg-[#3B82F6]/12">
                        <h6 className="mb-0 font-bold text-ink">Booking Information</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-3">
                                <small className="text-ink-muted">Order ID</small>
                                <p className="mb-0 font-semibold">{booking?.orderid}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Product</small>
                                <p className="mb-0 font-semibold">{booking?.product}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Weight</small>
                                <p className="mb-0 font-semibold">{booking?.weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Pieces</small>
                                <p className="mb-0 font-semibold">{booking?.no_of_pieces}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Booked Date</small>
                                <p className="mb-0 font-semibold">{formatDate(booking?.booked_date || booking?.booking_date)}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Vol. Weight</small>
                                <p className="mb-0 font-semibold">{booking?.volumetric_weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Customer</small>
                                <p className="mb-0 font-semibold">{booking?.customer_name}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Multipiece Type</small>
                                <p className="mb-0"><span className="badge border border-[#3B82F6]/30 bg-[#3B82F6]/15 capitalize text-[#93C5FD]">{booking?.multipiece_type}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipper Details */}
                <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
                    <div className="card-header border-b border-white/8 bg-success-500/12">
                        <h6 className="mb-0 font-bold text-ink">Shipper Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-6">
                                <small className="text-ink-muted">Name</small>
                                <p className="mb-0 font-semibold">{booking?.shipper_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-ink-muted">Mobile</small>
                                <p className="mb-0 font-semibold">
                                    <a href={`tel:${booking?.shipper_mobile}`} className="no-underline">
                                        {booking?.shipper_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-ink-muted">Address</small>
                                <p className="mb-0">{booking?.shipper_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">City</small>
                                <p className="mb-0 font-semibold">{booking?.shipper_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">State</small>
                                <p className="mb-0 font-semibold">{booking?.shipper_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">Pincode</small>
                                <p className="mb-0 font-semibold">{booking?.shipper_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consignee Details */}
                <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
                    <div className="card-header border-b border-white/8 bg-danger-500/12">
                        <h6 className="mb-0 font-bold text-ink">Consignee Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-6">
                                <small className="text-ink-muted">Name</small>
                                <p className="mb-0 font-semibold">{booking?.consignee_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-ink-muted">Mobile</small>
                                <p className="mb-0 font-semibold">
                                    <a href={`tel:${booking?.consignee_mobile}`} className="no-underline">
                                        {booking?.consignee_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-ink-muted">Address</small>
                                <p className="mb-0">{booking?.consignee_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">City</small>
                                <p className="mb-0 font-semibold">{booking?.consignee_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">State</small>
                                <p className="mb-0 font-semibold">{booking?.consignee_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">Pincode</small>
                                <p className="mb-0 font-semibold">{booking?.consignee_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking History — click a status to see its bag movement chain */}
                <div className="overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
                    <div className="card-header border-b border-white/8 bg-canvas">
                        <h6 className="mb-0 font-semibold text-ink">Tracking History</h6>
                    </div>
                    <div className="card-body p-0">
                        <div className="scroll-slim" style={{ maxHeight: "600px", overflowY: "auto" }}>
                            {trackEvents.length === 0 && (
                                <div className="p-3 text-ink-muted">No tracking history available</div>
                            )}
                            {trackEvents.map((ele, index) => {
                                const open = expandedIndex === index
                                const bagTracking = ele.bag_data?.parent_bag_data?.bag_tracking || []
                                return (
                                    <div key={ele.id ?? index} className="border-b border-white/8">
                                        <div
                                            role="button"
                                            onClick={() => setExpandedIndex(open ? -1 : index)}
                                            className="flex items-center justify-between px-4 py-2"
                                            style={{ cursor: "pointer", backgroundColor: open ? ACCENT_TINT : undefined }}
                                        >
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="badge" style={{ backgroundColor: ACCENT_TINT, color: "#93C5FD" }}>{ele.status}</span>
                                                <span style={{ fontSize: 12 }} className="text-ink">{formatDateTime(ele.status_date)}</span>
                                                <span className="text-ink-muted" style={{ fontSize: 12, maxWidth: 220 }}>{ele.remarks}</span>
                                                <span className="text-ink-muted" style={{ fontSize: 12 }}>{ele.service_center || "-"} → {ele.destination_sc || "-"}</span>
                                                {ele.employee_name && <span className="text-ink-muted" style={{ fontSize: 12 }}>{ele.employee_name}</span>}
                                            </div>
                                            <ChevronDown size={16} className="text-ink-muted" style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
                                        </div>
                                        {open && <BagMovementChain bagTracking={bagTracking} />}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShipmentTraceDetail
