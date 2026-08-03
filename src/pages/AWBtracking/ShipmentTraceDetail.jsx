import { Button, Spinner } from "@/components/ui"
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
                <div className="flex justify-center items-center" style={{ height: "60vh" }}>
                    <Spinner color="primary" />
                </div>
            </div>
        )
    }

    if (!shipmentTrace) {
        return (
            <div className="page-content">
                <MainHeaderComp title="Shipment Trace Details" />
                <div className="alert alert-danger m-4">
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
                    <div className="flex gap-2">
                        <Button color="secondary" outline onClick={() => navigate(-1)}>
                            ← Back
                        </Button>
                        <Button color="success" onClick={handleDownload} disabled={downloading}>
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

            <div className="container-fluid px-4 py-6">
                {/* Booking Info */}
                <div className="card mb-6">
                    <div className="card-header bg-brand-500 bg-opacity-10 border-0">
                        <h6 className="mb-0 font-bold text-ink">Booking Information</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-3">
                                <small className="text-ink-muted">Order ID</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.orderid}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Product</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.product}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Weight</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Pieces</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.no_of_pieces}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Booked Date</small>
                                <p className="mb-0 font-semibold">{formatDate(shipmentTrace.booking?.booked_date)}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Vol. Weight</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.volumetric_weight} kg</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Customer</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.customer_name}</p>
                            </div>
                            <div className="col-md-3">
                                <small className="text-ink-muted">Multipiece Type</small>
                                <p className="mb-0"><span className="badge bg-info capitalize">{shipmentTrace.booking?.multipiece_type}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipper Details */}
                <div className="card mb-6">
                    <div className="card-header bg-success-500 bg-opacity-10 border-0">
                        <h6 className="mb-0 font-bold text-ink">Shipper Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-6">
                                <small className="text-ink-muted">Name</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.shipper_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-ink-muted">Mobile</small>
                                <p className="mb-0 font-semibold">
                                    <a href={`tel:${shipmentTrace.booking?.shipper_mobile}`} className="no-underline">
                                        {shipmentTrace.booking?.shipper_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-ink-muted">Address</small>
                                <p className="mb-0">{shipmentTrace.booking?.shipper_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">City</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.shipper_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">State</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.shipper_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">Pincode</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.shipper_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Consignee Details */}
                <div className="card mb-6">
                    <div className="card-header bg-danger-500 bg-opacity-10 border-0">
                        <h6 className="mb-0 font-bold text-ink">Consignee Details</h6>
                    </div>
                    <div className="card-body">
                        <div className="row gap-4">
                            <div className="col-md-6">
                                <small className="text-ink-muted">Name</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.consignee_name}</p>
                            </div>
                            <div className="col-md-6">
                                <small className="text-ink-muted">Mobile</small>
                                <p className="mb-0 font-semibold">
                                    <a href={`tel:${shipmentTrace.booking?.consignee_mobile}`} className="no-underline">
                                        {shipmentTrace.booking?.consignee_mobile}
                                    </a>
                                </p>
                            </div>
                            <div className="col-12">
                                <small className="text-ink-muted">Address</small>
                                <p className="mb-0">{shipmentTrace.booking?.consignee_address}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">City</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.consignee_city}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">State</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.consignee_state}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-ink-muted">Pincode</small>
                                <p className="mb-0 font-semibold">{shipmentTrace.booking?.consignee_pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tracking History */}
                <div className="card">
                    <div className="card-header bg-canvas">
                        <h6 className="mb-0 font-semibold">Tracking History</h6>
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
                                                <span className="badge bg-brand-500">{piece.status}</span>
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
