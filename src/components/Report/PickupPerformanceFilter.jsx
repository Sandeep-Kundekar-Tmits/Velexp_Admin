import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Card, CardBody, FormGroup, Label, CardText, CardTitle, Badge } from "reactstrap";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import { StatsCard } from "../FilterComponents/StatsCard";
// Removed unused imports: useGetApiCall, GET_ALL_REGION, SERVICE_CENTER, ReturnFilterData

const PickupPerformanceFilter = ({ AllEntries = {}, ApplyFilter, BookingList }) => {
    const [checkpointOptions, setCheckpointOptions] = useState([]);
    const [filterObj, setFilterObj] = useState({ checkpt: "" });
    const [isFilterActive, setIsFilterActive] = useState(false);
    const workerRef = useRef(null);

    // Initialize Web Worker for efficient data processing
    useEffect(() => {
        let isMounted = true;
        const workerUrl = new URL('../../workers/BookingWorker.js', import.meta.url);
        const newWebWorker = new Worker(workerUrl);

        newWebWorker.onmessage = (e) => {
            if (!isMounted) return;

            const { action, result } = e.data;

            switch (action) {
                case 'GET_UNIQUE_CHECKPT':
                    setCheckpointOptions(result);
                    break;
                default:
                    console.warn('Unknown worker response:', action);
            }
        };

        newWebWorker.onerror = (error) => {
            console.error('Worker error:', error);
        };

        workerRef.current = newWebWorker;

        // Cleanup function to terminate the worker
        return () => {
            isMounted = false;
            workerRef.current?.terminate();
        };
    }, []);

    // Send data to the worker to extract unique checkpoints
    useEffect(() => {
        if (workerRef.current && AllEntries?.bookings) {
            workerRef.current.postMessage({
                action: 'GET_UNIQUE_CHECKPT',
                payload: { bookings: AllEntries.bookings }
            });
        }
    }, [AllEntries?.bookings]);

    const [stats, setStats] = useState([]);

    // Define notations for status indicators
    const notations = [
        { label: "Same Day", color: "success" },
        { label: "1 Day", color: "info" },
        { label: "2 Day", color: "warning" },
        { label: "3 Day", color: "secondary" },
        { label: "3+ Day", color: "danger" }
    ];

    // Process and set the statistics based on AllEntries data
    useEffect(() => {
        if (AllEntries) {
            setStats([
                // Total Records
                {
                    title: "Total Records",
                    value: AllEntries.total_count,
                    color: "info",
                    isGroup: false
                },
                // Average TAT
                {
                    title: "Avg TAT",
                    value: AllEntries.average_tat,
                    color: "secondary",
                    isGroup: false,
                    unit: "days"
                },

                // Average Attempts
                {
                    title: "Avg Attempts",
                    value: AllEntries.average_attempts,
                    color: "info",
                    isGroup: false,
                    unit: "attempts"
                },

                // Average PUD to SPD Days
                {
                    title: "Avg PUD to SPD",
                    value: AllEntries.average_pud_to_spd_days,
                    color: "primary",
                    isGroup: false,
                    unit: "days"
                },

                // Average SPU to PUD Days
                {
                    title: "Avg SPU to PUD",
                    value: AllEntries.average_spu_to_pud_days,
                    color: "primary",
                    isGroup: false,
                    unit: "days"
                },

                // PUD to SPD Performance
                {
                    title: "PUD to SPD",
                    value: AllEntries.total_pud_to_spd,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        { label: "Same Day", value: AllEntries.pud_to_spd_counter.same_day, percent: AllEntries.pud_to_spd_percent.same_day, color: "success" },
                        { label: "1 Day", value: AllEntries.pud_to_spd_counter["1_day"], percent: AllEntries.pud_to_spd_percent["1_day"], color: "info" },
                        { label: "2 Day", value: AllEntries.pud_to_spd_counter["2_day"], percent: AllEntries.pud_to_spd_percent["2_day"], color: "warning" },
                        { label: "3 Day", value: AllEntries.pud_to_spd_counter["3_day"], percent: AllEntries.pud_to_spd_percent["3_day"], color: "secondary" },
                        { label: "3+ Day", value: AllEntries.pud_to_spd_counter["3_plus_day"], percent: AllEntries.pud_to_spd_percent["3_plus_day"], color: "danger" }
                    ]
                },

                // SPU to PUD Performance
                {
                    title: "SPU to PUD",
                    value: AllEntries.total_spu_to_pud,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        { label: "Same Day", value: AllEntries.spu_to_pud_counter.same_day, percent: AllEntries.spu_to_pud_percent.same_day, color: "success" },
                        { label: "1 Day", value: AllEntries.spu_to_pud_counter["1_day"], percent: AllEntries.spu_to_pud_percent["1_day"], color: "info" },
                        { label: "2 Day", value: AllEntries.spu_to_pud_counter["2_day"], percent: AllEntries.spu_to_pud_percent["2_day"], color: "warning" },
                        { label: "3 Day", value: AllEntries.spu_to_pud_counter["3_day"], percent: AllEntries.spu_to_pud_percent["3_day"], color: "secondary" },
                        { label: "3+ Day", value: AllEntries.spu_to_pud_counter["3_plus_day"], percent: AllEntries.spu_to_pud_percent["3_plus_day"], color: "danger" }
                    ]
                },

                // KPI Counts
                {
                    title: "Status Overview",
                    value: AllEntries.total_count,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        { label: "PICKUP PENDING", value: AllEntries.kpi_counts.PICKUP_PENDING, percent: Math.round((AllEntries.kpi_counts.PICKUP_PENDING / AllEntries.total_count) * 100), color: "warning" },
                        { label: "DELIVERED", value: AllEntries.kpi_counts.DELIVERED, percent: Math.round((AllEntries.kpi_counts.DELIVERED / AllEntries.total_count) * 100), color: "success" },
                        { label: "IN TRANSIT", value: AllEntries.kpi_counts.IN_TRANSIT, percent: Math.round((AllEntries.kpi_counts.IN_TRANSIT / AllEntries.total_count) * 100), color: "info" },
                        { label: "UNDELIVERED", value: AllEntries.kpi_counts.UNDELIVERED, percent: Math.round((AllEntries.kpi_counts.UNDELIVERED / AllEntries.total_count) * 100), color: "danger" },
                        { label: "OTHERS", value: AllEntries.kpi_counts.OTHERS, percent: Math.round((AllEntries.kpi_counts.OTHERS / AllEntries.total_count) * 100), color: "secondary" }
                    ]
                },
                {
                    isNotation: true,
                    title: "Colour Guide to Stats",
                    isGroup: false,
                    breakdown: notations
                }
            ]);
        }
    }, [AllEntries]);

    // Function to handle filter changes
    const handleFilterChange = (field, value) => {
        setFilterObj(prevFilter => ({
            ...prevFilter,
            [field]: value
        }));
    };

    // Function to apply filters
    const applyFilters = () => {
        setIsFilterActive(true);
        ApplyFilter(filterObj); // Assuming ApplyFilter is a function passed via props
    };

    // Function to clear filters
    const clearFilters = () => {
        setFilterObj({ checkpt: "" }); // Reset only checkpoint, adjust if more filters are added
        setIsFilterActive(false);
        ApplyFilter({}); // Apply empty filter to reset data
    };

    return (
        <div className="admin-booking-filter border-top pt-3">
            {/* Header */}
   

            {/* Shipment Statistics Row */}
            <Row className="mb-0  gap-3 border-bottom">
                {stats.map((stat, index) => (
                    // <Col key={index} md={stat.isGroup ? 3 : 2} style={!stat.isGroup ? { height: "120px" } : { height: "280px" }}>
                    //     <Card className="text-center border-0 shadow-sm rounded-lg overflow-hidden mb-0" style={!stat.isGroup ? { height: "120px", transition: 'all 0.3s ease' } : { height: "280px", transition: 'all 0.3s ease' }}>
                    //         <CardBody className={`pt-2 pb-1 px-2 bg-${stat.color}-light position-relative`}>
                    //             {/* Decorative accent */}
                    //             <div
                    //                 className="position-absolute top-0 left-0 h-100 w-2"
                    //                 style={{ backgroundColor: `var(--bs-${stat.color})` }}
                    //             ></div>

                    //             <div className="" style={{ minHeight: "175px" }}>
                    //                 <CardTitle tag="h6" className="text-muted h-100 text-uppercase mb-1 fs-7 fw-semibold letter-spacing-1">
                    //                     {stat.title}
                    //                 </CardTitle>

                    //                 {!stat.isGroup ? (
                    //                     // Simple stat display
                    //                     <div className="d-flex mt-4 align-items-baseline h-100 justify-content-center">
                    //                         <CardText
                    //                             tag="h2"
                    //                             className={`mb-0 h-100 fw-bold text-${stat.color}`}
                    //                         >
                    //                             {stat.value} {stat.unit && <span className="fs-6 text-muted">{stat.unit}</span>}
                    //                         </CardText>
                    //                     </div>
                    //                 ) : (
                    //                     // Grouped stat display
                    //                     <div>
                    //                         <div className="d-flex align-items-baseline justify-content-center mb-0">
                    //                             <CardText
                    //                                 tag="h4"
                    //                                 className={`mb-0 fw-bold text-${stat.color}`}
                    //                                 style={{ fontSize: '1.5rem' }}
                    //                             >
                    //                                 {stat.value}
                    //                             </CardText>
                    //                         </div>

                    //                         <div className="g-1">
                    //                             {stat.breakdown.map((item, idx) => (
                    //                                 <Col key={idx} md={12}>
                    //                                     <div className={`d-flex justify-content-between my-1 align-items-center rounded p-2 bg-${item.color}-subtle`}>
                    //                                         <div className={`fw-bold text-${item.color}`}>{item.value}</div>
                    //                                         <div className="text-muted small ms-1">({item.percent}%)</div>
                    //                                     </div>
                    //                                 </Col>
                    //                             ))}
                    //                         </div>
                    //                     </div>
                    //                 )}
                    //             </div>
                    //         </CardBody>
                    //     </Card>
                    // </Col>
                    <StatsCard key={index} {...stat} />
                ))}
            </Row>

            {/* Form Controls Row */}
            <Row className="g-3 my-3 bg-light rounded-2">
                <Col md={3}>
                    <FormGroup>
                        <Label for="checkpoint" className="fw-bold">Select Checkpoint</Label>
                        <Select
                            id="checkpoint"
                            value={checkpointOptions.find(opt => opt.value === filterObj.checkpt) || null}
                            options={checkpointOptions}
                            onChange={(val) => handleFilterChange('checkpt', val?.value)}
                            placeholder="Search Checkpoint"
                            isClearable={true}
                            styles={customStyles}
                        />
                    </FormGroup>
                </Col>

                <Col md={3} className="d-flex align-items-end mb-3">
                    <button className="btn btn-primary w-100" onClick={applyFilters}>
                        Apply Filters
                    </button>
                </Col>

                <Col md={3} className="d-flex align-items-end mb-3">
                    {isFilterActive && (
                        <button
                            className="btn bg-danger text-white w-100"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default PickupPerformanceFilter;