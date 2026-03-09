import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Card, CardBody, FormGroup, Label, CardText, CardTitle, Badge } from "reactstrap";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_REGION, SERVICE_CENTER } from "../../api";
import { ReturnFilterData } from "../../helpers/ReportBookingFilter";
import { MdErrorOutline } from "react-icons/md";
import { StatsCard } from "../FilterComponents/StatsCard";

const OperationPerformanceFilter = ({ AllEntries = {}, ApplyFilter, BookingList }) => {
    const [CheckptOption, setCheckptOption] = useState([]);
    const [FilterObj, setFilterObj] = useState({ checkpt: "" })
    const [isFilterActive, setIsFilterActive] = useState(false)
    const workerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const workerUrl = new URL('../../workers/BookingWorker.js', import.meta.url);
        const newWebWorker = new Worker(workerUrl);

        newWebWorker.onmessage = (e) => {
            if (!isMounted) return;

            const { action, result } = e.data;

            switch (action) {
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
            workerRef.current.postMessage({
                action: 'GET_UNIQUE_CHECKPT',
                payload: { bookings: AllEntries.bookings }
            });
        }
    }, [AllEntries?.bookings]);

    const [Stats, setStats] = useState([])
    const [FilteredStats, setFilteredStats] = useState([])
    const Notations = [
        {
            label: "Same Day",
            color: "success",      // Bootstrap class
            darkColor: "#218838",  // darker HEX
        },
        {
            label: "1 Day",
            color: "info",
            darkColor: "#117a8b",
        },
        {
            label: "2 Day",
            color: "warning",
            darkColor: "#d39e00",
        },
        {
            label: "3 Day",
            color: "secondary",
            darkColor: "#545b62",
        },
        {
            label: "3+ Day",
            color: "danger",
            darkColor: "#bd2130",
        },
    ];


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

                // Average OFD to SPD Days
                {
                    title: "Avg OFD to SPD",
                    value: AllEntries.average_ofd_to_spd_days,
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
                        {
                            label: "Same Day",
                            value: AllEntries.pud_to_spd_counter.same_day,
                            percent: AllEntries.pud_to_spd_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.pud_to_spd_counter["1_day"],
                            percent: AllEntries.pud_to_spd_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.pud_to_spd_counter["2_day"],
                            percent: AllEntries.pud_to_spd_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.pud_to_spd_counter["3_day"],
                            percent: AllEntries.pud_to_spd_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.pud_to_spd_counter["3_plus_day"],
                            percent: AllEntries.pud_to_spd_percent["3_plus_day"],
                            color: "danger"
                        }
                    ]
                },

                // OFD to SPD Performance
                {
                    title: "OFD to SPD",
                    value: AllEntries.total_ofd_to_spd,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.ofd_to_spd_counter.same_day,
                            percent: AllEntries.ofd_to_spd_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.ofd_to_spd_counter["1_day"],
                            percent: AllEntries.ofd_to_spd_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.ofd_to_spd_counter["2_day"],
                            percent: AllEntries.ofd_to_spd_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.ofd_to_spd_counter["3_day"],
                            percent: AllEntries.ofd_to_spd_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.ofd_to_spd_counter["3_plus_day"],
                            percent: AllEntries.ofd_to_spd_percent["3_plus_day"],
                            color: "danger"
                        }
                    ]
                },

                // KPI Counts
                {
                    title: "Status Overview",
                    value: AllEntries.total_count,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "PICKUP PENDING",
                            value: AllEntries.kpi_counts.PICKUP_PENDING,
                            percent: Math.round((AllEntries.kpi_counts.PICKUP_PENDING / AllEntries.total_count) * 100),
                            color: "warning"
                        },
                        {
                            label: "DELIVERED",
                            value: AllEntries.kpi_counts.DELIVERED,
                            percent: Math.round((AllEntries.kpi_counts.DELIVERED / AllEntries.total_count) * 100),
                            color: "success"
                        },
                        {
                            label: "IN TRANSIT",
                            value: AllEntries.kpi_counts.IN_TRANSIT,
                            percent: Math.round((AllEntries.kpi_counts.IN_TRANSIT / AllEntries.total_count) * 100),
                            color: "info"
                        },
                        {
                            label: "UNDELIVERED",
                            value: AllEntries.kpi_counts.UNDELIVERED,
                            percent: Math.round((AllEntries.kpi_counts.UNDELIVERED / AllEntries.total_count) * 100),
                            color: "danger"
                        },
                        {
                            label: "OTHERS",
                            value: AllEntries.kpi_counts.OTHERS,
                            percent: Math.round((AllEntries.kpi_counts.OTHERS / AllEntries.total_count) * 100),
                            color: "secondary"
                        }
                    ]
                },
                {
                    isNotation: true,
                    title: "Colour Guide to Stats",
                    isGroup: false,
                    breakdown: Notations
                }


            ]);
        }
    }, [AllEntries]);

    return (
        <div className="admin-booking-filter border-top pt-3">
            {/* Header */}

            {/* Shipment Statistics Row  for not group*/}
            <div className="d-flex row-cols-5 flex-wrap gap-2">
                {Stats.map((stat, index) => {
                    if (!stat?.isGroup && !stat?.isNotation) {
                        return (
                            <StatsCard key={index} {...stat} />
                        )
                    }

                })}
            </div>
            {/*  groups */}
            <div className="mt-3 d-flex row-cols-4 flex-wrap gap-3">
                {
                    Stats?.map((stat, index) => {
                        if (stat?.isGroup) {
                            return (
                                <StatsCard key={index} {...stat} />
                            )
                        }
                        // for color code
                        else if (stat?.isNotation) {
                            return (
                                <StatsCard key={index} {...stat} />
                            )
                        }
                    })
                }
            </div>
            {/* Form Controls Row */}

            <Row className="g-3 my-3 bg-light rounded-2">
                <Col md={3}>
                    <FormGroup>
                        <Label for="checkpoint" className="fw-bold">Select Checkpoint</Label>
                        <Select
                            id="checkpoint"
                            value={FilterObj.checkpt ? CheckptOption.find(opt => opt.value === FilterObj.checkpt) : null}
                            options={CheckptOption}
                            className="bg-light"
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

                <Col md={3} className="d-flex align-items-end mb-3">
                    <button className="btn btn-primary w-100" onClick={() => {
                        setIsFilterActive(true)
                        let updatedCount = ApplyFilter(FilterObj)
                    }}>
                        Apply Filters
                    </button>
                </Col>

                <Col md={3} className="d-flex align-items-end mb-3">
                    {
                        isFilterActive && <button
                            className="btn bg-danger text-white w-100"
                            onClick={() => {
                                setFilterObj({
                                    checkpt: null,
                                    Orgsc: null,
                                    serviceCenter: null,
                                    region: null
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
        </div>
    );
};

export default OperationPerformanceFilter;