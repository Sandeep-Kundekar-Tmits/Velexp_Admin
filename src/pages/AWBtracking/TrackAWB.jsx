import { Button, Input, Label } from "@/components/ui"
import { CalendarClock, FileSearch } from "lucide-react"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
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
                setShipmentDetails({ ...details, edd: trackRes?.[0]?.Parent?.[0]?.EDD } || {});
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
        /* page-content, not `container`: this was the only screen using the
           fixed-width container, so it sat narrower than every other page and
           its gutters did not line up with the header above it. */
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Track AWB"
                subTitle="Look up a shipment's checkpoints and pieces."
                extraFields={
                    (awbDetails && shipmentDetails && Object.keys(shipmentDetails).length > 0) &&
                    <div className="flex items-center gap-2">
                        <Button
                            className="table-action-btn table-action-btn-ghost"
                            onClick={() => setActiveComponent("edit_edd")}
                        >
                            <CalendarClock aria-hidden="true" size={15} />
                            Edit Estimated Delivery Date
                        </Button>
                        {/* The route out of this screen, so it is the primary
                            action and it is labelled. It was a 60px circular
                            icon-only FAB pinned to the bottom-right corner with
                            only a title attribute -- the one thing this page
                            navigates to, and nothing said so. */}
                        <Button
                            className="table-action-btn table-action-btn-primary"
                            onClick={handleDetailView}
                        >
                            <FileSearch aria-hidden="true" size={15} />
                            View Full Trace
                        </Button>
                    </div>
                }
            />

            {/* No height:90vh with its own scrollbar: that nested a second
                scroll region inside the layout's, so the page and the panel
                scrolled against each other. The layout's box already scrolls. */}
            <div className="container-fluid relative z-10 px-4 pb-4">

                {/* Search row, left-aligned like every other filter row on the
                    app rather than centred on its own. */}
                <div className="filter-row">
                    <div className="filter-group">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label className="form-label m-0 font-bold text-ink-muted">
                                AWB Number
                            </Label>
                            <Input
                                type="text"
                                placeholder="Enter AWB Number"
                                onChange={(e) => setAwbNumber(e.target.value)}
                            />
                        </div>
                        <Button
                            className="table-action-btn table-action-btn-primary"
                            onClick={OngetAwbDetails}
                            disabled={!awbNumber || awbDetailsLoading}
                        >
                            Track AWB
                        </Button>
                    </div>
                </div>

                {/* tracking info display */}
                {

                    awbDetailsLoading ? (
                        /* The shared loader: .spinner-border has no definition
                           left in the compat layer, so this showed nothing at
                           all while the lookup was running. */
                        <Loader message="Tracking shipment…" fullscreen={false} />
                    ) :
                        shipmentDetails && shipementPices.length > 0 && (
                            <div className="mt-4">
                                <div className="row gap-y-3">

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
                                <div className="row mt-3 gap-y-3">

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
                                        {/* Same panel as Section beside it, so
                                            the two halves of the row match. */}
                                        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
                                            <div className="border-b border-white/8 px-4 py-2.5">
                                                <h6 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                                    Shipment Pieces
                                                </h6>
                                            </div>

                                            <div className="scroll-slim" style={{ maxHeight: "250px", overflowY: "auto" }}>
                                                {/* table-bordered dropped: a
                                                    boxed grid inside a glass
                                                    panel drew two frames. */}
                                                <table className="table table-sm mb-0">
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

                <div className="flex justify-between items-center ">
                    <div className="mb-12 mt-4  m-auto" style={{ marginBottom: "120px" }}>
                        {trackingInfo[0]?.Child?.filter(
                            (item) => item.awbno === shipmentDetails.awbno
                        )?.map((item, index, filteredArray) => {
                            return (
                                <div className="relative py-6" key={index}>
                                    <div className="flex px-2">

                                        {/* Left Section (Status Code + Date) */}
                                        <div>
                                            <div className="pl-4 flex flex-col items-center justify-center gap-2">
                                                <div
                                                    className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/15 py-1 text-center font-semibold text-[#93C5FD]"
                                                    style={{ width: "48px", fontSize: "14px" }}
                                                >
                                                    {item.Statuscode}
                                                </div>

                                                <p className="text-ink-muted font-semibold mb-0" style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
                                                    {item.Statusdate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Timeline Dot & Line */}
                                        <div className="flex flex-col items-center mx-6 relative">

                                            {/* Dot. #cfe2ff and rgba(13,110,253)
                                                below were Bootstrap's blues,
                                                not the palette's -- the ring
                                                read as a pale halo on the dark
                                                canvas. */}
                                            <div
                                                className="rounded-full border-4 border-[#3B82F6]/25 bg-[#3B82F6] shadow-[0_0_18px_-4px_rgba(59,130,246,0.9)]"
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    zIndex: 10
                                                }}
                                            ></div>

                                            {/* Line (Except Last Item) */}
                                            {index < filteredArray.length - 1 && (
                                                <div
                                                    className="absolute bg-[#3B82F6]/35"
                                                    style={{
                                                        top: "28px",
                                                        width: "2px",
                                                        height: "110px",
                                                    }}
                                                ></div>
                                            )}
                                        </div>

                                        {/* Right Section (Details) */}
                                        <div className="pl-4">
                                            <div className="text-ink-muted font-medium" style={{ fontSize: "14px" }}>
                                                {item.Remarks?.toUpperCase()}
                                            </div>

                                            <p className="text-ink-muted font-medium mb-1" style={{ fontSize: "15px" }}>
                                                {item.Location}
                                            </p>

                                            <p className="text-ink-muted font-medium mb-0" style={{ fontSize: "13px" }}>
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

        </div>
    )
}
export default TrackAWB

/*
 * A block of shipment facts.
 *
 * Was `<div className="border">` -- Tailwind v4's preflight leaves the default
 * border-color at currentColor, so that drew a full-strength ink-coloured box
 * rather than the hairline it was after. Now the same glass panel as the rest
 * of the app.
 */
const Section = ({ title, children }) => (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-white/8 px-4 py-2.5">
            <h6 className="m-0 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                {title}
            </h6>
        </div>

        {/* Content.
            A real two-column grid: this was `row row-cols-2`, and row-cols-*
            is one of the Bootstrap classes the compat layer never defined --
            so every Pair fell back to `.col { flex: 1 0 0% }` and the seven
            facts were squeezed onto a single line. */}
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 p-4">
            {children}
        </dl>
    </div>
);


/* Value above label, so the eye runs down the values -- these are read for the
   data, not for the field names. */
const Pair = ({ label, value }) => (
    <div className="min-w-0">
        <dd className="m-0 break-words text-[13px] font-semibold text-ink">
            {value || "-"}
        </dd>
        <dt className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {label}
        </dt>
    </div>
);
