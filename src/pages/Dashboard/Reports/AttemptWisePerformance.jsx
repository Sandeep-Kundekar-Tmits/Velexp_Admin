import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from "@/components/ui";
import { Button, FormFeedback, Input, Label, Table } from "@/components/ui";
import DateRangeInput from '../../../components/Common/DateRangeInput';
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles, CheckboxOption, SelectedCountValue } from '../../../helpers/CustomStyle';
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_ATTEMPT_WISE_DELIVARY_REPORT, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SPD_OPERATION_PERFORMANCE } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import Loader from "@/Loaders/Loader";
import { IoMdCloudDownload } from "react-icons/io";
// import CustomerServiceFilter from '../../../components/CustomerService/CustomerServiceFilter';
import OperationPerformanceFilter from '../../../components/Report/OperationPerformanceFilter';
import { downloadExcel } from '../../../helpers/downloadExcel';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { useExcelExport } from '../../../hooks/useExcelExport';
import { useFirstMileExcel } from '../../../hooks/useFirstMileExcel';
import TabsProvider from '../../../components/TabsProvider';
import { useSecondMileExcel } from '../../../hooks/useSecondMileExcel';
import { useAttemptWiseExcel } from '../../../hooks/useAttemptWiseExcel';
import renderCountWithPercent from '../../../components/renderCountWithPercent';
import MainHeaderComp from '../../../components/MainHeaderCom';

/* Same contract as LastMileOperations.jsx: a checkbox per option instead of a
   chip strip beside the control, and a count in the control instead of one
   chip per value. See CustomStyle.jsx for why. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    menuPortalTarget: document.body,
    /* "fixed", not the default "absolute": the default recomputes the portal
       offset from document coordinates once at open, which drifts if the page
       underneath scrolls while the menu is open. "fixed" tracks the control's
       position in the viewport instead. */
    menuPosition: "fixed",
};

const AttemptWisePerformance = () => {
    useEffect(() => {
        document.title = "Attempt Wise Delivery Performance";
    }, []);
    // base column config
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };

    // date range state
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    // date range change handler
    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // final status count state
    const [FinalStatusCount, setFinalStatusCount] = useState({})
    // selected payload state
    const [SelectedPayload, setSelectedPayload] = useState(null)
    // payment mode options state
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
    // username state
    const [username, setUsername] = useState({})
    // first mile data state
    const [FirstMiles, setFirstMiles] = useState([])
    // second mile data state
    const [SecondMiles, setSecondMiles] = useState([])
    // to show and hide the filter
    const [isShowFilter, setIsShowFilter] = useState(false)
    // to store all entries
    const [AllEntries, setAllEntries] = useState({})
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    // product list
    const [ProductListOption, setProductListOption] = useState([])
    // selected product state
    const [SelectedProduct, setSelectedProduct] = useState()
    const [AllRegions, setAllRegions] = useState([])
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    // definging the get service center api
    // service centers -- cached 30min via react-query instead of refetched on every mount
    const { data: ServiceCenters } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    })

    // selected service center
    const [SelectedServiceCenters, setSelectedServiceCenters] = useState([])
    const [AllServiceCenterOption, setAllServiceCenterOption] = useState([]);

    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    // region state
    const [SelectedRegion, setSelectedRegion] = useState();

    const [SelectedMode, setSelectedMode] = useState()
    // onCheck button click
    const [BookingData, setBookingData] = useState([])

    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()

    //  first mile report
    const { downloadExcel, loading: FirstMileLoading, error } = useFirstMileExcel();
    //  first mile report
    const { downloadExcel: AttemptWiseReport, loading: AttemptWiseLoading, error: AttemptWiseError } = useAttemptWiseExcel();
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    const percent = (value, total) =>
        total ? Number(((value / total) * 100).toFixed(2)) : 0;

    const totals = useMemo(() => {
        const acc = SecondMiles.reduce(
            (acc, row) => {
                acc.total_attempted_delivery += Number(row.total_attempted_delivery || 0);
                acc.pending_for_delivery += Number(row.pending_for_delivery || 0);
                acc.overall_total_shipments += Number(row.overall_total_shipments || 0);

                acc['1_attempt'] += Number(row['1_attempt'] || 0);
                acc['2_attempt'] += Number(row['2_attempt'] || 0);
                acc['3_attempt'] += Number(row['3_attempt'] || 0);
                acc['4_attempt'] += Number(row['4_attempt'] || 0);
                acc['5_plus_attempt'] += Number(row['5_plus_attempt'] || 0);
                acc["total_shipments"] += Number(row["total_shipments"] || 0)
                return acc;
            },
            {
                total_attempted_delivery: 0,
                pending_for_delivery: 0,
                overall_total_shipments: 0,
                '1_attempt': 0,
                '2_attempt': 0,
                '3_attempt': 0,
                '4_attempt': 0,
                '5_plus_attempt': 0,
                total_shipments: 0
            }
        );

        const total = acc.total_shipments;

        return {
            ...acc,

            total_attempted_delivery_percent: percent(
                acc.total_attempted_delivery,
                total
            ),

            pending_for_delivery_percent: percent(
                acc.pending_for_delivery,
                total
            ),

            '1_attempt_percent': percent(acc['1_attempt'], total),
            '2_attempt_percent': percent(acc['2_attempt'], total),
            '3_attempt_percent': percent(acc['3_attempt'], total),
            '4_attempt_percent': percent(acc['4_attempt'], total),
            '5_plus_attempt_percent': percent(acc['5_plus_attempt'], total),
        };
    }, [SecondMiles]);

    const valueCell = key => ({ row }) => (
        <strong>{row.original[key] ?? 0}</strong>
    );

    const percentCell = key => ({ row }) => (
        <span style={{ fontSize: '12px', color: '#555' }}>
            {row.original[key] ?? 0}%
        </span>
    );

    const columns = useMemo(() => [

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

        /* ================= 1st ATTEMPT ================= */
        {
            header: '1st Attempt',
            columns: [
                {
                    id: '1_attempt',
                    header: () => null,
                    accessorKey: '1_attempt',
                    cell: valueCell('1_attempt'),
                    footer: () => <strong>{totals['1_attempt']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '1_attempt_percent',
                    header: () => null,
                    cell: percentCell('1_attempt_percent'),
                    footer: () => <strong>{totals['1_attempt_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 2nd ATTEMPT ================= */
        {
            header: '2nd Attempt',
            columns: [
                {
                    id: '2_attempt',
                    header: () => null,
                    accessorKey: '2_attempt',
                    cell: valueCell('2_attempt'),
                    footer: () => <strong>{totals['2_attempt']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '2_attempt_percent',
                    header: () => null,
                    cell: percentCell('2_attempt_percent'),
                    footer: () => <strong>{totals['2_attempt_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 3rd ATTEMPT ================= */
        {
            header: '3rd Attempt',
            columns: [
                {
                    id: '3_attempt',
                    header: () => null,
                    accessorKey: '3_attempt',
                    cell: valueCell('3_attempt'),
                    footer: () => <strong>{totals['3_attempt']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '3_attempt_percent',
                    header: () => null,
                    cell: percentCell('3_attempt_percent'),
                    footer: () => <strong>{totals['3_attempt_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 4th ATTEMPT ================= */
        {
            header: '4th Attempt',
            columns: [
                {
                    id: '4_attempt',
                    header: () => null,
                    accessorKey: '4_attempt',
                    cell: valueCell('4_attempt'),
                    footer: () => <strong>{totals['4_attempt']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '4_attempt_percent',
                    header: () => null,
                    cell: percentCell('4_attempt_percent'),
                    footer: () => <strong>{totals['4_attempt_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 5+ ATTEMPTS ================= */
        {
            header: '5+ Attempts',
            columns: [
                {
                    id: '5_plus_attempt',
                    header: () => null,
                    accessorKey: '5_plus_attempt',
                    cell: valueCell('5_plus_attempt'),
                    footer: () => <strong>{totals['5_plus_attempt']}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: '5_plus_attempt_percent',
                    header: () => null,
                    cell: percentCell('5_plus_attempt_percent'),
                    footer: () => <strong>{totals['5_plus_attempt_percent']}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= TOTAL ATTEMPTED DELIVERY ================= */
        {
            header: 'Total Attempted Delivery',
            footer: () => null,
            columns: [
                {
                    id: 'total_attempted_delivery',
                    header: () => null,
                    accessorKey: 'total_attempted_delivery',
                    footer: () => <strong>{totals.total_attempted_delivery}</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= PENDING FOR DELIVERY ================= */
        {
            header: 'Pending For Delivery',
            footer: () => null,
            columns: [
                {
                    id: 'pending_for_delivery',
                    header: () => null,
                    accessorKey: 'pending_for_delivery',
                    footer: () => <strong>{totals.pending_for_delivery}</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= OVERALL TOTAL SHIPMENTS ================= */
        {
            header: 'Overall Total Shipments',
            footer: () => null,
            columns: [
                {
                    id: 'overall_total_shipments',
                    header: () => null,
                    accessorKey: 'overall_total_shipments',
                    footer: () => <strong>{totals.overall_total_shipments}</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

    ], [totals]);

    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
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
            const records = await GetBookingList(GET_ATTEMPT_WISE_DELIVARY_REPORT, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setAllEntries(records)
                setFirstMiles(records?.first_mile_summary_list || [])
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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Attempt-wise Delivery Performance"
                subTitle="Region and service-center level attempt outcomes."
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- see LastMileOperations.jsx for the reasoning:
                    checkboxes in the dropdown replace the chip strip beside
                    the control, and every field wraps to the next line rather
                    than push the row past the card. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Region
                        </Label>
                        <Select
                            options={AllRegions}
                            placeholder="Search Region"
                            value={SelectedRegion}
                            onChange={setSelectedRegion}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Service Center
                        </Label>
                        <Select
                            options={ServiceCenterOption}
                            placeholder="Search Service Center"
                            value={SelectedServiceCenters}
                            onChange={setSelectedServiceCenters}
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Date Range
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={handleChange}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Payment Mode
                        </Label>
                        <Select
                            options={paymentModeOptions}
                            placeholder="Search Customer"
                            value={PaymentMode}
                            onChange={setPaymentMode}
                            isClearable={true}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <Button
                        color="primary"
                        disabled={bookingLoading}
                        className="h-9.5 shrink-0 px-6"
                        onClick={OnCheckClick}
                    >
                        Check
                    </Button>
                </div>

                <div className="page-fit-body mt-4">
                    {
                        bookingLoading ? <Loader message="Loading Operation Performance ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={columns}
                                data={SecondMiles || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                isCustomPageSize={true}
                                isDownloadExcle={true}
                                fillHeight
                                tableHeight="72vh"
                                onDownloadExcle={async () => {
                                    let rowData = BookingData;
                                    let newHeaders = Object.keys(BookingData[0]).map(ele => {
                                        return ele
                                    })
                                    await AttemptWiseReport(SecondMiles, "Operations_attempt_strike_rate", {
                                        sheetName: "Operation_Performance",
                                        headers: newHeaders,
                                        rows: rowData
                                    },
                                        SelectedPayload,
                                        FinalStatusCount
                                    )
                                }}
                                ExcleLoading={AttemptWiseLoading}
                            />
                        )
                    }
                </div>
            </div>
        </div>
    )
}
export default AttemptWisePerformance