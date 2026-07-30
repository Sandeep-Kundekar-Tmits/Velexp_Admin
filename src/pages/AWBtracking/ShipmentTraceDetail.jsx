import { Button, Spinner } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import { useState, useEffect } from "react"
import usePostApiCall from "../../hooks/usePostApiCall"
import { SHIPMENT_TRACE } from "../../api"
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

const ShipmentTraceDetail = () => {
    const { awbno } = useParams()
    const navigate = useNavigate()
    const [shipmentTrace, setShipmentTrace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    const { apifunc: fetchShipmentTrace } = usePostApiCall()
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
            const res = await fetchShipmentTrace(SHIPMENT_TRACE, { awbno: awbno })
            if (res?.status === "success") {
                setShipmentTrace(res)
            } else {
                ErrorToaster(res?.message || "Failed to fetch shipment details")
                navigate(-1)
            }
        } catch (error) {
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

            // Create blob and download
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
                {/* Booking Info */}
                <div className="card mb-4">
                    <div className="card-header bg-primary bg-opacity-10 border-0">
                        <h6 className="mb-0 fw-bold text-dark">Booking Information</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3">
                                <small className="text-muted">Order ID</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.orderid}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Product</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.product}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Weight</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Pieces</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.no_of_pieces}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Booked Date</small>
                                <p className="mb-0 fw-semibold">{formatDate(shipmentTrace.booking?.booked_date)}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Vol. Weight</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.volumetric_weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Customer</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.customer_name}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-muted">Multipiece Type</small>
                                <p className="mb-0"><span className="badge bg-info text-capitalize">{shipmentTrace.booking?.multipiece_type}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipper Details */}
                <div className="card mb-4">
                    <div className="card-header bg-success bg-opacity-10 border-0">
                        <h6 className="mb-0 fw-bold text-dark">Shipper Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <small className="text-muted">Name</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.shipper_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-muted">Mobile</small>
                                <p className="mb-0 fw-semibold">
                                    <a href={`tel:${shipmentTrace.booking?.shipper_mobile}`} className="text-decoration-none">
                                        {shipmentTrace.booking?.shipper_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-muted">Address</small>
                                <p className="mb-0">{shipmentTrace.booking?.shipper_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">City</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.shipper_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">State</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.shipper_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">Pincode</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.shipper_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consignee Details */}
                <div className="card mb-4">
                    <div className="card-header bg-danger bg-opacity-10 border-0">
                        <h6 className="mb-0 fw-bold text-dark">Consignee Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <small className="text-muted">Name</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.consignee_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-muted">Mobile</small>
                                <p className="mb-0 fw-semibold">
                                    <a href={`tel:${shipmentTrace.booking?.consignee_mobile}`} className="text-decoration-none">
                                        {shipmentTrace.booking?.consignee_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-muted">Address</small>
                                <p className="mb-0">{shipmentTrace.booking?.consignee_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">City</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.consignee_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">State</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.consignee_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">Pincode</small>
                                <p className="mb-0 fw-semibold">{shipmentTrace.booking?.consignee_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking History */}
                <div className="card">
                    <div className="card-header bg-light">
                        <h6 className="mb-0 fw-semibold">Tracking History</h6>
                    </div>
                    <div className="card-body p-0">
                        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                            <table className="table table-bordered table-hover table-sm mb-0">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        <th>Status</th>
                                        <th>Date & Time</th>
                                        <th>Remarks</th>
                                        <th>Service Center</th>
                                        <th>Destination SC</th>
                                        <th>Employee</th>
                                        <th>Bag No</th>
                                        <th>Manifest</th>
                                        <th>Vehicle</th>
                                        <th>Driver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipmentTrace.pieces?.[awbno]?.map((piece, index) => (
                                        <tr key={index}>
                                            <td>
                                                <span className="badge bg-primary">{piece.status}</span>
                                            </td>
                                            <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                                                {formatDateTime(piece.status_date)}
                                            </td>
                                            <td style={{ fontSize: "12px", maxWidth: "150px" }} className="text-break">
                                                {piece.remarks}
                                            </td>
                                            <td>{piece.service_center || "-"}</td>
                                            <td>{piece.destination_sc || "-"}</td>
                                            <td>{piece.employee_name || "-"}</td>
                                            <td>{piece.bag_no || "-"}</td>
                                            <td>{piece.manifest_no || "-"}</td>
                                            <td>{piece.vehicle_no || "-"}</td>
                                            <td>{piece.driver_name || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShipmentTraceDetail
