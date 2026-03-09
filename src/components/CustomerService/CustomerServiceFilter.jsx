import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Col, Card, CardBody, FormGroup, Label, CardText, CardTitle, Badge } from "reactstrap";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_REGION, SERVICE_CENTER } from "../../api";
import { ReturnFilterData } from "../../helpers/ReportBookingFilter";
import { StatsCard } from "../FilterComponents/StatsCard";

const CustomerServiceFilter = ({ AllEntries = {}, ApplyFilter, BookingList }) => {
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
        if (workerRef.current && AllEntries?.records) {
            workerRef.current.postMessage({
                action: 'GET_UNIQUE_CHECKPT',
                payload: { bookings: AllEntries.records }
            });
        }
    }, [AllEntries?.records]);

    const [Stats, setStats] = useState([])
    const [FilteredStats, setFilteredStats] = useState([])
    const Notations = [
        {
            label: "Same Day",
            color: "success"
        },
        {
            label: "1 Day",
            color: "info"
        },
        {
            label: "2 Day",
            color: "warning"
        },
        {
            label: "3 Day",
            color: "secondary"
        },
        {
            label: "3+ Day",
            color: "danger"
        }
    ]
    useEffect(() => {
        if (AllEntries) {
            setStats([
                // Total Records
                {
                    title: "Total Records",
                    value: AllEntries.total_records,
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

                // SPU PUD Performance
                {
                    title: "SPU PUD",
                    value: AllEntries.total_spu_pud,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.spu_pud_performance_counter.same_day,
                            percent: AllEntries.spu_pud_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.spu_pud_performance_counter["1_day"],
                            percent: AllEntries.spu_pud_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.spu_pud_performance_counter["2_day"],
                            percent: AllEntries.spu_pud_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.spu_pud_performance_counter["3_day"],
                            percent: AllEntries.spu_pud_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.spu_pud_performance_counter["3_plus_day"],
                            percent: AllEntries.spu_pud_percent["3_plus_day"],
                            color: "danger"
                        }
                    ]
                },

                // PUD to OFD Performance
                {
                    title: "PUD to OFD",
                    value: AllEntries.total_pud_to_ofd,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.pud_to_ofd_counter.same_day,
                            percent: AllEntries.pud_to_ofd_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.pud_to_ofd_counter["1_day"],
                            percent: AllEntries.pud_to_ofd_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.pud_to_ofd_counter["2_day"],
                            percent: AllEntries.pud_to_ofd_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.pud_to_ofd_counter["3_day"],
                            percent: AllEntries.pud_to_ofd_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.pud_to_ofd_counter["3_plus_day"],
                            percent: AllEntries.pud_to_ofd_percent["3_plus_day"],
                            color: "danger"
                        }
                    ]
                },

                // PUD to LDP Performance
                {
                    title: "PUD to LDP",
                    value: AllEntries.total_pud_to_ldp,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.pud_to_ldp_counter.same_day,
                            percent: AllEntries.pud_to_ldp_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.pud_to_ldp_counter["1_day"],
                            percent: AllEntries.pud_to_ldp_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.pud_to_ldp_counter["2_day"],
                            percent: AllEntries.pud_to_ldp_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.pud_to_ldp_counter["3_day"],
                            percent: AllEntries.pud_to_ldp_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.pud_to_ldp_counter["3_plus_day"],
                            percent: AllEntries.pud_to_ldp_percent["3_plus_day"],
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

                // LDP to SAO Performance
                {
                    title: "LDP to SAO",
                    value: AllEntries.total_ldp_to_sao,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.ldp_to_sao_counter.same_day,
                            percent: AllEntries.ldp_to_sao_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.ldp_to_sao_counter["1_day"],
                            percent: AllEntries.ldp_to_sao_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.ldp_to_sao_counter["2_day"],
                            percent: AllEntries.ldp_to_sao_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.ldp_to_sao_counter["3_day"],
                            percent: AllEntries.ldp_to_sao_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.ldp_to_sao_counter["3_plus_day"],
                            percent: AllEntries.ldp_to_sao_percent["3_plus_day"],
                            color: "danger"
                        }
                    ]
                },

                // SAO to OFD Performance
                {
                    title: "SAO to OFD",
                    value: AllEntries.total_sao_to_ofd,
                    color: "primary",
                    isGroup: true,
                    breakdown: [
                        {
                            label: "Same Day",
                            value: AllEntries.sao_to_ofd_counter.same_day,
                            percent: AllEntries.sao_to_ofd_percent.same_day,
                            color: "success"
                        },
                        {
                            label: "1 Day",
                            value: AllEntries.sao_to_ofd_counter["1_day"],
                            percent: AllEntries.sao_to_ofd_percent["1_day"],
                            color: "info"
                        },
                        {
                            label: "2 Day",
                            value: AllEntries.sao_to_ofd_counter["2_day"],
                            percent: AllEntries.sao_to_ofd_percent["2_day"],
                            color: "warning"
                        },
                        {
                            label: "3 Day",
                            value: AllEntries.sao_to_ofd_counter["3_day"],
                            percent: AllEntries.sao_to_ofd_percent["3_day"],
                            color: "secondary"
                        },
                        {
                            label: "3+ Day",
                            value: AllEntries.sao_to_ofd_counter["3_plus_day"],
                            percent: AllEntries.sao_to_ofd_percent["3_plus_day"],
                            color: "danger"
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
        <div className="admin-booking-filter pt-3 border-top">
            {/* Shipment Statistics Row non group */}
            <Row className="mb-0 g-2 gap-2">
                {Stats.map((stat, index) => {


                    if (!stat?.isGroup  && !stat?.isNotation ) {
                        return (
                            <StatsCard key={index} {...stat} />
                        )
                    }
                })}
            </Row>
            {/* groups */}
            <Row className="mb-0 g-2 gap-2 mt-2">
                {Stats.map((stat, index) => {


                    if (stat?.isGroup || stat?.isNotation) {
                        return (
                            <StatsCard key={index} {...stat} />
                        )
                    }
                })}
            </Row>

            {/* Form Controls Row */}
            <Row className="g-3 bg-light rounded-2 mt-3">
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

export default CustomerServiceFilter;