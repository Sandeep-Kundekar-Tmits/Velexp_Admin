import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangeInput from "../../../../components/Common/DateRangeInput";
import TableContainer from '../../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../../hooks/useGetApiCall';
import { CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT, CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_CLONE, GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_ATTEMPT_WISE_DELIVARY_REPORT, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE } from '../../../../api';
import usePostApiCall from '../../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../../helpers/DateHelper';
import { GridLoader } from 'react-spinners';
import { IoMdCloudDownload } from "react-icons/io";
// import CustomerServiceFilter from '../../../components/CustomerService/CustomerServiceFilter';
// import OperationPerformanceFilter from '../../../components/Report/OperationPerformanceFilter';
// import { downloadExcel } from '../../../helpers/downloadExcel';
// import { FaCloudDownloadAlt } from 'react-icons/fa';
import { useExcelExport } from '../../../../hooks/useExcelExport';
import { useFirstMileExcel } from '../../../../hooks/useFirstMileExcel';
// import TabsProvider from '../../../components/TabsProvider';
// import { useSecondMileExcel } from '../../../hooks/useSecondMileExcel';
import { useAttemptWiseExcel } from '../../../../hooks/useAttemptWiseExcel';
import renderCountWithPercent from '../../../../components/renderCountWithPercent';
import { useAttemptWiseExcelClone } from '../../../../hooks/useAttemptWiseExcelClone';
import StatsCard from '../../../../components/StatsCard';
import SelectedItemsDisplay from '../../../../components/Common/SelectedItemsDisplay';
import MainHeaderComp from '../../../../components/MainHeaderCom';
const CustomerAttemptwisePerformanceClone = () => {
    useEffect(() => {
        document.title = "Attempt Wise Delivery Performance";
    }, []);
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };

    const [FinalStatusCount, setFinalStatusCount] = useState({})




    // first mile report
    const FirstMilecolumns = useMemo(
        () => [
            {
                header: 'Date',
                accessorKey: 'date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Same Day',
                accessorKey: 'same_day_spd',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Same Day %',
                accessorKey: 'same_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '1 Day',
                accessorKey: '1_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '1 Day %',
                accessorKey: '1_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '2 Day',
                accessorKey: '2_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '2 Day %',
                accessorKey: '2_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '3 Day',
                accessorKey: '3_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '3 Day %',
                accessorKey: '3_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '4 Day',
                accessorKey: '4_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '4 Day %',
                accessorKey: '4_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '5 Day',
                accessorKey: '5_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '5 Day %',
                accessorKey: '5_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '6 Day',
                accessorKey: '6_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '6 Day %',
                accessorKey: '6_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '7 Day',
                accessorKey: '7_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '7 Day %',
                accessorKey: '7_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '8 Day',
                accessorKey: '8_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '8 Day %',
                accessorKey: '8_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '9 Day',
                accessorKey: '9_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '9 Day %',
                accessorKey: '9_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10 Day',
                accessorKey: '10_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10+ Day',
                accessorKey: '10_plus_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10+ Day %',
                accessorKey: '10_plus_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Bookings',
                accessorKey: 'total_bookings',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );

    const LastMilecolumns = useMemo(
        () => [
            {
                header: 'Date',
                accessorKey: 'date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Same Day',
                accessorKey: 'same_day_spd',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Same Day %',
                accessorKey: 'same_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '1 Day',
                accessorKey: '1_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '1 Day %',
                accessorKey: '1_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '2 Day',
                accessorKey: '2_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '2 Day %',
                accessorKey: '2_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '3 Day',
                accessorKey: '3_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '3 Day %',
                accessorKey: '3_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '4 Day',
                accessorKey: '4_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '4 Day %',
                accessorKey: '4_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '5 Day',
                accessorKey: '5_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '5 Day %',
                accessorKey: '5_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '6 Day',
                accessorKey: '6_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '6 Day %',
                accessorKey: '6_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '7 Day',
                accessorKey: '7_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '7 Day %',
                accessorKey: '7_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '8 Day',
                accessorKey: '8_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '8 Day %',
                accessorKey: '8_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '9 Day',
                accessorKey: '9_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '9 Day %',
                accessorKey: '9_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10 Day',
                accessorKey: '10_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10+ Day',
                accessorKey: '10_plus_day',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: '10+ Day %',
                accessorKey: '10_plus_day_percent',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Shipments',
                accessorKey: 'total_shipments',
                enableColumnFilter: false,
                enableSorting: true,
            },
        ],
        []
    );
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const handleChange = (range) => {
        setSelectedRange(range);
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

    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()

    //  first mile report
    const { downloadExcel, loading: FirstMileLoading, error } = useFirstMileExcel();
    //  first mile report
    // const { downloadExcel: AttemptWiseReport, loading: AttemptWiseLoading, error: AttemptWiseError } = useAttemptWiseExcel();
    const { downloadExcel: AttemptWiseReport, loading: AttemptWiseLoading, error: AttemptWiseError } = useAttemptWiseExcelClone();
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
                acc.total_shipments += Number(row.total_shipments || 0);

                acc.same_day += Number(row.same_day || 0);
                acc.day1 += Number(row.day1 || 0);
                acc.day2 += Number(row.day2 || 0);
                acc.day3 += Number(row.day3 || 0);
                acc.day4 += Number(row.day4 || 0);
                acc.day5 += Number(row.day5 || 0);
                acc.day5_plus += Number(row.day5_plus || 0);

                acc.delivered += Number(row.delivered || 0);
                acc.undelivered += Number(row.undelivered || 0);
                acc.wab += Number(row.wab || 0)
                return acc;
            },
            {
                total_attempted_delivery: 0,
                pending_for_delivery: 0,
                total_shipments: 0,

                same_day: 0,
                day1: 0,
                day2: 0,
                day3: 0,
                day4: 0,
                day5: 0,
                day5_plus: 0,

                delivered: 0,
                undelivered: 0,
                wab: 0
            }
        );

        const total = acc.total_shipments;

        return {
            ...acc,

            /* ================= DELIVERY DAY % ================= */
            same_day_percent: percent(acc.same_day, total),
            day1_percent: percent(acc.day1, total),
            day2_percent: percent(acc.day2, total),
            day3_percent: percent(acc.day3, total),
            day4_percent: percent(acc.day4, total),
            day5_percent: percent(acc.day5, total),
            day5_plus_percent: percent(acc.day5_plus, total),

            /* ================= STATUS % ================= */
            delivered_percent: percent(acc.delivered, total),
            undelivered_percent: percent(acc.undelivered, total),
            wab_percent: percent(acc.wab, total),

            /* ================= SUMMARY % ================= */
            total_attempted_delivery_percent: percent(
                acc.total_attempted_delivery,
                total
            ),
            pending_for_delivery_percent: percent(
                acc.pending_for_delivery,
                total
            ),
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



        /* ================= SAME DAY ================= */
        {
            header: 'Same Day',
            footer: () => null,
            columns: [
                {
                    header: () => null,
                    id: 'same_day',
                    accessorKey: 'same_day',
                    footer: () => <strong>{totals.same_day}</strong>,
                    ...baseColumnConfig,
                },
                {
                    header: () => null,
                    id: 'same_day_percent',
                    accessorKey: 'same_day_percent',
                    cell: percentCell('same_day_percent'),
                    footer: () => <strong>{totals.same_day_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DAY 1 ================= */
        {
            header: 'Day 1',
            footer: () => null,
            columns: [
                {
                    id: 'day1',
                    header: () => null,
                    accessorKey: 'day1',
                    footer: () => <strong>{totals.day1}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day1_percent',
                    header: () => null,
                    accessorKey: 'day1_percent',
                    cell: percentCell('day1_percent'),
                    footer: () => <strong>{totals.day1_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DAY 2 ================= */
        {
            header: 'Day 2',
            footer: () => null,
            columns: [
                {
                    id: 'day2',
                    header: () => null,
                    accessorKey: 'day2',
                    footer: () => <strong>{totals.day2}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day2_percent',
                    header: () => null,
                    accessorKey: 'day2_percent',
                    cell: percentCell('day2_percent'),
                    footer: () => <strong>{totals.day2_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DAY 3 ================= */
        {
            header: 'Day 3',
            footer: () => null,
            columns: [
                {
                    id: 'day3',
                    header: () => null,
                    accessorKey: 'day3',
                    footer: () => <strong>{totals.day3}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day3_percent',
                    header: () => null,
                    accessorKey: 'day3_percent',
                    cell: percentCell('day3_percent'),
                    footer: () => <strong>{totals.day3_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DAY 4 ================= */
        {
            header: 'Day 4',
            footer: () => null,
            columns: [
                {
                    id: 'day4',
                    header: () => null,
                    accessorKey: 'day4',
                    footer: () => <strong>{totals.day4}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day4_percent',
                    header: () => null,
                    accessorKey: 'day4_percent',
                    cell: percentCell('day4_percent'),
                    footer: () => <strong>{totals.day4_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= DAY 5 ================= */
        {
            header: 'Day 5',
            footer: () => null,
            columns: [
                {
                    id: 'day5',
                    header: () => null,
                    accessorKey: 'day5',
                    footer: () => <strong>{totals.day5}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day5_percent',
                    header: () => null,
                    accessorKey: 'day5_percent',
                    cell: percentCell('day5_percent'),
                    footer: () => <strong>{totals.day5_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        /* ================= 5+ DAYS ================= */
        {
            header: '5+ Days',
            footer: () => null,
            columns: [
                {
                    id: 'day5_plus',
                    header: () => null,
                    accessorKey: 'day5_plus',
                    footer: () => <strong>{totals.day5_plus}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'day5_plus_percent',
                    header: () => null,
                    accessorKey: 'day5_plus_percent',
                    cell: percentCell('day5_plus_percent'),
                    footer: () => <strong>{totals.day5_plus_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        {
            header: 'Wab',
            footer: () => null,
            columns: [
                {
                    id: 'wab',
                    header: () => null,
                    accessorKey: 'wab',
                    footer: () => <strong>{totals.wab}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'wab_percent',
                    header: () => null,
                    accessorKey: 'wab_percent',
                    cell: percentCell('wab_percent'),
                    footer: () => <strong>{totals.wab_percent}%</strong>,
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

        /* ================= PENDING ================= */
        {
            header: 'Not Attempted',
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
        /* ================= TOTAL SHIPMENTS ================= */
        {
            header: 'Total Shipments',
            footer: () => null,
            columns: [
                {
                    header: () => null,
                    id: 'total_shipments',
                    accessorKey: 'total_shipments',
                    footer: () => <strong>{totals.total_shipments}</strong>,
                    ...baseColumnConfig,
                },
            ],
        },
        /* ================= DELIVERY STATUS ================= */
        {
            header: 'Delivered',
            footer: () => null,
            columns: [
                {
                    id: 'delivered',
                    header: () => null,
                    accessorKey: 'delivered',
                    footer: () => <strong>{totals.delivered}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'delivered_percent',
                    header: () => null,
                    accessorKey: 'delivered_percent',
                    cell: percentCell('delivered_percent'),
                    footer: () => <strong>{totals.delivered_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

        {
            header: 'Undelivered',
            footer: () => null,
            columns: [
                {
                    id: 'undelivered',
                    header: () => null,
                    accessorKey: 'undelivered',
                    footer: () => <strong>{totals.undelivered}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'undelivered_percent',
                    header: () => null,
                    accessorKey: 'undelivered_percent',
                    cell: percentCell('undelivered_percent'),
                    footer: () => <strong>{totals.undelivered_percent}%</strong>,
                    ...baseColumnConfig,
                },
            ],
        },

    ], [totals]);


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
            const records = await GetBookingList(CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_CLONE, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setAllEntries(records)
                setFirstMiles(records?.first_mile_summary_list || [])
                setSecondMiles(records?.date_wise_summary || [])
                setFinalStatusCount(records?.final_status_counter || {})
                console.log(records?.date_wise_summary, "records?.date_wise_summary")

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

    const DownloadPerformanceDetails = async () => {
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
            mode: SelectedMode?.value || "",
            region: SelectedRegion?.map(ele => ele?.value) || []
        };

        exportToExcel(BookingData, "OperationPerformance", (item) => ({
            'AWB No': item.awbno,
            'AWB Date': item.awbdate,
            'Order No': item.orderno,
            'Reference No': item.ref2,
            'Customer Name': item.customer_name,
            'Consignee Name': item.consignee_name,
            'Consignee City': item.consignee_city,
            'Consignee State': item.consignee_state,
            'Billing Pincode': item.billing_pincode,
            'Origin SC': item.orgsc,
            'Service Center': item.service_center,
            'Vendor Name': item.vendor_name,
            'Vendor Pincode': item.vendor_pincode,
            'Quantity': item.quantity,
            'Weight': item.weight,
            'Shipment Value': item.shipment_value,
            'Total Amount': item.total_amount,
            'Payment Mode': item.paymentmode,
            'RTO AWB No': item.rtoawbno,
            'Destination': item.destination,
            'Freight Charges': item.tot_freight,
            'Invoice No': item.invno,
            'Checkpoint': item.CHKPNT,
            'TAT (Days)': item.tat_days,
            'Delivery Attempts': item.attempts,
        }), payload)
    }

    const OperationPerformanceHeads = [
        "AWB No",
        "AWB Date",
        "Order No",
        "Reference No",
        "Customer Name",
        "Consignee Name",
        "Consignee City",
        "Consignee State",
        "Billing Pincode",
        "Origin SC",
        "Service Center",
        "Vendor Name",
        "Vendor Pincode",
        "Quantity",
        "Weight",
        "Shipment Value",
        "Total Amount",
        "Payment Mode",
        "RTO AWB No",
        "Destination",
        "Freight Charges",
        "Invoice No",
        "Checkpoint",
        "TAT (Days)",
        "Delivery Attempts"
    ]



    //  apply filter 
    const ApplyFilter = (filterObj) => {
        // Default empty filter object if none provided
        const filters = filterObj || {};

        // Filter the BookingData based on all provided filters
        const filteredBooking = BookingList?.bookings?.filter((item) => {
            return Object.entries(filters).every(([key, value]) => {
                // If filter value is empty or undefined, skip this filter
                if (!value || (Array.isArray(value) && value.length === 0)) return true;
                // Handle different filter cases
                switch (key) {
                    case 'checkpt':
                        return item.CHKPNT === value;
                    default:
                        return true;
                }
            });
        });

        // Update the filtered data
        setBookingData(filteredBooking);
        return filteredBooking;
    };

    const excelItems = [
        {
            show: true,
            label: "first_mile_summary_list",
            loading: FirstMileLoading,
            tooltip: "first_mile_summary_list",
            onClick: () => {
                downloadExcel(FirstMiles)
            },
        },
        {
            show: true,
            label: "last_mile_summary_list",
            loading: AttemptWiseLoading,
            tooltip: "last_mile_summary_list",
            onClick: () => {
                // setLoadingIndex(1);
                SecondMileReport(SecondMiles, "last_mile_summary_list")
                // setLoadingIndex(null);
            },
        },
    ];

    const tabComponents = [
        {
            id: 1,
            label: "Operational Performance",
            component: <TableContainer
                columns={columns}
                data={BookingData || []}
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
                onDownloadExcle={DownloadPerformanceDetails}
                ExcleLoading={isExporting}
            // excelItems={excelItems}
            />
        },
        {
            id: 2,
            label: "First Mile Summary List",
            component: <TableContainer
                columns={FirstMilecolumns}
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
                    let rowData = BookingData?.map(item => ({
                        'AWB No': item.awbno,
                        'AWB Date': item.awbdate,
                        'Order No': item.orderno,
                        'Reference No': item.ref2,
                        'Customer Name': item.customer_name,
                        'Consignee Name': item.consignee_name,
                        'Consignee City': item.consignee_city,
                        'Consignee State': item.consignee_state,
                        'Billing Pincode': item.billing_pincode,
                        'Origin SC': item.orgsc,
                        'Service Center': item.service_center,
                        'Vendor Name': item.vendor_name,
                        'Vendor Pincode': item.vendor_pincode,
                        'Quantity': item.quantity,
                        'Weight': item.weight,
                        'Shipment Value': item.shipment_value,
                        'Total Amount': item.total_amount,
                        'Payment Mode': item.paymentmode,
                        'RTO AWB No': item.rtoawbno,
                        'Destination': item.destination,
                        'Freight Charges': item.tot_freight,
                        'Invoice No': item.invno,
                        'Checkpoint': item.CHKPNT,
                        'TAT (Days)': item.tat_days,
                        'Delivery Attempts': item.attempts,
                    }))
                    console.log(rowData, "rowData")
                    await downloadExcel(FirstMiles,
                        "first_mile_report",
                        {
                            sheetName: "Operation_Performance",
                            headers: OperationPerformanceHeads,
                            rows: rowData
                        }
                    )
                }}
                ExcleLoading={FirstMileLoading}
            // excelItems={excelItems}
            />
        },
        {
            id: 3,
            label: "Last Mile Summary List",
            component: <TableContainer
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
                isStickyHeader={true}
                stickyTop={0}
                onDownloadExcle={async () => {
                    let rowData = BookingData
                    await SecondMileReport(SecondMiles, "last_mile_summary_list", {
                        sheetName: "Operation_Performance",
                        headers: OperationPerformanceHeads,
                        rows: rowData
                    })
                }}
                ExcleLoading={AttemptWiseLoading}
            // excelItems={excelItems}
            />
        },
    ]

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
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="Customer Attempt-wise Delivery Performance" subTitle="" />
            </div>
            <div className="container-fluid">
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
                                <Label className='mb-1'>Customer</Label>
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

                    <div className='mt-1'>
                        {
                            bookingLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Operation Performance ...</p>
                            </div>
                                :
                                <>
                                    <TableContainer
                                        columns={columns}
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
                                            const toTitleCase = (str) =>
                                                str
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, (c) => c.toUpperCase());

                                            let rowData = BookingData.map((ele) => {
                                                const result = {};

                                                Object.keys(ele).forEach((key) => {
                                                    // Rename created_date → AWB Date
                                                    const newKey =
                                                        key === "created_date"
                                                            ? "AWB Date"
                                                            : toTitleCase(key);

                                                    result[newKey] = ele[key];
                                                });

                                                return result;
                                            });
                                            let newHeaders = Object.keys(rowData[0]).map(ele => {
                                                return ele
                                            })
                                            await AttemptWiseReport(SecondMiles, "Customer_attempt_strike_rate", {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                SelectedPayload,
                                                FinalStatusCount
                                            )
                                        }}
                                        ExcleLoading={AttemptWiseLoading}
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
export default CustomerAttemptwisePerformanceClone