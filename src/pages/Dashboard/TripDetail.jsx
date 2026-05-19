import { Button, Col, FormGroup, Input, Label, Row, Card, CardBody, CardTitle, Badge } from "reactstrap";
import MainHeaderComp from "../../components/MainHeaderCom";
import { GridLoader } from "react-spinners";
import { useEffect, useMemo, useState } from "react";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { TRIP_ODOMETER_TRIPS, TRIP_ODOMETER_READINGS } from "../../api";
import SimpleModal from "../../components/SimpleModal";
import { Modal, ModalHeader, ModalBody, ModalFooter, Form } from "reactstrap";

const TripDetail = () => {
    const [tripsData, setTripsData] = useState([]);
    const [dayTotalDistance, setDayTotalDistance] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [SelectedImgSrc, setSelectedImgSrc] = useState(null);
    
    const getImageSrc = (src) => {
        if (!src) return "";
        let imgUrl = src;
        if (imgUrl.includes("/media/")) {
            imgUrl = imgUrl.substring(imgUrl.indexOf("/media/"));
        } else if (window.location.protocol === "https:" && imgUrl.startsWith("http://")) {
            imgUrl = imgUrl.replace("http://", "https://");
        }
        return imgUrl;
    };
    
    const [employeeCode, setEmployeeCode] = useState("");
    const [tripDate, setTripDate] = useState("");
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        employee_code: "",
        employee_name: "",
        vehicle_number: "",
        trip_date: "",
        info_type: "START",
        odometer_reading: "",
        latitude: "",
        longitude: "",
        trip_number: "",
        notes: "",
        odometer_image: null
    });

    const { apifunc: getTrips, data: tripsApiData, loading: tripsLoading } = useGetApiCall();
    const { apifunc: postTripReading, loading: isUploading } = usePostApiCall(null, "Reading uploaded successfully");

    const handleUploadChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "odometer_image") {
            setUploadForm({ ...uploadForm, [name]: files[0] });
        } else {
            setUploadForm({ ...uploadForm, [name]: value });
        }
    };

    const handleDownloadImage = async () => {
        if (!SelectedImgSrc) return;
        try {
            const response = await fetch(SelectedImgSrc);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Try to extract original filename or fall back to standard naming
            let filename = `Odometer_Image_${new Date().getTime()}.jpg`;
            try {
                const urlObj = new URL(SelectedImgSrc, window.location.origin);
                const pathParts = urlObj.pathname.split("/");
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart.includes(".")) {
                    filename = lastPart;
                }
            } catch (e) {
                // Keep default filename
            }

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
            
            // Absolute fallback: if fetch fails, try downloading directly without target="_blank"
            const link = document.createElement("a");
            link.href = SelectedImgSrc;
            link.download = `Odometer_Image_${new Date().getTime()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleUploadSubmit = async () => {
        if (!uploadForm.employee_code || !uploadForm.info_type || !uploadForm.odometer_reading || !uploadForm.trip_date) {
            alert("Please fill all required fields (Employee Code, Info Type, Trip Date, Odometer Reading)");
            return;
        }
        
        const formData = new FormData();
        Object.keys(uploadForm).forEach(key => {
            if (uploadForm[key] !== null && uploadForm[key] !== "") {
                formData.append(key, uploadForm[key]);
            }
        });

        const res = await postTripReading(TRIP_ODOMETER_READINGS, formData, true);
        if (res && !res.error) { 
            setIsUploadModalOpen(false);
            setUploadForm({
                employee_code: "", employee_name: "", vehicle_number: "", trip_date: "", info_type: "START", odometer_reading: "", latitude: "", longitude: "", trip_number: "", notes: "", odometer_image: null
            });
            if (employeeCode && tripDate) {
                 onGetData();
            }
        }
    };

    const onInputChange = (name, e) => {
        if (name === "employeeCode") {
            setEmployeeCode(e.target.value);
        } else if (name === "tripDate") {
            setTripDate(e.target.value);
        }
    };

    const onGetData = () => {
        if (!employeeCode) {
            alert("Enter Employee Code");
            return;
        }
        if (!tripDate) {
            alert("Select a Trip Date");
            return;
        }
        
        getTrips(`${TRIP_ODOMETER_TRIPS}?employee_code=${employeeCode}&trip_date=${tripDate}`);
    };

    useEffect(() => {
        if (tripsApiData) {
            if (tripsApiData.status === "success" && tripsApiData.data) {
                setTripsData(tripsApiData.data.trips || []);
                setDayTotalDistance(tripsApiData.data.total_distance_km || 0);
            } else {
                setTripsData(tripsApiData.trips || tripsApiData.data || []);
                setDayTotalDistance(tripsApiData.total_distance_km || 0);
            }
        }
    }, [tripsApiData]);

    const columns = useMemo(
        () => [
            {
                header: "Trip No",
                accessorKey: "trip_number",
                enableSorting: true,
                enableColumnFilter: false,
                size: 80,
                cell: ({ row }) => (
                    <Badge color="primary" className="px-2 py-1">
                        Trip {row.original.trip_number || row.original.start?.trip_number || row.original.end?.trip_number}
                    </Badge>
                ),
            },
            {
                header: "Vehicle",
                accessorKey: "vehicle_number",
                enableSorting: true,
                enableColumnFilter: false,
                size: 120,
                cell: ({ row }) => row.original.start?.vehicle_number || row.original.end?.vehicle_number || "-",
            },
            {
                header: "Start Time",
                accessorKey: "start_time",
                enableSorting: false,
                enableColumnFilter: false,
                size: 150,
                cell: ({ row }) => row.original.start?.trip_date 
                    ? new Date(row.original.start.trip_date).toLocaleTimeString() 
                    : "-",
            },
            {
                header: "Start Reading",
                accessorKey: "start_reading_val",
                enableSorting: false,
                enableColumnFilter: false,
                size: 120,
                cell: ({ row }) => row.original.start?.odometer_reading || "-",
            },
            {
                header: "Start Image",
                accessorKey: "start_image",
                enableSorting: false,
                enableColumnFilter: false,
                size: 100,
                cell: ({ row }) => 
                    row.original.start?.odometer_image ? (
                        <button
                            className="px-2 py-1 rounded bg-light border-0 text-primary"
                            onClick={() => {
                                setSelectedImgSrc(getImageSrc(row.original.start.odometer_image));
                                setIsModalOpen(true);
                            }}
                        >
                            View
                        </button>
                    ) : (
                        <span className="text-muted">No Image</span>
                    ),
            },
            {
                header: "End Time",
                accessorKey: "end_time",
                enableSorting: false,
                enableColumnFilter: false,
                size: 150,
                cell: ({ row }) => row.original.end?.trip_date 
                    ? new Date(row.original.end.trip_date).toLocaleTimeString() 
                    : "-",
            },
            {
                header: "End Reading",
                accessorKey: "end_reading_val",
                enableSorting: false,
                enableColumnFilter: false,
                size: 120,
                cell: ({ row }) => row.original.end?.odometer_reading || "-",
            },
            {
                header: "End Image",
                accessorKey: "end_image",
                enableSorting: false,
                enableColumnFilter: false,
                size: 100,
                cell: ({ row }) => 
                    row.original.end?.odometer_image ? (
                        <button
                            className="px-2 py-1 rounded bg-light border-0 text-primary"
                            onClick={() => {
                                setSelectedImgSrc(getImageSrc(row.original.end.odometer_image));
                                setIsModalOpen(true);
                            }}
                        >
                            View
                        </button>
                    ) : (
                        <span className="text-muted">No Image</span>
                    ),
            },
            {
                header: "Distance (km)",
                accessorKey: "distance",
                enableSorting: false,
                enableColumnFilter: false,
                size: 120,
                cell: ({ row }) => (
                    <span className="fw-bold text-success">
                        {row.original.distance_km || "-"}
                    </span>
                ),
            },
        ],
        []
    );

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white sticky-top" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="Ops Trip Details" />
            </div>
            
            <div className="container-fluid px-3 mt-4">
                <Card>
                    <CardBody>
                        <Row className="align-items-end">
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label>Employee Code <span className="text-danger">*</span></Label>
                                    <Input 
                                        type="text" 
                                        value={employeeCode} 
                                        placeholder="e.g. EMP123" 
                                        onChange={(e) => onInputChange("employeeCode", e)} 
                                        style={{ height: "39px" }} 
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label>Trip Date <span className="text-danger">*</span></Label>
                                    <Input 
                                        type="date" 
                                        value={tripDate} 
                                        onChange={(e) => onInputChange("tripDate", e)} 
                                        style={{ height: "39px" }} 
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4} className="d-flex align-items-end" style={{gap: '10px'}}>
                                <Button onClick={onGetData} color="primary" className="w-100" style={{ height: "39px" }}>
                                    Get Trip Details
                                </Button>
                                <Button onClick={() => setIsUploadModalOpen(true)} color="success" className="w-100" style={{ height: "39px" }}>
                                    + Add Reading
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {tripsApiData && !tripsLoading && (
                    <Row className="mt-3 mb-3">
                        <Col md={12}>
                            <Card className="bg-primary text-white">
                                <CardBody className="d-flex justify-content-between align-items-center py-2">
                                    <h5 className="mb-0 text-white">Total Distance for the Day</h5>
                                    <h3 className="mb-0 text-white">{dayTotalDistance} km</h3>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                )}

                <div className='mt-2'>
                    {tripsLoading ? (
                        <div style={{ height: "50vh" }} className="d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} color="#556ee6" />
                            <p className="mt-3 h5 text-muted">Loading Trip Details...</p>
                        </div>
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={tripsData || []}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search trips..."
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />
                    )}
                </div>

                <SimpleModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    cancelButtonName="Close"
                    successButtonName="Download"
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleDownloadImage}
                >
                    <div className="text-center p-2">
                        <img
                            src={SelectedImgSrc}
                            alt="odometer_img"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '60vh',
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                                e.target.alt = 'Image not available';
                            }}
                        />
                    </div>
                </SimpleModal>

                <Modal isOpen={isUploadModalOpen} toggle={() => setIsUploadModalOpen(!isUploadModalOpen)} size="lg">
                    <ModalHeader toggle={() => setIsUploadModalOpen(!isUploadModalOpen)}>Add Trip Reading</ModalHeader>
                    <ModalBody>
                        <Form>
                            <Row>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Employee Code <span className="text-danger">*</span></Label>
                                        <Input type="text" name="employee_code" value={uploadForm.employee_code} onChange={handleUploadChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Employee Name</Label>
                                        <Input type="text" name="employee_name" value={uploadForm.employee_name} onChange={handleUploadChange} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Vehicle Number</Label>
                                        <Input type="text" name="vehicle_number" value={uploadForm.vehicle_number} onChange={handleUploadChange} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Trip Date & Time <span className="text-danger">*</span></Label>
                                        <Input type="datetime-local" name="trip_date" value={uploadForm.trip_date} onChange={handleUploadChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Info Type <span className="text-danger">*</span></Label>
                                        <Input type="select" name="info_type" value={uploadForm.info_type} onChange={handleUploadChange}>
                                            <option value="START">START</option>
                                            <option value="END">END</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Odometer Reading <span className="text-danger">*</span></Label>
                                        <Input type="number" step="0.01" name="odometer_reading" value={uploadForm.odometer_reading} onChange={handleUploadChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Latitude</Label>
                                        <Input type="number" step="0.000001" name="latitude" value={uploadForm.latitude} onChange={handleUploadChange} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Longitude</Label>
                                        <Input type="number" step="0.000001" name="longitude" value={uploadForm.longitude} onChange={handleUploadChange} />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Trip Number (Optional Override)</Label>
                                        <Input type="number" name="trip_number" value={uploadForm.trip_number} onChange={handleUploadChange} placeholder="Auto-assigned if left blank" />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Odometer Image</Label>
                                        <Input type="file" name="odometer_image" accept="image/*" onChange={handleUploadChange} />
                                    </FormGroup>
                                </Col>
                                <Col md={12}>
                                    <FormGroup>
                                        <Label>Notes</Label>
                                        <Input type="textarea" name="notes" value={uploadForm.notes} onChange={handleUploadChange} rows="2" />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                        <Button color="primary" onClick={handleUploadSubmit} disabled={isUploading}>
                            {isUploading ? "Uploading..." : "Upload Reading"}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </div>
    );
};

export default TripDetail;
