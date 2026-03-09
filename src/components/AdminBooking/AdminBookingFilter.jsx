import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Card, CardBody, FormGroup, Label, CardText, CardTitle } from "reactstrap";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_REGION, SERVICE_CENTER } from "../../api";
import { ReturnFilterData } from "../../helpers/ReportBookingFilter";

const AdminBookingFilter = ({ AllEntries = {}, ApplyFilter, BookingList, avarageData }) => {
    // Stats data - could come from props or API in a real application
    // const stats = [
    //     { title: "In_Transit", value: "228", color: "primary" },
    //     { title: "Delivered", value: "67K", color: "success" },
    //     { title: "Undelivered", value: "32", color: "danger" },
    //     { title: "Total_Shipments", value: "75K", color: "info" },
    //     { title: 'Other', value: "4555", color: "black" }
    // ];

    // Options for dropdowns - could come from props or API
    // booking.
    //     {
    //     "customer_name": "DEEPAK DISTRIBUTORS",
    //     "awbno": "20252622420",
    //     "awbdate": "19-06-2025",
    //     "orderno": "20252622420",
    //     "ref2": "20252622420",
    //     "consignee_name": "17578 - KUNNAPPUZHA TVM",
    //     "consignee_city": "Thiruvananthapuram",
    //     "consignee_state": "Kerala",
    //     "orgsc": "COK",
    //     "billing_pincode": "695032",
    //     "vendor_name": "DEEPAK DISTRIBUTORS",
    //     "vendor_pincode": null,
    //     "quantity": 1,
    //     "weight": 6,
    //     "shipment_value": 8245,
    //     "total_amount": "8245",
    //     "paymentmode": "PFES",
    //     "rtoawbno": null,
    //     "destination": null,
    //     "service_center": "MGR",
    //     "tot_freight": 0,
    //     "invno": null,
    //     "CHKPNT": "Delivered"
    // }

    const [ORGSC_Options, setORGSC_Options] = useState([]);
    const [CheckptOption, setCheckptOption] = useState([]);
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    const [AllRegions, setAllRegions] = useState([])
    const [FilterObj, setFilterObj] = useState({ checkpt: "", Orgsc: "", serviceCenter: [], region: "" })

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()

    //  is filter active
    const [isFilterActive, setIsFilterActive] = useState(false)
    const workerRef = useRef(null);


    useEffect(() => {
        //  calling the service center api
        GetServiceCenter(SERVICE_CENTER)
        //  calling the regions api
        GetAllRegions(GET_ALL_REGION)
    }, [])


    // getting the service center data
    useEffect(() => {
        if (ServiceCenters) {
            console.log(FilterObj.region, "FilterObj.region", ServiceCenters)
            //  also filter as per the region
            let updatedServiceCenters = ServiceCenters
                .filter(region => {
                    if (!FilterObj.region) return true; // Include all if no filter
                    return FilterObj.region === region?.region?.toLowerCase().trim();
                })
                .map(ele => ({
                    value: ele?.ec_code || '', // Provide fallback if needed
                    label: ele?.ec_code || '', // Provide fallback if needed
                    name: ele?.region || ''    // Provide fallback if needed
                }));
            console.log(updatedServiceCenters, "updatedServiceCenters")

            setFilterObj((obj) => {
                return {
                    ...obj,
                    serviceCenter: updatedServiceCenters.map((ele) => ele?.value)
                }
            })
            setServiceCenterOption(updatedServiceCenters)
        }
    }, [ServiceCenters, FilterObj?.region])

    useEffect(() => {
        if (Regions) {
            // Count occurrences of each region (case-insensitive)
            const regionCounts = new Map();

            Regions.forEach((ele) => {
                const key = ele?.region?.toLowerCase();
                if (key) {
                    regionCounts.set(key, (regionCounts.get(key) || 0) + 1);
                }
            });

            // Filter out regions that appear more than once
            const updatedRegions = Regions
                .map((ele) => ({
                    value: ele?.region,
                    label: ele?.region,
                })).filter((item, index, self) =>
                    index === self.findIndex((t) => t.value.toLowerCase() === item.value?.toLowerCase())
                ).filter((item, index, self) =>
                    index === self.findIndex((t) => t.value === item.value)
                );

            setAllRegions(updatedRegions);
        }
    }, [Regions]);

    useEffect(() => {
        let isMounted = true;
        // Make sure the worker file name matches
        const workerUrl = new URL('../../workers/BookingWorker.js', import.meta.url);
        const newWebWorker = new Worker(workerUrl);

        newWebWorker.onmessage = (e) => {
            if (!isMounted) return;

            const { action, result } = e.data;

            switch (action) {
                case 'GET_UNIQUE_ORGSC':
                    setORGSC_Options(result);
                    break;
                case 'GET_UNIQUE_CHECKPT':
                    setCheckptOption(result);
                    break;
                default:
                    console.warn('Unknown worker response:', action);
            }
        };

        newWebWorker.onerror = (error) => {
            console.error('Worker error:', error);
        };

        workerRef.current = newWebWorker;


        return () => {
            isMounted = false;
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (workerRef.current && AllEntries?.bookings) {
            // Send both requests at once
            workerRef.current.postMessage({
                action: 'GET_UNIQUE_ORGSC',
                payload: { bookings: AllEntries.bookings }
            });

            workerRef.current.postMessage({
                action: 'GET_UNIQUE_CHECKPT',
                payload: { bookings: AllEntries.bookings }
            });
        }
    }, [AllEntries?.bookings]);
    const [Stats, setStats] = useState([])
    // filterd stats
    const [FilteredStats, setFilteredStats] = useState([])

    useEffect(() => {
        if (AllEntries?.kpi_counts) {
            setStats([
                { title: "In_Transit", value: AllEntries?.kpi_counts?.IN_TRANSIT, subValue: null, color: "primary" },
                { title: "Delivered", value: AllEntries?.kpi_counts?.DELIVERED, subValue: null, color: "success" },
                { title: "Undelivered", value: AllEntries?.kpi_counts?.UNDELIVERED, subValue: null, color: "danger" },
                { title: "Total_Shipments", value: AllEntries?.total_count, subValue: null, color: "info" },
                { title: 'Other', value: AllEntries?.kpi_counts?.OTHERS, subValue: null, color: "black" },
                { title: "Avg TAT", value: AllEntries?.average_tat, subValue: null, color: "info" },
                ...(avarageData ? [
                    ...Stats,
                    { title: "Average Attempts", value: avarageData?.average_attempts, subValue: null, color: "info" },
                    { title: "Average PUD To SPD Days", value: avarageData?.average_pud_to_spd_days, subValue: null, color: "info" },
                ]:[])
            ])
            
        }

    }, [AllEntries?.kpi_counts])



    const updateStats = (FilteredData) => {
        const { IN_TRANSIT,
            UNDELIVERED,
            DELIVERED,
            OTHER,
            TOTAL, AVG_TAT } = FilteredData
        setFilteredStats([
            { title: "In_Transit", value: IN_TRANSIT, subValue: null, color: "primary" },
            { title: "Delivered", value: DELIVERED, subValue: null, color: "success" },
            { title: "Undelivered", value: UNDELIVERED, subValue: null, color: "danger" },
            { title: "Total_Shipments", value: TOTAL, subValue: null, color: "info" },
            { title: 'Other', value: OTHER, subValue: null, color: "black" },
            { title: "Avg TAT", value: AVG_TAT, subValue: null, color: "info" },
        ])
    }
    return (
        <div className="admin-booking-filter pt-3 border-top">
            {/* Header */}

            {/* Shipment Statistics Row */}
            <div className="mb-0 g-3 d-flex  row-cols-md-5 flex-wrap gap-3 ">
                {Stats.map((stat, index) => (
                    <div key={index} md={3} className="m" style={{ maxWidth: "195px" }}>
                        <Card className="text-center border-2 rounded-lg overflow-hidden mb-0" style={{ transition: 'all 0.3s ease' }}>
                            <CardBody className={`py-2 px-2 bg-${stat.color}-light position-relative`}>
                                {/* Optional decorative accent */}
                                <div
                                    className="position-absolute top-0 left-0 h-100 w-3"
                                    style={{ backgroundColor: `var(--bs-${stat.color})` }}
                                ></div>

                                <div className="position-relative">
                                    <CardTitle tag="h6" className="text-muted text-uppercase mb-2 fs-6 fw-semibold letter-spacing-1">
                                        {stat.title}
                                    </CardTitle>

                                    <div className="d-flex align-items-baseline justify-content-center">
                                        <CardText
                                            tag="h4"
                                            className={`mb-0 fw-bold text-${stat.color}`}
                                            style={{ fontSize: '2rem' }}
                                        >
                                            {stat.value}
                                        </CardText>
                                    </div>

                                    {stat.subValue && (
                                        <div>
                                            <span>Filtered Total</span>
                                            <CardText
                                                tag="span"
                                                className="text-primary ms-2 fs-6 fw-medium"
                                                title="Filtered total shipment count"
                                                aria-label={`Filtered total shipment count: ${stat.subValue}`}
                                            >
                                                ({stat.subValue})
                                            </CardText>
                                        </div>
                                    )}


                                </div>
                            </CardBody>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Form Controls Row */}
            <div className="mt-3 rounded-3 border bg-light p-3">
                <Row className="g-3 ">
                    <Col md={3}>
                        <FormGroup>
                            <Label for="checkpoint" className="fw-bold">Select Checkpoint</Label>
                            <Select
                                id="checkpoint"
                                value={FilterObj.checkpt ? CheckptOption.find(opt => opt.value === FilterObj.checkpt) : null}
                                options={CheckptOption}
                                onChange={(val) => {
                                    setFilterObj({
                                        ...FilterObj,
                                        checkpt: val?.value
                                    })
                                }}
                                placeholder="Search Checkpoint"
                                isClearable={true}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    {/* <Col md={3}>
                    <FormGroup>
                        <Label for="orgsc" className="fw-bold">Select ORGSC</Label>
                        <Select
                            id="orgsc"
                            value={FilterObj.Orgsc ? ORGSC_Options.find(opt => opt.value === FilterObj.Orgsc) : null}
                            options={ORGSC_Options}
                            placeholder="Search ORGSC"
                            isClearable={true}
                            onChange={(val) => {
                                setFilterObj({
                                    ...FilterObj,
                                    Orgsc: val?.value
                                })
                            }}
                            styles={customStyles}
                        />
                    </FormGroup>
                </Col> */}
                    <Col md={3}>
                        <FormGroup>
                            <Label for="checkpoint" className="fw-bold">Regions</Label>
                            <Select
                                id="checkpoint"
                                value={FilterObj.region ? AllRegions.find(opt => opt.value === FilterObj.region) : null}
                                options={AllRegions}
                                onChange={(val) => {
                                    setFilterObj({
                                        ...FilterObj,
                                        region: val?.value?.toLowerCase()?.trim(),
                                    })
                                }}
                                placeholder="Search Regions"
                                isClearable={true}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="checkpoint" className="fw-bold">Service Center</Label>
                            <Select
                                id="checkpoint"
                                value={FilterObj.serviceCenter ? ServiceCenterOption.find(opt => opt.value === FilterObj.serviceCenter) : null}
                                options={ServiceCenterOption}
                                onChange={(val) => {

                                    setFilterObj({
                                        ...FilterObj,
                                        serviceCenter: [val?.value],
                                    })

                                    if (val === null) {
                                        setFilterObj({
                                            ...FilterObj,
                                            region: null
                                        })
                                    }
                                    // setAllRegions
                                }}
                                placeholder="Search Service Center"
                                isClearable={true}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>



                    <Col md={3} className="d-flex align-items-end gap-2 mb-3">
                        <button className="btn btn-primary w-50" onClick={() => {
                            setIsFilterActive(true)
                            let updatedCount = ApplyFilter(FilterObj)
                            let FilteredDashboard = ReturnFilterData(updatedCount)
                            if (FilteredDashboard) {
                                updateStats(FilteredDashboard)
                            }
                        }}>
                            Apply Filters
                        </button>
                        {
                            isFilterActive && <button
                                className="btn bg-danger shadow-sm text-white"
                                onClick={() => {
                                    setFilterObj({
                                        checkpt: null,
                                        Orgsc: null,
                                        serviceCenter: null,
                                        region: null
                                        // Add other filter fields to reset as needed
                                    });
                                    setFilteredStats([])
                                    setIsFilterActive(false);
                                    let updatedCount = ApplyFilter({})

                                }}
                            >

                                Clear Filters
                            </button>
                        }
                    </Col>
                </Row>

                {/*  filtered statistic row */}

                {
                    FilteredStats.length > 0 &&
                    <div className="mb-0 g-3 border-top d-flex flex-wrap gap-2 row-cols-md-6">
                        {/* <h4 className="mb-0">Filtered Stats</h4> */}
                        {FilteredStats.map((stat, index) => (
                            <div key={index} style={{ width: "160px" }}>
                                <Card className="text-center border-0 shadow-sm rounded-lg overflow-hidden mb-2" style={{ transition: 'all 0.3s ease' }}>
                                    <CardBody className={`py-2 px-1 bg-${stat.color}-light position-relative`}>
                                        {/* Optional decorative accent */}
                                        <div
                                            className="position-absolute top-0 left-0 h-100 w-3"
                                            style={{ backgroundColor: `var(--bs-${stat.color})` }}
                                        ></div>

                                        <div className="position-relative">
                                            <CardTitle style={{ fontSize: "12px" }} className="text-muted text-uppercase mb-2 fs-6 fw-semibold letter-spacing-1">
                                                {stat.title}
                                            </CardTitle>

                                            <div className="d-flex align-items-baseline justify-content-center">
                                                <CardText
                                                    tag="h4"
                                                    className={`mb-0 fw-bold text-${stat.color}`}
                                                    style={{ fontSize: '1rem' }}
                                                >
                                                    {stat.value}
                                                </CardText>
                                            </div>

                                            {stat.subValue && (
                                                <div>
                                                    <span>Filtered Total</span>
                                                    <CardText
                                                        tag="span"
                                                        className="text-primary ms-2 fs-6 fw-medium"
                                                        title="Filtered total shipment count"
                                                        aria-label={`Filtered total shipment count: ${stat.subValue}`}
                                                    >
                                                        ({stat.subValue})
                                                    </CardText>
                                                </div>
                                            )}


                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        ))}
                    </div>

                }
            </div>

        </div>
    );
};

export default AdminBookingFilter;