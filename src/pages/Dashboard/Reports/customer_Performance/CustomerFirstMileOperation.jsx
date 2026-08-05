import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from "@/components/ui";
import { Button, FormFeedback, Input, Label, Table } from "@/components/ui";
import DateRangeInput from "../../../../components/Common/DateRangeInput";

import Select from 'react-select'
import { GET_ADMIN_BOOKING_DETAILS, GET_CUSTOMER_SERVICE, GET_OPERATION_PERFORMANCE, GET_USER_API, PRODUCT_LIST, SPD_OPERATION_PERFORMANCE, GET_ALL_REGION, GET_CUSTOMER_PERFORMANCE_FPDR } from '../../../../api';
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import Loader from "@/Loaders/Loader";
import { IoMdCloudDownload } from "react-icons/io";
import TableContainer from '../../../../components/Table/TableContainer';
import { customStyles, CheckboxOption, SelectedCountValue } from '../../../../helpers/CustomStyle';
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
import MainHeaderComp from '../../../../components/MainHeaderCom';

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
    menuPosition: "fixed",
};

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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Customer Pickup Strike Rate (FPSR)"
                subTitle="Region and service-center level pickup TAT for one customer."
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
                            Select Date Range
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            isBorder={true}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Customer
                        </Label>
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
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Payment Mode
                        </Label>
                        <Select
                            options={paymentModeOptions}
                            placeholder="Search Payment Mode"
                            value={PaymentMode}
                            onChange={setPaymentMode}
                            isClearable={true}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                            styles={customStyles}
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

                {Object.keys(FinalStatusCount).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {Object.entries(FinalStatusCount).map(([key, value]) => (
                            <StatsCard key={key} label={key} value={value} />
                        ))}
                    </div>
                )}

                <div className="page-fit-body mt-4">
                    {
                        bookingLoading ? <Loader message="Loading customer Performance ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={LastMilecolumns}
                                data={FirstMiles || []}
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
                        )
                    }
                </div>
            </div>
        </div>
    )
}
export default CustomerFirstMileOperation