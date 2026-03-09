import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, FormGroup, Spinner } from 'reactstrap';
import { Button, FormFeedback, Input, Label, Table } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from '../../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles } from '../../../../helpers/CustomStyle';
import { useGetApiCall } from '../../../../hooks/useGetApiCall';
import { CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT, GET_ADMIN_BOOKING_DETAILS, GET_ALL_REGION, GET_ATTEMPT_WISE_DELIVARY_REPORT, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER, SPD_OPERATION_PERFORMANCE } from '../../../../api';
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
const CustomerAttemptwisePerformance = () => {
    useEffect(() => {
        document.title = "Attempt Wise Delivery Performance";
    }, []);
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };




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
            const records = await GetBookingList(CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setAllEntries(records)
                setFirstMiles(records?.first_mile_summary_list || [])
                setSecondMiles(records?.date_wise_summary || [])
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
        <div className='page-content'>
            <div className="container-fluid">
                <div>
                    <h3 className='pb-3 border-bottom '>Attempt-wise Delivery Performance</h3>
                    <Row className='gx-3 d-flex align-items-center pt-2'>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select options={UserListOptions}
                                    placeholder="Search Customer"
                                    value={username}
                                    onChange={setUsername}
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
                        <Col md={2}>
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

                            {/* <Button color="primary" disabled={true} style={{ height: "2.2rem", width: "100%" }} onClick={OnCheckClick}>
                                Check
                            </Button> */}
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
                                            let rowData = BookingData;
                                            let newHeaders = Object.keys(BookingData[0]).map(ele => {
                                                return ele
                                            })
                                            await AttemptWiseReport(SecondMiles, "Customer_attempt_strike_rate", {
                                                sheetName: "Operation_Performance",
                                                headers: newHeaders,
                                                rows: rowData
                                            },
                                                SelectedPayload
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
export default CustomerAttemptwisePerformance