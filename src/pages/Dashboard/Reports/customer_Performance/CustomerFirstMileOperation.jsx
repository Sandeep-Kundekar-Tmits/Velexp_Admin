import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangeInput from "../../../../components/Common/DateRangeInput";

import Select from 'react-select'
import { GET_ADMIN_BOOKING_DETAILS, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE, GET_ALL_REGION, GET_CUSTOMER_PERFORMANCE_FPDR } from '../../../../api';
import { GridLoader } from 'react-spinners';
import { IoMdCloudDownload } from "react-icons/io";
import TableContainer from '../../../../components/Table/TableContainer';
import { customStyles } from '../../../../helpers/CustomStyle';
import usePostApiCall from '../../../../hooks/usePostApiCall';
import { useGetApiCall } from '../../../../hooks/useGetApiCall';
import formatDateForPayload from '../../../../helpers/DateHelper';
import { useExcelExport } from '../../../../hooks/useExcelExport';
import { useFirstMileExcel } from '../../../../hooks/useFirstMileExcel';
import { useSecondMileExcel } from '../../../../hooks/useSecondMileExcel';
import renderCountWithPercent from '../../../../components/renderCountWithPercent';
import { useOFDExcel } from '../../../../hooks/useOFDExcel';
import { useOperationFDSR } from '../../../../hooks/useOperationFDSR';
import { useNewOperationPickupStrikeRate } from '../../../../hooks/useNewOperationPickupStrikeRate';
import StatsCard from '../../../../components/StatsCard';
import SelectedItemsDisplay from '../../../../components/Common/SelectedItemsDisplay';
import MainHeaderComp from '../../../../components/MainHeaderCom';
const CustomerFirstMileOperation = () => {
    useEffect(() => {
        document.title = "Customer Performance Report (FPSR)";
    }, []);
    const [FinalStatusCount, setFinalStatusCount] = useState({})
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };


    const [SelectedPayload, setSelectedPayload] = useState(null)
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



    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const handleChange = (range) => {
        setSelectedRange(range);
    };


    const [username, setUsername] = useState(null)
    const [FirstMiles, setFirstMiles] = useState([])
    const [SecondMiles, setSecondMiles] = useState([])
    // to show and hide the filter
    const [isShowFilter, setIsShowFilter] = useState(false)
    // to store all entries
    const [AllEntries, setAllEntries] = useState({})
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    // product list
    const [ProductListOption, setProductListOption] = useState([])
    const [SelectedProduct, setSelectedProduct] = useState()
    const [AllRegions, setAllRegions] = useState([])
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    const [AllServiceCenterOption, setAllServiceCenterOption] = useState([]);
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // region state
    const [SelectedRegion, setSelectedRegion] = useState([])
    const [SelectedMode, setSelectedMode] = useState()
    // onCheck button click
    const [BookingData, setBookingData] = useState([])
    const firstMileTotals = useMemo(() => {
        const totals = FirstMiles.reduce(
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

                acc.picked_up += Number(row.picked_up || 0);
                acc.not_picked_up += Number(row.not_picked_up || 0);

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
                picked_up: 0,
                not_picked_up: 0,
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

            /* ===== PICKUP STATUS PERCENTAGES ===== */
            picked_up_percent: ((totals.picked_up / total) * 100).toFixed(2),
            not_picked_up_percent: ((totals.not_picked_up / total) * 100).toFixed(2),
        };
    }, [FirstMiles]);

    const valueCell = key => ({ row }) => (
        <strong>{row.original[key] ?? 0}</strong>
    );

    const percentCell = key => ({ row }) => (
        <span style={{ fontSize: '12px', color: '#555' }}>
            {row.original[key] ?? 0}%
        </span>
    );

    const LastMilecolumns = useMemo(() => [

        /* ================= DATE ================= */
        {
            header: 'Date',
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
                },
            ],
        },

        /* ================= SAME DAY ================= */
        {
            header: 'Same Day',
            footer: () => null,
            columns: [
                {
                    id: 'same_day',
                    header: () => null,
                    accessorKey: 'same_day',
                    cell: valueCell('same_day'),
                    footer: () => <strong>{firstMileTotals.same_day}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'same_day_percent',
                    header: () => null,
                    cell: percentCell('same_day_percent'),
                    footer: () => (
                        <strong>{firstMileTotals.same_day_percent}%</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 1–10 DAY ================= */
        ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(d => ({
            header: `${d} Day`,
            footer: () => null,
            columns: [
                {
                    id: `${d}_day`,
                    header: () => null,
                    accessorKey: `${d}_day`,
                    cell: valueCell(`${d}_day`),
                    footer: () => <strong>{firstMileTotals[`${d}_day`]}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: `${d}_day_percent`,
                    header: () => null,
                    cell: percentCell(`${d}_day_percent`),
                    footer: () => (
                        <strong>{firstMileTotals[`${d}_day_percent`]}%</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        })),

        /* ================= 10+ DAY ================= */
        {
            header: '10+ Day',
            footer: () => null,
            columns: [
                {
                    id: '10_plus_day',
                    header: () => null,
                    accessorKey: '10_plus_day',
                    cell: valueCell('10_plus_day'),
                    footer: () => <strong>{firstMileTotals['10_plus_day']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '10_plus_day_percent',
                    header: () => null,
                    cell: percentCell('10_plus_day_percent'),
                    footer: () => (
                        <strong>{firstMileTotals['10_plus_day_percent']}%</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },
        /* ================= PICKUP DONE ================= */
        {
            header: 'Pickup Done',
            footer: () => null,
            columns: [
                {
                    id: 'picked_up',
                    header: () => null,
                    accessorKey: 'picked_up',
                    cell: valueCell('picked_up'),
                    footer: () => <strong>{firstMileTotals.picked_up}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'picked_up_percent',
                    header: () => null,
                    cell: percentCell('picked_up_percent'),
                    footer: () => (
                        <strong>{firstMileTotals.picked_up_percent}%</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= NOT PICKED UP ================= */
        {
            header: 'Not Picked Up',
            footer: () => null,
            columns: [
                {
                    id: 'not_picked_up',
                    header: () => null,
                    accessorKey: 'not_picked_up',
                    cell: valueCell('not_picked_up'),
                    footer: () => <strong>{firstMileTotals.not_picked_up}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'not_picked_up_percent',
                    header: () => null,
                    cell: percentCell('not_picked_up_percent'),
                    footer: () => (
                        <strong>{firstMileTotals.not_picked_up_percent}%</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= TOTAL SHIPMENTS ================= */
        {
            header: 'Total Shipments',
            footer: () => null,
            columns: [
                {
                    id: 'total_shipments',
                    header: () => null,
                    accessorKey: 'total_shipments',
                    cell: valueCell('total_shipments'),
                    footer: () => (
                        <strong>{firstMileTotals.total_shipments}</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },

    ], [firstMileTotals]);

    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()

    //  first mile report
    const { downloadExcel, loading: FirstMileLoading, error } = useNewOperationPickupStrikeRate();
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        GetServiceCenter(SERVICE_CENTER)
        //  calling the get product list api
        GetProductsList(PRODUCT_LIST)
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

        if (ProductList) {
            let updatedProductList = ProductList?.map((ele) => {
                return {
                    value: ele?.name,
                    label: ele?.name
                }
            })
            setProductListOption(updatedProductList)
        }
    }, [UserList, ProductList]);

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
        setIsShowFilter(false)
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
            if (!username.value) {
                alert("select customer")
                return
            }

            // Prepare payload
            const payload = {
                customer_name: username.value ? username.value : "All",
                start_date: updatedDate.from_date,
                end_date: updatedDate.to_date,
                service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
                product: SelectedProduct?.value || "",
                payment_mode: PaymentMode?.value || "",
                region: SelectedRegion?.map(ele => ele?.value) || []
            };
            setSelectedPayload(payload)
            // API call
            const records = await GetBookingList(GET_CUSTOMER_PERFORMANCE_FPDR, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setAllEntries(records)
                setFirstMiles(records?.date_wise_summary || [])
                setSecondMiles(records?.date_wise_summary || [])
                setFinalStatusCount(records?.final_status_counter || {})
                // enabling the filter
                setIsShowFilter(true)
            } else {
                setBookingData([]); // Reset or set to empty array
            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            alert("An error occurred while fetching booking details");
            setBookingData([]); // Reset on error
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
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title=" Customer Pickup Strike Rate (FPSR)" subTitle="" />
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
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            styles={customStyles}
                                            controlShouldRenderValue={false}
                                            hideSelectedOptions={true}
                                        />
                                    </div>
                                    <SelectedItemsDisplay
                                        selectedItems={SelectedRegion}
                                        onRemove={(item) => setSelectedRegion(SelectedRegion.filter(r => r.value !== item.value))}
                                        targetId="region-overflow"
                                        placeholder="No Region Selected"
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
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            styles={customStyles}
                                            controlShouldRenderValue={false}
                                            hideSelectedOptions={true}
                                        />
                                    </div>
                                    <SelectedItemsDisplay
                                        selectedItems={SelectedServiceCenters}
                                        onRemove={(item) => setSelectedServiceCenters(SelectedServiceCenters.filter(s => s.value !== item.value))}
                                        targetId="sc-overflow"
                                        placeholder="No Service Center Selected"
                                    />
                                </div>
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row className='gx-3 d-flex align-items-center pt-2'>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1'>Select Date Range</Label>
                                <DateRangeInput
                                    value={selectedRange}
                                    isBorder={true}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1' for="Customer">Customer</Label>
                                <Select
                                    options={UserListOptions}
                                    placeholder="Search Customer"
                                    value={username}
                                    onChange={setUsername}
                                    isClearable={true}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={customStyles}
                                />
                            </FormGroup>
                        </Col>

                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label className='mb-1' for="Customer">Payment Mode</Label>
                                <Select options={paymentModeOptions}
                                    placeholder="Search Payment Mode"
                                    value={PaymentMode}
                                    onChange={setPaymentMode}
                                    isClearable={true}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>

                        <Col md={3} className=' d-flex align-items-center gap-2 mt-2'>
                            <Button color="primary" disabled={bookingLoading} style={{ height: "38px", width: "100%" }} onClick={OnCheckClick}>
                                Check
                            </Button>
                        </Col>
                    </Row>
                    <div className='d-flex gap-4'>
                        {
                            Object.entries(FinalStatusCount).map(([key, value], index) => {
                                return (
                                    <StatsCard label={key}
                                        value={value} />
                                )
                            })
                        }
                    </div>
                </div>

                <div className=''>

                    <div className='mt-3'>
                        {
                            bookingLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading customer Performance ...</p>
                            </div>
                                :
                                <>
                                    <TableContainer
                                        columns={LastMilecolumns}
                                        data={FirstMiles || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                        isCustomPageSize={true}
                                        isDownloadExcle={true}
                                        isStickyHeader={true}
                                        stickyTop={0}

                                        onDownloadExcle={async () => {
                                            const toTitleCase = (str) =>
                                                str
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, (c) => c.toUpperCase());

                                            let rowData = BookingData.map((ele) => {
                                                const result = {};

                                                Object.keys(ele).forEach((key) => {
                                                    // Rename created_date → AWB Date
                                                    const newKey =
                                                        key === "group_date"
                                                            ? "AWB Date"
                                                            : toTitleCase(key);

                                                    result[newKey] = ele[key];
                                                });

                                                return result;
                                            });
                                            let newHeaders = Object.keys(rowData[0]).map(ele => {
                                                return ele
                                            })
                                            let FirstMilesReportUpdate = [...FirstMiles].map(ele => {
                                                return {
                                                    ...ele,
                                                    same_day_spd: ele?.same_day,
                                                }
                                            })
                                            await downloadExcel(FirstMilesReportUpdate, "Customer_Pickup_Strike_Rate", {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                SelectedPayload,
                                                FinalStatusCount
                                            )
                                        }}
                                        ExcleLoading={FirstMileLoading}
                                    />
                                </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CustomerFirstMileOperation