import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, PUD_OPERATION_PERFORMANCE, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import { GridLoader } from 'react-spinners';
import { IoMdCloudDownload } from "react-icons/io";
// import CustomerServiceFilter from '../../../components/CustomerService/CustomerServiceFilter';
import OperationPerformanceFilter from '../../../components/Report/OperationPerformanceFilter';
import { downloadExcel } from '../../../helpers/downloadExcel';
import { FaCloudDownloadAlt } from 'react-icons/fa';
import { useExcelExport } from '../../../hooks/useExcelExport';
import { useFirstMileExcel } from '../../../hooks/useFirstMileExcel';
import TabsProvider from '../../../components/TabsProvider';
import { useSecondMileExcel } from '../../../hooks/useSecondMileExcel';
import renderCountWithPercent from '../../../components/renderCountWithPercent';
import { useOperationFDSR } from '../../../hooks/useOperationFDSR';
import { useNewOperationPickupStrikeRate } from '../../../hooks/useNewOperationPickupStrikeRate';
import { StatsCard } from '../../../components/FilterComponents/StatsCard';
const FirstMileOperation = () => {
    useEffect(() => {
        document.title = "Operation Performance Report";
    }, []);
    const columns = useMemo(
        () => [
            {
                header: 'Customer Name',
                accessorKey: 'customer_name',  // changed from customer_name to custname
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Date',
                accessorKey: 'awbdate',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'AWB No.',
                accessorKey: 'awbno',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Order No.',
                accessorKey: 'orderno',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Reference',
                accessorKey: 'ref2',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Consignee Name',
                accessorKey: 'consignee_name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'City',
                accessorKey: 'consignee_city',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'State',
                accessorKey: 'consignee_state',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Pincode',
                accessorKey: 'billing_pincode',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'ORGSC',
                accessorKey: 'orgsc',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Vendor Name',
                accessorKey: 'vendor_name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Service Center',
                accessorKey: 'service_center',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Checkpnt',
                accessorKey: 'CHKPNT',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Qty',
                accessorKey: 'quantity',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Weight',
                accessorKey: 'weight',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Shipment Value',
                accessorKey: 'shipment_value',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Amount',
                accessorKey: 'total_amount',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Payment Mode',
                accessorKey: 'paymentmode',
                enableColumnFilter: false,
                enableSorting: true,
            },

        ],
        []
    );

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

    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };

    const [FinalStatusCount, setFinalStatusCount] = useState({})
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

    const [SelectedPayload, setSelectedPayload] = useState(null)

    const [username, setUsername] = useState({})
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
    const [SelectedRegion, setSelectedRegion] = useState()
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
                acc.not_picked += Number(row.not_picked || 0);

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
                not_picked: 0,
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
            not_picked_percent
                : ((totals.not_picked / total) * 100).toFixed(2),
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
                    id: 'not_picked',
                    header: () => null,
                    accessorKey: 'not_picked',
                    cell: valueCell('not_picked'),
                    footer: () => <strong>{firstMileTotals.not_picked}</strong>,
                    ...baseColumnConfig,
                },
                {
                    id: 'not_picked_percent',
                    header: () => null,
                    cell: percentCell('not_picked_percent'),
                    footer: () => (
                        <strong>{firstMileTotals.not_picked_percent}%</strong>
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

    // //  first mile report
    // const { downloadExcel, loading: FirstMileLoading, error } = useFirstMileExcel();
    //  first mile report
    const { downloadExcel, loading: FirstMileLoading, error } = useNewOperationPickupStrikeRate();
    //  first mile report
    const { downloadExcel: SecondMileReport, loading: SecondMileLoading, error: SecondMileError } = useSecondMileExcel();
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
            const records = await GetBookingList(PUD_OPERATION_PERFORMANCE, payload);

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
            payment_mode: PaymentMode?.value || "",
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
            loading: SecondMileLoading,
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
                onDownloadExcle={async () => {
                    let rowData = BookingData
                    await SecondMileReport(SecondMiles, "last_mile_summary_list", {
                        sheetName: "Operation_Performance",
                        headers: OperationPerformanceHeads,
                        rows: rowData
                    })
                }}
                ExcleLoading={SecondMileLoading}
            // excelItems={excelItems}
            />
        },
    ]

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
                    <h3 className='pb-3 border-bottom '>Pickup Strike Rate (FPSR)</h3>
                    <Row className='gx-3 d-flex align-items-center pt-2'>
                        {/* <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select options={UserListOptions}
                                    placeholder="Search Customer"
                                    // value={username}
                                    onChange={setUsername}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col> */}
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
                        {/* mode */}
                        {/* Date Range Picker */}
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label>Start Date and End Date</Label>
                                <div style={{ minWidth: "200px" }}>
                                    <DateRangePicker
                                        startDate={selectedRange.startDate}
                                        endDate={selectedRange.endDate}
                                        onChange={handleChange}
                                        className="my-custom-range-picker"
                                    />
                                </div>
                            </FormGroup>
                        </Col>


                        <Col md={3} className=' d-flex align-items-cente align-items-center gap-2 mt-2'>
                            {/* <div className="d-flex 2"> */}
                            <Button color="primary" disabled={bookingLoading} style={{ height: "2.2rem", width: "100%" }} onClick={OnCheckClick}>
                                Check
                            </Button>

                            {/* <Button
                                    color="primary"
                                    className='d-flex justify-content-center align-items-center'
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
                                        onDownloadExcle={async () => {
                                            let rowData = BookingData;
                                            let newHeaders = Object.keys(BookingData[0]).map(ele => {
                                                return ele
                                            })
                                            let secondeMileReportUpdate = [...FirstMiles].map(ele => {
                                                return {
                                                    ...ele,
                                                    same_day_spd: ele?.same_day,
                                                }
                                            })
                                            await downloadExcel(secondeMileReportUpdate, "Pickup_Strike_Rate", {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                SelectedPayload,
                                                FinalStatusCount
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
export default FirstMileOperation