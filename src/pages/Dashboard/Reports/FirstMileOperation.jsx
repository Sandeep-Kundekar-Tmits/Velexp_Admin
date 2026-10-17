import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Label, Table } from "@/components/ui";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from '../../../components/Table/TableContainer';
import Select from 'react-select'
import { customStyles, CheckboxOption, SelectedCountValue } from '../../../helpers/CustomStyle';
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_ALL_REGION, GET_USER_API, PRODUCT_LIST, PUD_OPERATION_PERFORMANCE, PUD_OPERATION_PERFORMANCE_EXPORT } from '../../../api';
import usePostApiCall from '../../../hooks/usePostApiCall';
import formatDateForPayload from '../../../helpers/DateHelper';
import Loader from "@/Loaders/Loader";
import { downloadReportExcel } from '../../../helpers/downloadReportExcel';
import ToasterProvider from '../../../helpers/ToasterProvider';
/* The default StatsCard (components/StatsCard), not the FilterComponents one
   this used to import: that one takes title/color/unit/breakdown/isGroup, so
   being called here with just label/value rendered no title and no styling at
   all -- a blank card. This is the same component the rest of the Operation
   Performance / Customer Performance report family renders. */
import StatsCard from '../../../components/StatsCard';
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

// Same TAT-bucket keys the date-wise table columns already use (same_day,
// 1_day..10_day, 10_plus_day, not_picked) -- labels them the same way the
// column headers above read, instead of the raw snake_case key.
const bucketLabel = (key) => {
    if (key === "not_picked") return "Not Picked";
    if (key === "10_plus_day") return "10+ Day";
    const dayMatch = key.match(/^(\d+)_day$/);
    if (dayMatch) return `${dayMatch[1]} Day`;
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// The API's pickup_counter/rto_pickup_counter/pickup_percent are each a
// single aggregate object (one value per TAT bucket, summed across every
// date) -- not rows a TableContainer fits, so each renders as its own small
// table instead. Same "Filters/Summary/Notes/Cache" card pattern
// StatusDailyReport.jsx uses for its own generic object fields.
const SummaryTable = ({ title, entries, suffix = "" }) => (
    <Card className="mb-0">
        <CardBody className="p-0">
            <Table bordered responsive className="mb-0">
                <tbody>
                    <tr className="bg-canvas">
                        <th colSpan={2} className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{title}</th>
                    </tr>
                    {Object.entries(entries || {}).map(([k, v]) => (
                        <tr key={k}>
                            <td className="font-medium text-ink-muted">{bucketLabel(k)}</td>
                            <td className="text-ink">{v ?? 0}{suffix}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </CardBody>
    </Card>
);

const FirstMileOperation = () => {
    useEffect(() => {
        document.title = "Operation Performance Report";
    }, []);
    // Report-wide aggregates the API returns alongside the date-wise rows
    // (total_shipments/rto_shipments plus the pickup_counter/
    // rto_pickup_counter/pickup_percent TAT breakdowns) -- replaces the old
    // final_status_counter the API no longer sends.
    const [Summary, setSummary] = useState(null)
    // payment mode options
    const [paymentModeOptions] = useState([
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
    const [SelectedPayload, setSelectedPayload] = useState(null)

    // first mile data state
    const [FirstMiles, setFirstMiles] = useState([])
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
    const [SelectedRegion, setSelectedRegion] = useState()
    // onCheck button click
    const [BookingData, setBookingData] = useState([])

    // base column config
    const baseColumnConfig = {
        enableColumnFilter: false,
        enableSorting: true,
    };
    // useMemo for the totals of the first mile operations
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

                acc.not_picked += Number(row.not_picked || 0);

                acc.total_shipments += Number(row.total_shipments || 0);
                acc.rto_shipments += Number(row.rto_shipments || 0);

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
                not_picked: 0,
                total_shipments: 0,
                rto_shipments: 0,
            }
        );

        // Not part of the row shape any more (the API dropped it) --
        // picked up is just everything that isn't still "not picked".
        totals.picked_up = totals.total_shipments - totals.not_picked;

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

    // first mile columns
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
                    // Not a field the API sends any more -- derive it the
                    // same way the footer total above does: whatever wasn't
                    // left "not picked".
                    cell: ({ row }) => (
                        <strong>{(row.original.total_shipments || 0) - (row.original.not_picked || 0)}</strong>
                    ),
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

        /* ================= RTO SHIPMENTS ================= */
        {
            header: 'RTO Shipments',
            footer: () => null,
            columns: [
                {
                    id: 'rto_shipments',
                    header: () => null,
                    accessorKey: 'rto_shipments',
                    cell: valueCell('rto_shipments'),
                    footer: () => (
                        <strong>{firstMileTotals.rto_shipments}</strong>
                    ),
                    ...baseColumnConfig,
                },
            ],
        },

    ], [firstMileTotals]);

    //  defining the get booking list 
    const { apifunc: GetBookingList, loading: bookingLoading } = usePostApiCall()

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
                payment_mode: PaymentMode?.value || "",
                region: SelectedRegion?.map(ele => ele?.value) || []
            };
            setSelectedPayload(payload)
            // API call
            const records = await GetBookingList(PUD_OPERATION_PERFORMANCE, payload);

            if (records?.bookings) {
                setBookingData(records?.bookings);
                setFirstMiles(records?.date_wise_summary || [])
                setSummary({
                    total_shipments: records?.total_shipments ?? 0,
                    rto_shipments: records?.rto_shipments ?? 0,
                    pickup_counter: records?.pickup_counter || {},
                    rto_pickup_counter: records?.rto_pickup_counter || {},
                    pickup_percent: records?.pickup_percent || {},
                })
            } else {
                setBookingData([]); // Reset or set to empty array
                setSummary(null)
            }
        } catch (error) {
            console.error("Error in OnCheckClick:", error);
            alert("An error occurred while fetching booking details");
            setBookingData([]); // Reset on error
        }
    };

    // Server-generated xlsx (/export/) -- replaces the old client-side
    // downloadExcel path below, which rebuilt the file in the browser from
    // whatever rows were already on screen.
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
            await downloadReportExcel(PUD_OPERATION_PERFORMANCE_EXPORT, payload, "operations_pickup_strike_rate.xlsx");
        } catch (err) {
            ErrorToaster(err.message || "Download failed");
        } finally {
            setIsExporting(false);
        }
    };

    // use effect for the service center option dropdown
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
                title="Pickup Strike Rate (FPSR)"
                subTitle="Region and service-center level pickup TAT."
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
                    <Button
                        color="secondary"
                        disabled={isExporting}
                        className="h-9.5 shrink-0 px-6"
                        onClick={handleExportExcel}
                    >
                        {isExporting ? "Downloading…" : "Download Report"}
                    </Button>
                </div>

                {Summary && (
                    <div className="mt-4 flex flex-col gap-3">
                        <div className="flex flex-wrap gap-3">
                            <StatsCard label="Total Shipments" value={Summary.total_shipments} />
                            <StatsCard label="RTO Shipments" value={Summary.rto_shipments} />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <SummaryTable title="Pickup TAT (Forward)" entries={Summary.pickup_counter} />
                            <SummaryTable title="Pickup TAT % (Forward)" entries={Summary.pickup_percent} suffix="%" />
                            <SummaryTable title="Pickup TAT (RTO)" entries={Summary.rto_pickup_counter} />
                        </div>
                    </div>
                )}

                <div className="page-fit-body mt-4">
                    {
                        bookingLoading ? <Loader message="Loading Operation Performance ..." fullscreen={false} /> : (
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
                                fillHeight
                                tableHeight="72vh"
                            />
                        )
                    }
                </div>
            </div>
        </div>
    )
}
export default FirstMileOperation