import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from "@/components/ui";
import { Button, FormFeedback, Input, Label, Table } from "@/components/ui";
import DateRangeInput from "../../../../components/Common/DateRangeInput";

import Select from 'react-select'
// import { GET_ADMIN_BOOKING_DETAILS, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE,GET_ALL_REGION }  from '../../../../api';
import Loader from "@/Loaders/Loader";
import { IoMdCloudDownload } from "react-icons/io";
import TableContainer from '../../../../components/Table/TableContainer';
import { customStyles } from '../../../../helpers/CustomStyle';
import usePostApiCall from '../../../../hooks/usePostApiCall';
import { useGetApiCall } from '../../../../hooks/useGetApiCall';
import formatDateForPayload from '../../../../helpers/DateHelper';
import { useExcelExport } from '../../../../hooks/useExcelExport';
import { useFirstMileExcel } from '../../../../hooks/useFirstMileExcel';
import { useSecondMileExcel } from '../../../../hooks/useSecondMileExcel';
import { GET_ALL_REGION, GET_CUSTOMER_PERFORMANCE_FASR, GET_USER_API, OFD_OPERATIONS_PERFORMANCE } from "../../../../api";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useOFDExcel } from '../../../../hooks/useOFDExcel';
import { useOperationFDSR } from '../../../../hooks/useOperationFDSR';
import renderCountWithPercent from '../../../../components/renderCountWithPercent';
const CustomerOFDOperation = () => {
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    const [username, setUsername] = useState({})
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    const [AllServiceCenterOption, setAllServiceCenterOption] = useState([]);

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    const [AllRegions, setAllRegions] = useState([])
    // region state
    const [SelectedRegion, setSelectedRegion] = useState()

    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const [OFDOperations, setOFDOperations] = useState([])
    // The 10k+ booking rows are only needed for the Excel export, never rendered.
    // Kept in a ref so they don't sit in React state and re-trigger renders.
    const BookingsRef = useRef([])
    const handleChange = (range) => {
        setSelectedRange(range);
    };

    const [selectedPayload, setSelectedPayload] = useState(null)
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
    const [PaymentMode, setPaymentMode] = useState({
        value: "ALL",
        label: "ALL"
    },)

    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
    // service centers -- cached 30min via react-query instead of refetched on every mount
    const { data: ServiceCenters } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    })
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()

    //  first mile report
    const { downloadExcel, loading: FirstMileLoading, error } = useOperationFDSR();
    //  defining the get booking list 
    const { apifunc: GetOFDOperationPerformance, data: OFDOperationsPerformance, loading: OFDOperationsLoading } = usePostApiCall()

    const lastMileTotals = useMemo(() => {
        return OFDOperations.reduce(
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
                acc.total_shipments += Number(row.total_shipments || 0);

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
                total_shipments: 0,
            }
        );
    }, [OFDOperations]);
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };
    const LastMilecolumns = useMemo(
        () => [
            {
                header: 'Date',
                accessorKey: 'date',
                cell: ({ getValue }) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        {getValue()}
                    </span>
                ),
                footer: () => <strong>Total</strong>,
                ...baseColumnConfig,
            },

            {
                header: 'Same Day',
                accessorFn: row => ({
                    count: row.same_day,
                    percent: row.same_day_percent,
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals.same_day}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '1 Day',
                accessorFn: row => ({
                    count: row['1_day'],
                    percent: row['1_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['1_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '2 Day',
                accessorFn: row => ({
                    count: row['2_day'],
                    percent: row['2_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['2_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '3 Day',
                accessorFn: row => ({
                    count: row['3_day'],
                    percent: row['3_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['3_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '4 Day',
                accessorFn: row => ({
                    count: row['4_day'],
                    percent: row['4_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['4_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '5 Day',
                accessorFn: row => ({
                    count: row['5_day'],
                    percent: row['5_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['5_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '6 Day',
                accessorFn: row => ({
                    count: row['6_day'],
                    percent: row['6_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['6_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '7 Day',
                accessorFn: row => ({
                    count: row['7_day'],
                    percent: row['7_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['7_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '8 Day',
                accessorFn: row => ({
                    count: row['8_day'],
                    percent: row['8_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['8_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '9 Day',
                accessorFn: row => ({
                    count: row['9_day'],
                    percent: row['9_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['9_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '10 Day',
                accessorFn: row => ({
                    count: row['10_day'],
                    percent: row['10_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['10_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: '10+ Day',
                accessorFn: row => ({
                    count: row['10_plus_day'],
                    percent: row['10_plus_day_percent'],
                }),
                cell: ({ getValue }) => renderCountWithPercent(getValue),
                footer: () => <strong>{lastMileTotals['10_plus_day']}</strong>,
                ...baseColumnConfig,
            },

            {
                header: 'Total Shipments',
                accessorKey: 'total_shipments',
                footer: () => <strong>{lastMileTotals.total_shipments}</strong>,
                ...baseColumnConfig,
            },
        ],
        [lastMileTotals]
    );


    useEffect(() => {
          GetUserList(`${GET_USER_API}/`)
        //  calling the regions api
        GetAllRegions(GET_ALL_REGION)
    }, [])


    useEffect(() => {
        if (UserList) {
            let updatedOptions = UserList
                .filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null &&
                        name !== "null" &&
                        name !== "undefined" &&
                        name !== "";
                })
                .map((ele) => ({
                    value: ele.customer_name,
                    label: ele.customer_name
                }));
            setUserListOption(updatedOptions);
        }

    }, [UserList]);


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






    const OnCheckClick = async () => {
        try {
            // Validate username exists before proceeding

            // if (SelectedServiceCenters.length < 1) {
            //     alert("Select The Service Centers");
            //     return;
            // }
            if (!username?.value) {
                setUsername({ value: "All", label: "All" })
            }

            // Format dates
            const updatedDate = formatDateForPayload(selectedRange);
            if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
                alert("Please select a valid date range");
                return;
            }

            // Prepare payload
            const payload = {
                customer_name: username.value ? username.value : "All",
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
                region: SelectedRegion?.map(ele => ele?.value) || [],
                payment_mode: PaymentMode?.value || "",
            };

            setSelectedPayload(payload)

            // API call
            const records = await GetOFDOperationPerformance(GET_CUSTOMER_PERFORMANCE_FASR, payload);

            if (records?.bookings) {
                BookingsRef.current = records.bookings
                setOFDOperations(records?.date_wise_summary)
            } else {

            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            alert("An error occurred while fetching booking details");

        }
    };

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
        <div className='page-content'>
            <div className="container-fluid">
                <div>
                    <h3 className='pb-4 border-bottom '>OFP  Performance (FASR)</h3>
                    <Row className='gx-3 flex items-center pt-2'>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select options={UserListOptions}
                                    placeholder="Search Customer"
                                    // value={username}
                                    onChange={setUsername}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Payment Mode</Label>
                                <Select options={paymentModeOptions}
                                    placeholder="Search Customer"
                                    value={PaymentMode}
                                    onChange={setPaymentMode}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        {/* select region  */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Region</Label>
                                <Select
                                    options={AllRegions}
                                    placeholder="Search Region"
                                    isMulti={true}
                                    value={SelectedRegion}
                                    onChange={setSelectedRegion}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        {/*  service centers list */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Service Center</Label>
                                <Select options={ServiceCenterOption}
                                    placeholder="Search"
                                    isMulti={true}
                                    value={SelectedServiceCenters}
                                    onChange={setSelectedServiceCenters}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        {/* mode */}
                        {/* Date Range Picker */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <div className="flex w-full flex-col gap-1.5">
                                    <Label className="form-label m-0 font-bold text-ink-muted">
                                        Date Range
                                    </Label>
                                    <DateRangeInput
                                        isBorder={true}
                                        value={selectedRange}
                                        onChange={handleChange}
                                    />
                                </div>
                            </FormGroup>
                        </Col>


                        <Col md={3} className=' flex align-items-cente items-center gap-2 mt-2'>
                            {/* <div className="flex 2"> */}
                            <Button color="primary"
                                // disabled={bookingLoading}
                                style={{ height: "2.2rem", width: "100%" }}
                                onClick={OnCheckClick}
                            >
                                Check
                            </Button>

                            {/* <Button
                                    color="primary"
                                    className='flex justify-center items-center'
                                    disabled={BookingData.length < 1}
                                    onClick={DownloadPerformanceDetails}
                                    title='Download'
                                    style={{ height: "2.2rem", width: "6rem" }}
                                >
                                    {isExporting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Exporting...
                                        </>
                                    ) : (
                                        <FaCloudDownloadAlt style={{ width: "20px", height: "20px" }} />
                                    )}
                                </Button> */}
                            {/* </div> */}
                        </Col>
                        {/* {
                            isShowFilter && <OperationPerformanceFilter
                                AllEntries={AllEntries}
                                ApplyFilter={ApplyFilter}
                                BookingList={() => { }}
                            />
                        } */}

                    </Row>
                </div>

                <div className=''>

                    <div className='mt-1'>
                        {
                            OFDOperationsLoading ? <Loader message="Loading FASR Performance ..." fullscreen={false} />
                                :
                                <>
                                    <TableContainer
                                        columns={LastMilecolumns}
                                        data={OFDOperations || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                        isCustomPageSize={true}
                                        isDownloadExcle={true}
                                        onDownloadExcle={async () => {
                                            const rowData = BookingsRef.current;
                                            const newHeaders = rowData.length ? Object.keys(rowData[0]) : [];
                                            let OFDOperationsReportUpdate = [...OFDOperations].map(ele => {
                                                return {
                                                    ...ele,
                                                    same_day_spd: ele?.same_day,
                                                }
                                            })
                                            await downloadExcel(OFDOperationsReportUpdate, "Ofp_Performance", {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                selectedPayload
                                            )
                                        }}
                                        ExcleLoading={FirstMileLoading}
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
export default CustomerOFDOperation