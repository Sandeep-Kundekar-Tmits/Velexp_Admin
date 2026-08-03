import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup } from 'reactstrap';
import { Button, Label } from "reactstrap";
import DateRangeInput from '../../../components/Common/DateRangeInput';
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ALL_REGION, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import { GridLoader } from 'react-spinners';
import { useNewOperationDelivaryStrikeRate } from '../../../hooks/useNewOperationDelivaryStrikeRate';
import StatsCard from '../../../components/StatsCard';
import SelectedItemsDisplay from '../../../components/Common/SelectedItemsDisplay';
import MainHeaderComp from '../../../components/MainHeaderCom';
const LastMileOperations = () => {
    useEffect(() => {
        document.title = "Operation Performance Report";
    }, []);
    // base column config
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };
    // final status count state
    const [FinalStatusCount, setFinalStatusCount] = useState({})
    // date range state
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    // date range change handler
    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // selected payload state
    const [SelectedPayload, setSelectedPayload] = useState()
    // second mile data state
    const [SecondMiles, setSecondMiles] = useState([])
    // payment mode options
    const [paymentModeOptions, setpaymentModeOptions] = useState([
        {
            value: "ALL",
            label: "ALL"
        },
        {
            value: "COD",
            label: "COD"
        },
        {
            value: "PAID",
            label: "PAID"
        }
    ])

    // payment mode state   
    const [PaymentMode, setPaymentMode] = useState({
        value: "ALL",
        label: "ALL"
    },)

    // useMemo for the totals of the last mile operations
    const lastMileTotals = useMemo(() => {
        const totals = SecondMiles.reduce(
            (acc, row) => {
                acc.same_day += Number(row.same_day || 0);
                acc['1_day'] += Number(row['1_day'] || 0);
                acc['2_day'] += Number(row['2_day'] || 0);
                acc['3_day'] += Number(row['3_day'] || 0);
                acc['4_day'] += Number(row['4_day'] || 0);
                acc['5_day'] += Number(row['5_day'] || 0);
                acc['6_day'] += Number(row['6_day'] || 0);
                acc['7_day'] += Number(row['7_day'] || 0);
                acc['8_day'] += Number(row['8_day'] || 0);
                acc['9_day'] += Number(row['9_day'] || 0);
                acc['10_day'] += Number(row['10_day'] || 0);
                acc['10_plus_day'] += Number(row['10_plus_day'] || 0);

                acc.delivered += Number(row.delivered || 0);
                acc.undelivered += Number(row.undelivered || 0);
                acc.rto += Number(row.rto || 0);
                acc.disposed += Number(row?.disposed || 0)
                acc.lost += Number(row?.lost || 0)
                acc.total_shipments += Number(row.total_shipments || 0);
                acc.wab += Number(row?.wab || 0)
                return acc;
            },
            {
                same_day: 0,
                '1_day': 0,
                '2_day': 0,
                '3_day': 0,
                '4_day': 0,
                '5_day': 0,
                '6_day': 0,
                '7_day': 0,
                '8_day': 0,
                '9_day': 0,
                '10_day': 0,
                '10_plus_day': 0,

                delivered: 0,
                undelivered: 0,
                rto: 0,
                disposed: 0,
                lost: 0,
                wab: 0,
                total_shipments: 0,
            }
        );

        const total = totals.total_shipments || 1; // avoid divide-by-zero

        return {
            ...totals,

            /* ===== TAT PERCENTAGES ===== */
            same_day_percent: ((totals.same_day / total) * 100).toFixed(2),
            '1_day_percent': ((totals['1_day'] / total) * 100).toFixed(2),
            '2_day_percent': ((totals['2_day'] / total) * 100).toFixed(2),
            '3_day_percent': ((totals['3_day'] / total) * 100).toFixed(2),
            '4_day_percent': ((totals['4_day'] / total) * 100).toFixed(2),
            '5_day_percent': ((totals['5_day'] / total) * 100).toFixed(2),
            '6_day_percent': ((totals['6_day'] / total) * 100).toFixed(2),
            '7_day_percent': ((totals['7_day'] / total) * 100).toFixed(2),
            '8_day_percent': ((totals['8_day'] / total) * 100).toFixed(2),
            '9_day_percent': ((totals['9_day'] / total) * 100).toFixed(2),
            '10_day_percent': ((totals['10_day'] / total) * 100).toFixed(2),
            '10_plus_day_percent': ((totals['10_plus_day'] / total) * 100).toFixed(2),

            /* ===== DELIVERY STATUS PERCENTAGES ===== */
            delivered_percent: ((totals.delivered / total) * 100).toFixed(2),
            undelivered_percent: ((totals.undelivered / total) * 100).toFixed(2),
            rto_percent: ((totals.rto / total) * 100).toFixed(2),
            //dispose
            disposed_percent: ((totals.disposed / total) * 100).toFixed(2),
            // lost
            lost_percent: ((totals.lost / total) * 100).toFixed(2),
            // wab
            wab_percent: ((totals.wab / total) * 100).toFixed(2)
        };
    }, [SecondMiles]);

    // value cell
    const valueCell = key => ({ row }) => (
        <strong>{row.original[key] ?? 0}</strong>
    );

    // percent cell
    const percentCell = key => ({ row }) => (
        <span style={{ fontSize: '12px', color: '#555' }}>
            {row.original[key] ?? 0}%
        </span>
    );

    // last mile columns
    const LastMilecolumns = useMemo(() => [

        /* ================= DATE ================= */
        {

            header: 'Date',
            // id: 'date',
            // accessorKey: 'date',
            // cell: ({ getValue }) => (
            //     <span style={{ whiteSpace: 'nowrap' }}>{getValue()}</span>
            // ),
            // footer: () => <strong>Total</strong>,
            // ...baseColumnConfig,
            footer: () => null,
            columns: [
                {
                    id: 'date',
                    header: () => null,
                    accessorKey: 'date',
                    cell: ({ getValue }) => (
                        <span style={{ whiteSpace: 'nowrap' }}>{getValue()}</span>
                    ),
                    footer: () => <strong>Total</strong>,
                    ...baseColumnConfig,
                }
            ]
        },

        /* ================= SAME DAY ================= */
        {
            header: 'Same Day',
            columns: [
                {
                    id: 'same_day',
                    header: () => null,
                    accessorKey: 'same_day',
                    cell: valueCell('same_day'),
                    footer: () => <strong>{lastMileTotals.same_day}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'same_day_percent',
                    header: '',
                    cell: percentCell('same_day_percent'),
                    footer: () => <strong>{lastMileTotals.same_day_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 1 DAY ================= */
        {
            header: '1 Day',
            columns: [
                {
                    id: '1_day',
                    header: () => null,
                    accessorKey: '1_day',
                    cell: valueCell('1_day'),
                    footer: () => <strong>{lastMileTotals['1_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '1_day_percent',
                    header: () => null,
                    cell: percentCell('1_day_percent'),
                    footer: () => <strong>{lastMileTotals['1_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 2 DAY ================= */
        {
            header: '2 Day',
            columns: [
                {
                    id: '2_day',
                    header: () => null,
                    accessorKey: '2_day',
                    cell: valueCell('2_day'),
                    footer: () => <strong>{lastMileTotals['2_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '2_day_percent',
                    header: () => null,
                    cell: percentCell('2_day_percent'),
                    footer: () => <strong>{lastMileTotals['2_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 3 DAY ================= */
        {
            header: '3 Day',
            columns: [
                {
                    id: '3_day',
                    header: () => null,
                    accessorKey: '3_day',
                    cell: valueCell('3_day'),
                    footer: () => <strong>{lastMileTotals['3_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '3_day_percent',
                    header: () => null,
                    cell: percentCell('3_day_percent'),
                    footer: () => <strong>{lastMileTotals['3_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 4 DAY ================= */
        {
            header: '4 Day',
            columns: [
                {
                    id: '4_day',
                    header: () => null,
                    accessorKey: '4_day',
                    cell: valueCell('4_day'),
                    footer: () => <strong>{lastMileTotals['4_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '4_day_percent',
                    header: () => null,
                    cell: percentCell('4_day_percent'),
                    footer: () => <strong>{lastMileTotals['4_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 5 DAY ================= */
        {
            header: '5 Day',
            columns: [
                {
                    id: '5_day',
                    header: () => null,
                    accessorKey: '5_day',
                    cell: valueCell('5_day'),
                    footer: () => <strong>{lastMileTotals['5_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '5_day_percent',
                    header: () => null,
                    cell: percentCell('5_day_percent'),
                    footer: () => <strong>{lastMileTotals['5_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 6 DAY ================= */
        {
            header: '6 Day',
            columns: [
                {
                    id: '6_day',
                    header: () => null,
                    accessorKey: '6_day',
                    cell: valueCell('6_day'),
                    footer: () => <strong>{lastMileTotals['6_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '6_day_percent',
                    header: () => null,
                    cell: percentCell('6_day_percent'),
                    footer: () => <strong>{lastMileTotals['6_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 7 DAY ================= */
        {
            header: '7 Day',
            columns: [
                {
                    id: '7_day',
                    header: () => null,
                    accessorKey: '7_day',
                    cell: valueCell('7_day'),
                    footer: () => <strong>{lastMileTotals['7_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '7_day_percent',
                    header: () => null,
                    cell: percentCell('7_day_percent'),
                    footer: () => <strong>{lastMileTotals['7_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 8 DAY ================= */
        {
            header: '8 Day',
            columns: [
                {
                    id: '8_day',
                    header: () => null,
                    accessorKey: '8_day',
                    cell: valueCell('8_day'),
                    footer: () => <strong>{lastMileTotals['8_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '8_day_percent',
                    header: () => null,
                    cell: percentCell('8_day_percent'),
                    footer: () => <strong>{lastMileTotals['8_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 9 DAY ================= */
        {
            header: '9 Day',
            columns: [
                {
                    id: '9_day',
                    header: () => null,
                    accessorKey: '9_day',
                    cell: valueCell('9_day'),
                    footer: () => <strong>{lastMileTotals['9_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '9_day_percent',
                    header: () => null,
                    cell: percentCell('9_day_percent'),
                    footer: () => <strong>{lastMileTotals['9_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 10 DAY ================= */
        {
            header: '10 Day',
            columns: [
                {
                    id: '10_day',
                    header: () => null,
                    accessorKey: '10_day',
                    cell: valueCell('10_day'),
                    footer: () => <strong>{lastMileTotals['10_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '10_day_percent',
                    header: () => null,
                    cell: percentCell('10_day_percent'),
                    footer: () => <strong>{lastMileTotals['10_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 10+ DAY ================= */
        {
            header: '10+ Day',
            columns: [
                {
                    id: '10_plus_day',
                    header: () => null,
                    accessorKey: '10_plus_day',
                    cell: valueCell('10_plus_day'),
                    footer: () => <strong>{lastMileTotals['10_plus_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '10_plus_day_percent',
                    header: () => null,
                    cell: percentCell('10_plus_day_percent'),
                    footer: () => <strong>{lastMileTotals['10_plus_day_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DELIVERY STATUS ================= */
        {
            header: 'Delivered',
            columns: [
                {
                    id: 'delivered',
                    header: () => null,
                    accessorKey: 'delivered',
                    cell: valueCell('delivered'),
                    footer: () => <strong>{lastMileTotals.delivered}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'delivered_percent',
                    header: () => null,
                    cell: percentCell('delivered_percent'),
                    footer: () => <strong>{lastMileTotals.delivered_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        {
            header: 'Undelivered',
            columns: [
                {
                    id: 'undelivered',
                    header: () => null,
                    accessorKey: 'undelivered',
                    cell: valueCell('undelivered'),
                    footer: () => <strong>{lastMileTotals.undelivered}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'undelivered_percent',
                    header: () => null,
                    cell: percentCell('undelivered_percent'),
                    footer: () => <strong>{lastMileTotals.undelivered_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        {
            header: 'RTO',
            columns: [
                {
                    id: 'rto',
                    header: () => null,
                    accessorKey: 'rto',
                    cell: valueCell('rto'),
                    footer: () => <strong>{lastMileTotals.rto}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'rto_percent',
                    header: () => null,
                    cell: percentCell('rto_percent'),
                    footer: () => <strong>{lastMileTotals.rto_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },
        //  disposed
        {
            header: 'Disposed',
            columns: [
                {
                    id: 'disposed',
                    header: () => null,
                    accessorKey: 'disposed',
                    cell: valueCell('disposed'),
                    footer: () => <strong>{lastMileTotals['disposed']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'disposed_percent',
                    header: () => null,
                    cell: percentCell('disposed_percent'),
                    footer: () => <strong>{lastMileTotals['disposed_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },
        // lost
        {
            header: 'Lost',
            columns: [
                {
                    id: 'lost',
                    header: () => null,
                    accessorKey: 'lost',
                    cell: valueCell('lost'),
                    footer: () => <strong>{lastMileTotals['lost']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'lost_percent',
                    header: () => null,
                    cell: percentCell('lost_percent'),
                    footer: () => <strong>{lastMileTotals['lost_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },
        {
            header: 'Wab',
            columns: [
                {
                    id: 'wab',
                    header: () => null,
                    accessorKey: 'wab',
                    cell: valueCell('wab'),
                    footer: () => <strong>{lastMileTotals['wab']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'wab_percent',
                    header: () => null,
                    cell: percentCell('wab_percent'),
                    footer: () => <strong>{lastMileTotals['wab_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },
        /* ================= TOTAL SHIPMENTS ================= */
        {
            header: 'Total Shipments',
            // id: "Total Shipments",
            // accessorKey: 'total_shipments',
            // footer: () => <strong>{lastMileTotals.total_shipments}</strong>,
            // ...baseColumnConfig,
            footer: () => null,
            columns: [
                {
                    id: "Total Shipments",
                    header: () => null,
                    accessorKey: 'total_shipments',
                    footer: () => <strong>{lastMileTotals.total_shipments}</strong>,
                    ...baseColumnConfig,
                }
            ]
        },

    ], [lastMileTotals]);


    // to store all entries
    const [AllRegions, setAllRegions] = useState([])

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    const [AllServiceCenterOption, setAllServiceCenterOption] = useState([]);

    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // region state
    const [SelectedRegion, setSelectedRegion] = useState();

    // onCheck button click
    const [BookingData, setBookingData] = useState([])


    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()

    //  first mile report
    const { downloadExcel: SecondMileReport, loading: SecondMileLoading, error: SecondMileError } = useNewOperationDelivaryStrikeRate();
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    //  calling user api
    useEffect(() => {
        GetServiceCenter(SERVICE_CENTER)
        //  calling the regions api
        GetAllRegions(GET_ALL_REGION)
    }, [])


    useEffect(() => {
        if (Regions) {
            // Count occurrences of each region (case-insensitive)

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
    //  
    //  getting the service center data
    useEffect(() => {
        if (!ServiceCenters) return;

        const updatedServiceCenters = ServiceCenters.map(ele => ({
            value: ele?.ec_code,
            label: ele?.ec_code,
            region: ele?.region || null, // ✅ prevents undefined access
        }));

        setAllServiceCenterOption(updatedServiceCenters);
        setServiceCenterOption(updatedServiceCenters);
    }, [ServiceCenters]);


    // onCheck button click
    const OnCheckClick = async () => {
        try {
            // Format dates
            const updatedDate = formatDateForPayload(selectedRange);
            if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
                alert("Please select a valid date range");
                return;
            }

            // Prepare payload
            const payload = {
                customer_name: "All",
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
                product: "",
                payment_mode: PaymentMode?.value || "",
                region: SelectedRegion?.map(ele => ele?.value) || []
            };
            setSelectedPayload(payload)
            // API call
            const records = await GetBookingList(SPD_OPERATION_PERFORMANCE, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setSecondMiles(records?.date_wise_summary || [])
                setFinalStatusCount(records?.final_status_counter || {})
            } else {
                setBookingData([]); // Reset or set to empty array
            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            alert("An error occurred while fetching booking details");
            setBookingData([]); // Reset on error
        }
    };

    // useEffect for the filtering the  Service Centers
    useEffect(() => {
        if (!SelectedRegion || SelectedRegion.length === 0) {
            setServiceCenterOption(AllServiceCenterOption);
            return;
        }

        const regionValues = SelectedRegion.map(r => r.value);

        const filtered = AllServiceCenterOption.filter(sc =>
            sc?.region && regionValues.includes(sc.region)
        );

        setServiceCenterOption(filtered);

        setSelectedServiceCenters(prev =>
            prev.filter(sc => sc?.region && regionValues.includes(sc.region))
        );

    }, [SelectedRegion, AllServiceCenterOption]);


    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white sticky-top" style={{ top: '0px', zIndex: 1001 }}>
                <MainHeaderComp title="Delivery Strike Rate (FDSR)" subTitle="" />
            </div>
            <div className="container-fluid px-2">
                <div>
                    <Row className='gx-3 d-flex align-items-end pt-2 border-bottom pb-2'>
                        {/* select region  */}
                        <Col md={6}>
                            <FormGroup className="mb-0">
                                <Label for="Customer" className="fw-bold text-muted mb-1">Select Region</Label>
                                <div className="d-flex align-items-center">
                                    <div style={{ width: "250px" }}>
                                        <Select
                                            options={AllRegions}
                                            placeholder="Search Region"
                                            isMulti={true}
                                            value={SelectedRegion}
                                            onChange={setSelectedRegion}
                                            isClearable={true}
                                            styles={customStyles}
                                            controlShouldRenderValue={false}
                                            hideSelectedOptions={true}
                                        />
                                    </div>
                                    <SelectedItemsDisplay
                                        selectedItems={SelectedRegion}
                                        onRemove={(item) => setSelectedRegion(SelectedRegion.filter(r => r.value !== item.value))}
                                        targetId="region-overflow"
                                        placeholder='No Region Selected'
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                        {/*  service centers list */}
                        <Col md={6}>
                            <FormGroup className="mb-0">
                                <Label for="Customer" className="fw-bold text-muted mb-1">Select Service Center</Label>
                                <div className="d-flex align-items-center">
                                    <div style={{ width: "250px" }}>
                                        <Select options={ServiceCenterOption}
                                            placeholder="Search Service Center"
                                            isMulti={true}
                                            value={SelectedServiceCenters}
                                            onChange={setSelectedServiceCenters}
                                            isClearable={true}
                                            styles={customStyles}
                                            controlShouldRenderValue={false}
                                            hideSelectedOptions={true}
                                        />
                                    </div>
                                    <SelectedItemsDisplay
                                        selectedItems={SelectedServiceCenters}
                                        onRemove={(item) => setSelectedServiceCenters(SelectedServiceCenters.filter(s => s.value !== item.value))}
                                        targetId="sc-overflow"
                                        placeholder='No Service Center Selected'
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row className='gx-3 d-flex align-items-center pt-2'>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="DateRange">Date Range</Label>
                                <DateRangeInput
                                    isBorder={true}
                                    value={selectedRange}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <div style={{ width: "250px" }}>
                                <FormGroup className="mb-2">
                                    <Label for="Customer">Payment Mode</Label>
                                    <Select
                                        options={paymentModeOptions}
                                        placeholder="Search Customer"
                                        value={PaymentMode}
                                        onChange={setPaymentMode}
                                        isClearable={true}
                                        styles={customStyles} />
                                </FormGroup>
                            </div>
                        </Col>

                        <Col md={3} className=' d-flex align-items-cente align-items-center gap-2 mt-2'>
                            <Button color="primary" disabled={bookingLoading} style={{ height: "2.2rem", width: "100%" }} onClick={OnCheckClick}>
                                Check
                            </Button>
                        </Col>

                        <div className='d-flex gap-4 mt-3'>
                            {
                                Object.entries(FinalStatusCount).map(([key, value], index) => {
                                    return (
                                        <StatsCard label={key}
                                            value={value} />
                                    )
                                })
                            }
                        </div>
                    </Row>
                </div>

                <div className=''>

                    <div className='mt-0'>
                        {
                            bookingLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Operation Performance ...</p>
                            </div>
                                :
                                <>
                                    <TableContainer
                                        columns={LastMilecolumns}
                                        data={SecondMiles || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                        isCustomPageSize={true}
                                        isDownloadExcle={true}
                                        onDownloadExcle={async () => {
                                            let rowData = Array.isArray(BookingData) ? BookingData : [];

                                            let newHeaders =
                                                rowData.length > 0
                                                    ? Object.keys(rowData[0])
                                                    : [];
                                            const timestamp = new Date()
                                                .toISOString()
                                                .replace(/[:.-]/g, "_");

                                            let secondeMileReportUpdate = [...SecondMiles].map(ele => {
                                                return {
                                                    ...ele,
                                                    same_day_spd: ele?.same_day,
                                                }
                                            })
                                            await SecondMileReport(secondeMileReportUpdate, `Operation_Delivery_Strike_Rate`, {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                SelectedPayload,
                                                FinalStatusCount
                                            )
                                        }}
                                        ExcleLoading={SecondMileLoading}
                                    // excelItems={excelItems}
                                    />
                                </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default LastMileOperations