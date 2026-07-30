import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import { useState } from "react"
import usePostApiCall from "../../hooks/usePostApiCall"
import { GET_DOMESTIC_HISTORY_DETAILS, TRACK_AWB } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import EditEDD from "../../components/AWBTracking/EditEDD"
import { useNavigate } from "react-router-dom"


const TrackAWB = () => {
    const navigate = useNavigate()
    const [awbNumber, setAwbNumber] = useState("")
    const [shipmentDetails, setShipmentDetails] = useState({})
    const [shipementPices, setShipmentPieces] = useState([])
    const [trackingInfo, setTrackingInfo] = useState([])
    const [activeComponent, setActiveComponent] = useState("")

    // defining the api to get the awb details
    const { apifunc: getAwbDetails, data: awbDetails, error: awbDetailsError, loading: awbDetailsLoading } = usePostApiCall()
    // defining the api to get the track awb
    const { apifunc: trackAwb, data: trackAwbData, error: trackAwbError, loading: trackAwbLoading } = useGetApiCall()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    // calling the api to get the awb details
    const OngetAwbDetails = async () => {
        if (awbNumber) {
            // calling the api to get the awb details
            let res = await getAwbDetails(GET_DOMESTIC_HISTORY_DETAILS, { awbno: awbNumber })
            let trackRes = await trackAwb(`${TRACK_AWB}${awbNumber}/`)
            if (trackRes && trackRes.length > 0) {
                setTrackingInfo(trackRes)
            } else {
                setTrackingInfo([])
            }
            if (!res || res.length === 0) {
                setShipmentDetails(null);
                setShipmentPieces([]);
                return;
            }
            if (res?.status === "error") {
                setShipmentDetails(null);
                setShipmentPieces([]);
                ErrorToaster(res?.message || "Failed to fetch AWB details")
                return;
            }
            if (res) {
                // adding the total boxes key if its a parent
                const isParent = res.some(ele => ele?.multipiece_type === "parent");
                if (isParent) {
                    const totalBoxes = res.length;
                    res.forEach(ele => {
                        if (ele?.multipiece_type === "parent" || ele?.multipiece_type === "airwaybill" || ele?.multipiece_type === "thermalprinter") {
                            ele["Total Boxes"] = totalBoxes;
                        }
                    });
                }

                let details = res.find(ele => ele?.multipiece_type === "parent" || ele?.multipiece_type === "single");
                setShipmentDetails({ ...details, edd: trackRes[0]?.Parent[0]?.EDD } || {});
                let pieces = res.map((ele, index) => {
                    return {
                        piece_no: ele.piece_no || 0,
                        length: ele.length,
                        breadth: ele.breadth,
                        height: ele.height,
                        weight: ele.weight
                    }
                })
                setShipmentPieces(pieces || []);
            }

        }
    }

    // navigate to detail view
    const handleDetailView = () => {
        if (!awbNumber) {
            ErrorToaster("Please enter AWB number first")
            return
        }
        navigate(`/track-awb/${awbNumber}/details`)
    }

    const ReturnComponent = (title) => {
        let compObj = Components.find(ele => ele.title === title)
        if (compObj) {
            return compObj.component
        }
        return <></>
    }

    const Components = [
        {
            title: "edit_edd",
            component: <EditEDD
                shipmentDetails={shipmentDetails}
                isOpen={activeComponent === "edit_edd"}
                toggle={() => {
                    setActiveComponent("")
                }}
                onSuccess={(newEdd) => {
                    setShipmentDetails(prev => ({ ...prev, edd: newEdd }));
                }} />
        }
    ]


    return (
        <div className='container mt-2 py-0 px-0'>
            <MainHeaderComp
                title="Track AWB"
                extraFields={
                    (awbDetails && Object.keys(shipmentDetails).length > 0) &&
                    <button className="btn btn-primary" onClick={() => {
                        setActiveComponent("edit_edd")
                    }}>
                        Edit Estimated Delivery Date
                    </button>
                }
            />

            <div className="container-fluid px-3" style={{ height: "90vh", overflowY: "auto" }}>

                {/*  */}
                <div className=" mt-3 border-bottom w-100 d-flex pb-3 align-items-center justify-content-center">

                    <div className="d-flex align-items-center" style={{ width: "300px" }} >
                        <Input type="text" placeholder="Enter AWB Number" onChange={(e) => {
                            setAwbNumber(e.target.value)
                        }} />
                    </div>
                    <Button
                        className="bg-primary  ms-2"
                        onClick={OngetAwbDetails}
                        disabled={!awbNumber || awbDetailsLoading}
                    >
                        Track AWB
                    </Button>

                </div>
                {/* tracking info display */}
                {

                    awbDetailsLoading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>) :
                        shipmentDetails && shipementPices.length > 0 && (
                            <div>
                                <div className="row g-0">

                                    <div className="col-12 col-lg-4">
                                        <Section title="Shipment Overview">
                                            <Pair label="AWB No" value={shipmentDetails.awbno} />
                                            {/* <Pair label="Order Id" value={shipmentDetails.orderid} /> */}
                                            <Pair label="Origin" value={shipmentDetails.pick_city} />
                                            <Pair label="Destination" value={shipmentDetails.drop_city} />
                                            <Pair label="Pieces" value={shipementPices.length} />
                                            {/* <Pair label="Product Type" value={shipmentDetails.product_type} /> */}
                                            <Pair label="Content" value={shipmentDetails.product_description} />
                                            <Pair
                                                label="Actual Weight"
                                                value={`${shipementPices.reduce(
                                                    (sum, piece) => sum + (piece.weight || 0),
                                                    0
                                                )} KG`}
                                            />
                                            <Pair label="EDD" value={shipmentDetails.edd ? shipmentDetails.edd.slice(0, 10) : "-"} />
                                        </Section>
                                    </div>

                                    <div className="col-12 col-lg-4">
                                        <Section title="Shipper Details">
                                            <Pair label="Name" value={shipmentDetails.pick_name} />
                                            <Pair label="Mobile" value={shipmentDetails.pick_phoneno} />
                                            <Pair label="Email" value={shipmentDetails.pick_email} />
                                            <Pair label="City" value={shipmentDetails.pick_city} />
                                            <Pair label="State" value={shipmentDetails.pick_state} />
                                            <Pair label="Pincode" value={shipmentDetails.pick_pincode} />
                                            <Pair label="Address" value={shipmentDetails.pick_address} />
                                        </Section>
                                    </div>

                                    <div className="col-12 col-lg-4">
                                        <Section title="Consignee Details">
                                            <Pair label="Name" value={shipmentDetails.drop_name} />
                                            <Pair label="Mobile" value={shipmentDetails.drop_phoneno} />
                                            <Pair label="Email" value={shipmentDetails.drop_email} />
                                            <Pair label="City" value={shipmentDetails.drop_city} />
                                            <Pair label="State" value={shipmentDetails.drop_state} />
                                            <Pair label="Pincode" value={shipmentDetails.drop_pincode} />
                                            <Pair label="Address" value={shipmentDetails.drop_address} />
                                        </Section>
                                    </div>
                                </div>

                                {/* Second Row */}
                                <div className="row g-0">

                                    <div className="col-12 col-md-6">
                                        <Section title="Document & Invoice Info">
                                            <Pair label="Document Type" value="GSTIN (Normal)" />
                                            <Pair label="Document Number" value={shipmentDetails.customer_code} />
                                            <Pair
                                                label="Invoice Date"
                                                value={shipmentDetails.pickup_date?.slice(0, 10)}
                                            />
                                            <Pair label="Shipment Value" value={shipmentDetails.shipment_value} />
                                        </Section>
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <div className="border h-100">
                                            <div className="bg-light px-3 py-2 border-bottom">
                                                <h6 className="fw-semibold text-secondary mb-0">
                                                    Shipment Pieces
                                                </h6>
                                            </div>

                                            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                                                <table className="table table-bordered table-sm mb-0">
                                                    <thead className="table-light sticky-top">
                                                        <tr>
                                                            <th>Piece No</th>
                                                            <th>Length (CM)</th>
                                                            <th>Breadth (CM)</th>
                                                            <th>Height (CM)</th>
                                                            <th>Weight (KG)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {shipementPices?.map((piece, index) => (
                                                            <tr key={index}>
                                                                <td>{index + 1}</td>
                                                                <td>{piece.length}</td>
                                                                <td>{piece.breadth}</td>
                                                                <td>{piece.height}</td>
                                                                <td>{piece.weight}</td>
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

                {/* tracking */}

                <div className="d-flex justify-content-between align-items-center ">
                    <div className="mb-5 mt-3  m-auto" style={{ marginBottom: "120px" }}>
                        {trackingInfo[0]?.Child?.filter(
                            (item) => item.awbno === shipmentDetails.awbno
                        )?.map((item, index, filteredArray) => {
                            return (
                                <div className="position-relative py-4" key={index}>
                                    <div className="d-flex px-2">

                                        {/* Left Section (Status Code + Date) */}
                                        <div>
                                            <div className="ps-3 d-flex flex-column align-items-center justify-content-center gap-2">
                                                <div
                                                    className="bg-primary text-white text-center fw-semibold rounded-pill py-1"
                                                    style={{ width: "48px", fontSize: "14px" }}
                                                >
                                                    {item.Statuscode}
                                                </div>

                                                <p className="text-muted fw-semibold mb-0" style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                                                    {item.Statusdate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Timeline Dot & Line */}
                                        <div className="d-flex flex-column align-items-center mx-4 position-relative">

                                            {/* Dot */}
                                            <div
                                                className="bg-primary rounded-circle border border-4"
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderColor: "#cfe2ff",
                                                    zIndex: 10
                                                }}
                                            ></div>

                                            {/* Line (Except Last Item) */}
                                            {index < filteredArray.length - 1 && (
                                                <div
                                                    className="position-absolute"
                                                    style={{
                                                        top: "28px",
                                                        width: "2px",
                                                        height: "110px",
                                                        backgroundColor: "rgba(13,110,253,0.4)"
                                                    }}
                                                ></div>
                                            )}
                                        </div>

                                        {/* Right Section (Details) */}
                                        <div className="ps-3">
                                            <div className="text-secondary fw-medium" style={{ fontSize: "14px" }}>
                                                {item.Remarks?.toUpperCase()}
                                            </div>

                                            <p className="text-muted fw-medium mb-1" style={{ fontSize: "15px" }}>
                                                {item.Location}
                                            </p>

                                            <p className="text-muted fw-medium mb-0" style={{ fontSize: "13px" }}>
                                                Time : {item.Statustime}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {
                // Example of rendering the EditEDD component based on some condition
                // You can replace this with your actual condition to show/hide the component
                ReturnComponent("edit_edd")
            }

            {/* Floating Detail View Button */}
            {shipmentDetails && Object.keys(shipmentDetails).length > 0 && (
                <button
                    className="btn btn-info btn-lg rounded-circle position-fixed"
                    style={{
                        bottom: "30px",
                        right: "30px",
                        width: "60px",
                        height: "60px",
                        zIndex: 1000,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                    }}
                    onClick={handleDetailView}
                    title="View Detailed Shipment Trace"
                >
                    <i className="bx bx-detail" style={{ fontSize: "24px" }}></i>
                </button>
            )}
        </div>
    )
}
export default TrackAWB

const Section = ({ title, children }) => (
    <div className="border h-100">
        {/* Header */}
        <div className="bg-light px-3 py-2 border-bottom">
            <h6 className="fw-semibold text-secondary mb-0">
                {title}
            </h6>
        </div>

        {/* Content */}
        <div className="p-3">
            <div className="row row-cols-2 g-3">
                {children}
            </div>
        </div>
    </div>
);


const Pair = ({ label, value }) => (
    <div className="col">
        <div className="fw-semibold text-dark  text-break">
            {value || "-"}
        </div>
        <div className="text-muted ">
            {label}
        </div>
    </div>
);
