import React, { useEffect, useMemo, useState } from 'react';
import { Button, Label } from "@/components/ui";
import DateRangeInput from '../../../components/Common/DateRangeInput';
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles, CheckboxOption, SelectedCountValue } from '../../../helpers/CustomStyle';
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ALL_REGION, SPD_OPERATION_PERFORMANCE, SPD_OPERATION_PERFORMANCE_EXPORT } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import Loader from "@/Loaders/Loader";
import StatsCard from '../../../components/StatsCard';
import MainHeaderComp from '../../../components/MainHeaderCom';
import { downloadReportExcel } from '../../../helpers/downloadReportExcel';
import ToasterProvider from '../../../helpers/ToasterProvider';

/* Selects that let a user pick several regions or service centers.
   hideSelectedOptions is off and closeMenuOnSelect is off, so ticking one
   option keeps the menu open and the option in view -- CheckboxOption is what
   shows it is now checked, rather than the option disappearing from the list
   the way a single-select-flavoured multi-select normally behaves. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    /* Portals the open menu to <body> rather than letting it render in place.
       The page root now carries .page-fit (overflow:hidden, so the grid can
       be the only thing that scrolls), and a long region or service-center
       list opened near the top of a short window would otherwise get clipped
       at that boundary rather than overlapping the content below it. */
    menuPortalTarget: document.body,
    /* "fixed", not the default "absolute": the default recomputes the portal
       offset from document coordinates once at open, which drifts if the page
       underneath scrolls while the menu is open. "fixed" tracks the control's
       position in the viewport instead. */
    menuPosition: "fixed",
};
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
    // Theme-aware token, not a literal hex -- #555 (dark gray) read fine on
    // the light theme's white table cells but was nearly invisible on the
    // dark theme's own dark surface.
    const percentCell = key => ({ row }) => (
        <span className="text-xs text-ink-muted">
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

    // onCheck button click
    const [BookingData, setBookingData] = useState([])


    //  defining the get booking list 
    const { apifunc: GetBookingList, data: BookingList, loading: bookingLoading } = usePostApiCall()

    const { ErrorToaster } = ToasterProvider()
    const [isExporting, setIsExporting] = useState(false)
    // defining the get regions api
    const { apifunc: GetAllRegions, data: Regions } = useGetApiCall()
    //  calling user api
    useEffect(() => {
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

    // Server-generated xlsx (/export/) -- replaces the old client-side
    // exportToExcel path above, which rebuilt the file in the browser from
    // whatever rows were already on screen. Reuses the exact payload Check
    // already sent, since /export/ is the same report's companion endpoint.
    const handleExportExcel = async () => {
        const updatedDate = formatDateForPayload(selectedRange);
        if (updatedDate?.from_date === "" || updatedDate?.to_date === "") {
            alert("Please select a valid date range");
            return;
        }
        const payload = {
            start_date: updatedDate.from_date,
            end_date: updatedDate.to_date,
            service_center: SelectedServiceCenters.map((ele) => ele?.value) || [],
            region: SelectedRegion?.map((ele) => ele?.value) || [],
        };
        setIsExporting(true);
        try {
            await downloadReportExcel(SPD_OPERATION_PERFORMANCE_EXPORT, payload, "operations_delivery_strike_rate.xlsx");
        } catch (err) {
            ErrorToaster(err.message || "Download failed");
        } finally {
            setIsExporting(false);
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
        /* Same shell as the customer list / AddPod: no background of its own
           (the layout owns the canvas), page-fit so the grid rather than the
           page is what scrolls once there is real height to hand it. */
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Delivery Strike Rate (FDSR)"
                subTitle="Region and service-center level delivery TAT."
            />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters.
                    One flex-wrap row instead of two Bootstrap Row/Col rows --
                    each select used to sit at a fixed 250px inside a
                    percentage-width column, next to a chip strip
                    (SelectedItemsDisplay) with no width limit of its own. Once
                    enough long labels were picked that strip ran past the
                    column and pushed content outside the card. A checkbox in
                    the dropdown now carries the same "what's selected"
                    information, so the control never has to grow past its own
                    width, and every field here has a fixed basis that wraps to
                    the next line instead of overflowing the row. */}
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
                            isBorder={true}
                            value={selectedRange}
                            onChange={handleChange}
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
                    <Button
                        color="secondary"
                        disabled={isExporting}
                        className="h-9.5 shrink-0 px-6"
                        onClick={handleExportExcel}
                    >
                        {isExporting ? "Downloading…" : "Download Report"}
                    </Button>
                </div>

                {Object.keys(FinalStatusCount).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {Object.entries(FinalStatusCount).map(([key, value]) => (
                            <StatsCard key={key} label={key} value={value} />
                        ))}
                    </div>
                )}

                {/* page-fit-body, not a bare div: this is the link in the
                    height chain between the page root and the grid below. */}
                <div className="page-fit-body mt-4">
                    {
                        bookingLoading ? <Loader message="Loading Operation Performance ..." fullscreen={false} /> : (
                            <TableContainer
                                columns={LastMilecolumns}
                                data={SecondMiles || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                /* table-bordered dropped: .grid-shell draws the
                                   row rules now, so it only fought them. */
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                isCustomPageSize={true}
                                /* Rows absorb the leftover height, so the grid
                                   is the only thing on the screen that
                                   scrolls -- same convention as every other
                                   reworked table. */
                                fillHeight
                                /* The sub-992px cap only; fillHeight drops it
                                   above that. */
                                tableHeight="72vh"
                            />
                        )
                    }
                </div>
            </div>
        </div>
    )
}
export default LastMileOperations