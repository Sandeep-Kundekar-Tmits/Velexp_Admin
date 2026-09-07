import { Button, Spinner } from "reactstrap"
import { ChevronDown } from "lucide-react"
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

// Same blue/green/orange scheme as the OPS tracking screen, and the blue used for its status pills
const OPS_COLORS = {
    blue: { bg: "#eff6ff", text: "#2563eb" },
    green: { bg: "#f0fdf4", text: "#16a34a" },
    orange: { bg: "#fff7ed", text: "#ea580c" },
}
const OPS_BLUE_600 = "#2563eb"

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

// Chain of bag hops (bag -> manifest -> vehicle/driver) linked to one tracking status
const BagMovementChain = ({ bagTracking = [] }) => {
    if (bagTracking.length === 0) {
        return <div className="text-muted small py-2 ps-2">Bag details not available for this status</div>
    }
    return (
        <div className="d-flex flex-column gap-2 ps-2 pt-2">
            {bagTracking.map((bag, i) => (
                <div key={bag.id ?? i} className="d-flex align-items-stretch gap-2">
                    <div className="d-flex flex-column align-items-center">
                        <div className="rounded-circle" style={{ width: 10, height: 10, marginTop: 6, backgroundColor: OPS_BLUE_600 }} />
                        {i < bagTracking.length - 1 && <div style={{ width: 2, flex: 1, background: "#93c5fd" }} />}
                    </div>
                    <div className="border rounded p-2 flex-fill row row-cols-2 row-cols-md-4 g-2" style={{ fontSize: 13 }}>
                        <div><span className="fw-semibold">Bag No:</span> {bag.bag_no || "-"}</div>
                        <div><span className="fw-semibold">Manifest:</span> {bag.bag_manifest_no || "-"}</div>
                        <div><span className="fw-semibold">Status:</span> {bag.status || "-"} {bag.remark ? `(${bag.remark})` : ""}</div>
                        <div><span className="fw-semibold">Current SC:</span> {bag.current_service_center || "-"}</div>
                        <div><span className="fw-semibold">Source:</span> {bag.source_service_center || "-"}</div>
                        <div><span className="fw-semibold">Destination:</span> {bag.destination_service_center || "-"}</div>
                        <div><span className="fw-semibold">Vehicle No:</span> {bag.vehicle_no || "-"}</div>
                        <div><span className="fw-semibold">Driver:</span> {bag.driver_name || "-"} {bag.driver_mobile ? `(${bag.driver_mobile})` : ""}</div>
                        <div className="col-12 text-muted"><span className="fw-semibold">Updated:</span> {formatDateTime(bag.created_at)}</div>
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
            <div className="page-content">
                <MainHeaderComp title="Shipment Trace Details" />
                <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                    <Spinner color="primary" />
                </div>
            </div>
        )
    }

    if (!shipmentTrace) {
        return (
            <div className="page-content">
                <MainHeaderComp title="Shipment Trace Details" />
                <div className="alert alert-danger m-3">
                    No data found for AWB: {awbno}
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <MainHeaderComp
                title="Shipment Trace Details"
                subTitle={`AWB: ${awbno}`}
                extraFields={
                    <div className="d-flex gap-2">
                        <Button color="secondary" outline onClick={() => navigate(-1)}>
                            ← Back
                        </Button>
                        <Button color="success" onClick={handleDownload} disabled={downloading}>
                            {downloading ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-download me-2"></i>Download Excel
                                </>
                            )}
                        </Button>
                    </div>
                }
            />

            <div className="container-fluid px-3 py-4">
                {/* Same "Shipment Details - AWB : ..." sub-heading OPS shows on its detailed view */}
                <div className="d-flex align-items-center gap-2 border-top border-bottom py-2 mb-3 fw-semibold" style={{ fontSize: 18 }}>
                    Shipment Details - AWB : {awbno}
                    {booking?.rto_approval === true && booking?.shipment_flag ? (
                        <span className="badge" style={{ backgroundColor: OPS_COLORS.green.text }}>RTO Approved</span>
                    ) : (
                        <span className="badge bg-secondary">Not RTO Approved</span>
                    )}
                </div>

                {/* Booking Info */}
                <div className="card mb-4">
                    <div className="card-header border-0" style={{ backgroundColor: OPS_COLORS.blue.bg }}>
                        <h6 className="mb-0 fw-bold" style={{ color: OPS_COLORS.blue.text }}>Booking Information</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <small className="text-muted">Order ID</small>
                                <p className="mb-0 fw-semibold">{booking?.orderid}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Product</small>
                                <p className="mb-0 fw-semibold">{booking?.product}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Weight</small>
                                <p className="mb-0 fw-semibold">{booking?.weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Pieces</small>
                                <p className="mb-0 fw-semibold">{booking?.no_of_pieces}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Booked Date</small>
                                <p className="mb-0 fw-semibold">{formatDate(booking?.booked_date || booking?.booking_date)}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Vol. Weight</small>
                                <p className="mb-0 fw-semibold">{booking?.volumetric_weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Customer</small>
                                <p className="mb-0 fw-semibold">{booking?.customer_name}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Multipiece Type</small>
                                <p className="mb-0"><span className="badge bg-info text-capitalize">{booking?.multipiece_type}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipper Details */}
                <div className="card mb-4">
                    <div className="card-header border-0" style={{ backgroundColor: OPS_COLORS.green.bg }}>
                        <h6 className="mb-0 fw-bold" style={{ color: OPS_COLORS.green.text }}>Shipper Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <small className="text-muted">Name</small>
                                <p className="mb-0 fw-semibold">{booking?.shipper_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-muted">Mobile</small>
                                <p className="mb-0 fw-semibold">
                                    <a href={`tel:${booking?.shipper_mobile}`} className="text-decoration-none">
                                        {booking?.shipper_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-muted">Address</small>
                                <p className="mb-0">{booking?.shipper_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">City</small>
                                <p className="mb-0 fw-semibold">{booking?.shipper_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">State</small>
                                <p className="mb-0 fw-semibold">{booking?.shipper_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">Pincode</small>
                                <p className="mb-0 fw-semibold">{booking?.shipper_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consignee Details */}
                <div className="card mb-4">
                    <div className="card-header border-0" style={{ backgroundColor: OPS_COLORS.orange.bg }}>
                        <h6 className="mb-0 fw-bold" style={{ color: OPS_COLORS.orange.text }}>Consignee Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <small className="text-muted">Name</small>
                                <p className="mb-0 fw-semibold">{booking?.consignee_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-muted">Mobile</small>
                                <p className="mb-0 fw-semibold">
                                    <a href={`tel:${booking?.consignee_mobile}`} className="text-decoration-none">
                                        {booking?.consignee_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-muted">Address</small>
                                <p className="mb-0">{booking?.consignee_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">City</small>
                                <p className="mb-0 fw-semibold">{booking?.consignee_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">State</small>
                                <p className="mb-0 fw-semibold">{booking?.consignee_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">Pincode</small>
                                <p className="mb-0 fw-semibold">{booking?.consignee_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking History — click a status to see its bag movement chain */}
                <div className="card">
                    <div className="card-header bg-light">
                        <h6 className="mb-0 fw-semibold">Tracking History</h6>
                    </div>
                    <div className="card-body p-0">
                        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                            {trackEvents.length === 0 && (
                                <div className="p-3 text-muted">No tracking history available</div>
                            )}
                            {trackEvents.map((ele, index) => {
                                const open = expandedIndex === index
                                const bagTracking = ele.bag_data?.parent_bag_data?.bag_tracking || []
                                return (
                                    <div key={ele.id ?? index} className="border-bottom">
                                        <div
                                            role="button"
                                            onClick={() => setExpandedIndex(open ? -1 : index)}
                                            className="d-flex align-items-center justify-content-between px-3 py-2"
                                            style={{ cursor: "pointer", backgroundColor: open ? OPS_COLORS.blue.bg : undefined }}
                                        >
                                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                                <span className="badge" style={{ backgroundColor: OPS_BLUE_600 }}>{ele.status}</span>
                                                <span className="small" style={{ fontSize: 12 }}>{formatDateTime(ele.status_date)}</span>
                                                <span className="text-muted text-break" style={{ fontSize: 12, maxWidth: 220 }}>{ele.remarks}</span>
                                                <span className="text-muted" style={{ fontSize: 12 }}>{ele.service_center || "-"} → {ele.destination_sc || "-"}</span>
                                                {ele.employee_name && <span className="text-muted" style={{ fontSize: 12 }}>{ele.employee_name}</span>}
                                            </div>
                                            <ChevronDown size={16} style={{ transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }} />
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
