// Daily Revenue — live, auto-refreshing dashboard for GET /reports/revenue_live/?date=YYYY-MM-DD
import React, { useMemo, useState } from "react"
import { Button, Card, CardBody, Col, Collapse, Row, Spinner, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "@/components/ui"
import { MdRefresh, MdKeyboardArrowDown } from "react-icons/md"
import { FaFileExcel } from "react-icons/fa"
import Loader from "@/Loaders/Loader";
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import MainHeaderComp from "../../../../components/MainHeaderCom"
import TableContainer from "../../../../components/Table/TableContainer"
import PageHeaderActions from "../../../../components/VerticalLayout/PageHeaderActions"
import { useExcelExport } from "../../../../hooks/useExcelExport"
import useLiveRevenue from "./useLiveRevenue"
import KpiCards from "./KpiCards"
import RevenueAreaChart from "./charts/RevenueAreaChart"
import HourlyBarChart from "./charts/HourlyBarChart"
import BreakdownDonut from "./charts/BreakdownDonut"
import ProductBarChart from "./charts/ProductBarChart"
import CustomerBarChart from "./charts/CustomerBarChart"
import ServiceCenterMap from "./charts/ServiceCenterMap"
import UnpricedShipments from "./UnpricedShipments"
import RevenueBySource from "./RevenueBySource"
import { formatAsOf, formatINR, formatInt, longDate, pctOfTotal, prevDayISO, todayISO } from "./revenueFormat"

const sortByGross = (arr = []) => [...arr].sort((a, b) => (b?.gross || 0) - (a?.gross || 0))

const DailyRevenue = () => {
    const [date, setDate] = useState(todayISO())
    const { data, loading, refresh } = useLiveRevenue(date)
    const { exportToExcel, isExporting } = useExcelExport()

    // Breakdown tables are collapsed by default — expand on header click.
    // Breakdown tables are collapsed by default — expand on header click.
    const [openTables, setOpenTables] = useState({})
    const toggleTable = (title) => setOpenTables((prev) => ({ ...prev, [title]: !prev[title] }))

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const toggleDropdown = () => setDropdownOpen((prev) => !prev)

    const today = data?.today
    const kpis = data?.kpis
    const totalGross = today?.gross || 0
    const totalNet = today?.net || 0

    // "today"/"yesterday" only when the present date is selected; otherwise show actual dates.
    const isPresentDate = date === todayISO()
    const todayLabel = isPresentDate ? "Today" : longDate(date)
    const yesterdayLabel = isPresentDate ? "Yesterday" : longDate(prevDayISO(date))

    // Column builder shared by all 5 breakdown tables.
    const makeColumns = (labelHeader, labelKey) => [
        { header: labelHeader, accessorKey: labelKey, enableSorting: true },
        { header: "Gross", accessorKey: "gross", enableSorting: true, cell: (c) => formatINR(c.getValue()) },
        { header: "Net", accessorKey: "net", enableSorting: true, cell: (c) => formatINR(c.getValue()) },
        { header: "Shipments", accessorKey: "shipments", enableSorting: true, cell: (c) => formatInt(c.getValue()) },
        { header: "% Gross", id: "pct", cell: (c) => pctOfTotal(c.row.original?.gross, totalGross) },
    ]

    const customerCols = useMemo(() => makeColumns("Customer", "name"), [totalGross])
    const regionCols = useMemo(() => makeColumns("Region", "region"), [totalGross])
    const hubCols = useMemo(() => makeColumns("Hub (ORGSC)", "orgsc"), [totalGross])
    const productCols = useMemo(() => makeColumns("Product", "product"), [totalGross])
    const paymentCols = useMemo(() => makeColumns("Payment Mode", "payment_mode"), [totalGross])

    const customers = useMemo(() => sortByGross(today?.by_customer), [today])
    const regions = useMemo(() => sortByGross(today?.by_region), [today])
    const hubs = useMemo(() => sortByGross(today?.by_hub), [today])
    const products = useMemo(() => sortByGross(today?.by_product), [today])
    const payments = useMemo(() => sortByGross(today?.by_payment_mode), [today])
    const hours = useMemo(
        () => (today?.by_hour || []).map((h) => ({ ...h, label: `${h.hour}:00` })),
        [today]
    )
    const unpriced = today?.unpriced
    const bySource = today?.by_source || []

    const exportRow = (r, labelKey) => ({
        Name: r[labelKey],
        Gross: r.gross,
        Net: r.net,
        Shipments: r.shipments,
        "% Gross": pctOfTotal(r.gross, totalGross),
    })

    const breakdowns = [
        { title: "By Customer", data: customers, cols: customerCols, key: "name" },
        { title: "By Region", data: regions, cols: regionCols, key: "region" },
        { title: "By Hub (ORGSC)", data: hubs, cols: hubCols, key: "orgsc" },
        { title: "By Product", data: products, cols: productCols, key: "product" },
        { title: "By Payment Mode", data: payments, cols: paymentCols, key: "payment_mode" },
    ]

    return (
        <React.Fragment>
            <PageHeaderActions>
                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                    {/* No tag={Button}: Button carries its own default
                        background/height/radius as real Tailwind classes,
                        which stacked on top of table-action-btn's own CSS
                        instead of being replaced by it -- two button "shells"
                        showing through on the one element. The default plain
                        <button> tag applies only the classes passed here. */}
                    <DropdownToggle className="table-action-btn table-action-btn-solid flex items-center gap-1" caret>
                        <FaFileExcel size={15} />
                        <span>{isExporting ? "Exporting..." : "Download Excel"}</span>
                    </DropdownToggle>
                    <DropdownMenu right style={{ zIndex: 99999 }} container="body">
                        <style>{`
                            .excel-dropdown-item:hover {
                                background-color: rgb(var(--overlay-rgb) / 0.06) !important;
                                color: var(--color-ink) !important;
                            }
                        `}</style>
                        {breakdowns.map((b) => (
                            <DropdownItem
                                key={b.title}
                                className="excel-dropdown-item"
                                onClick={() =>
                                    exportToExcel(b.data, `DailyRevenue_${b.title.replace(/\s+/g, "_")}_${date}`, (r) => exportRow(r, b.key))
                                }
                            >
                                {b.title}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </PageHeaderActions>

            {/* No page-fit: this is a dashboard of KPI tiles and charts above
                the grid, taller than the viewport by design, so it keeps
                scrolling rather than being pinned. */}
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                {/* No sticky wrapper: MainHeaderComp draws nothing inline now,
                    it hands the title and these controls to the layout's
                    PageHeader, which is already fixed above the scroll box. */}
                <MainHeaderComp
                    title="Daily Revenue"
                    subTitle="Today against yesterday and month to date."
                    extraFields={
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                                <div className="flex items-center gap-2 shrink-0">
                                    <DatePicker
                                        selected={(() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d) })()}
                                        onChange={(d) => d && setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)}
                                        dateFormat="dd/MM/yyyy"
                                        maxDate={new Date()}
                                        className="form-control form-control-sm"
                                        wrapperClassName="d-inline-block"
                                        style={{ width: 130 }}
                                    />
                                    <Button color="primary" size="sm" onClick={refresh} disabled={loading} className="flex items-center gap-1 shrink-0">
                                        {loading ? <Spinner size="sm" /> : <MdRefresh size={18} />} Refresh
                                    </Button>
                                </div>
                                <div className="text-right">
                                    <div className="text-ink-muted text-xs">
                                        As of <span className="font-semibold">{formatAsOf(data?.as_of)}</span>
                                    </div>
                                    <div className="text-ink-muted" style={{ fontSize: "11px" }}>Auto-refreshing every 5 minutes</div>
                                </div>
                            </div>
                        }
                    />

                <div className="container-fluid relative z-10 px-4 py-4">
                    {!data ? (
                        <Loader message="Loading revenue…" fullscreen={false} />
                    ) : (
                        /*
                         * One gapped column, not a stack of Rows.
                         *
                         * <Row> only supplies horizontal gutters (-mx-2 against
                         * the Cols' px-2) -- it has no vertical spacing of its
                         * own, so the six chart panels sat flush against each
                         * other with no gap between them at all. A flex column
                         * with one gap spaces every panel the same, and the
                         * paired rows below use a grid so their columns line up
                         * on a shared edge instead of each Row negotiating its
                         * own gutters.
                         */
                        <div className="flex flex-col gap-4">
                            <KpiCards
                                today={today}
                                yesterday={kpis?.yesterday}
                                mtd={kpis?.mtd}
                                todayLabel={todayLabel}
                                yesterdayLabel={yesterdayLabel}
                            />

                            {/* Trend (40%) + product mix (60%) side by side */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                <div className="lg:col-span-5">
                                    <RevenueAreaChart rows={kpis?.last_7_days || []} />
                                </div>
                                <div className="lg:col-span-7">
                                    <ProductBarChart rows={products} />
                                </div>
                            </div>

                            {/* Composition — revenue shares, equal halves */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <BreakdownDonut title="Revenue Share by Region" rows={regions} labelKey="region" legendPosition="right" height={340} />
                                <BreakdownDonut title="Revenue Share by Payment Mode" rows={payments} labelKey="payment_mode" legendPosition="right" height={340} />
                            </div>

                            {/* Where — geographic distribution */}
                            <ServiceCenterMap rows={hubs} />

                            {/* When — intraday pattern */}
                            <HourlyBarChart rows={hours} />

                            {/* Who — top customers */}
                            <CustomerBarChart rows={customers} />

                            {/* Unpriced shipments (revenue leakage) */}
                            <UnpricedShipments unpriced={unpriced} />

                            {breakdowns.map((b) => {
                                const isOpen = !!openTables[b.title]
                                return (
                                    <Card key={b.title}>
                                        <CardBody className="p-0">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleTable(b.title)}
                                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTable(b.title)}
                                                className="flex items-center justify-between gap-3 border-b border-white/8 p-4"
                                                style={{ cursor: "pointer", userSelect: "none" }}
                                                aria-expanded={isOpen}
                                            >
                                                <h5 className="mb-0 font-bold">
                                                    {b.title}
                                                    <span className="text-ink-muted font-normal ml-2" style={{ fontSize: "13px" }}>
                                                        ({b.data.length})
                                                    </span>
                                                </h5>
                                                <MdKeyboardArrowDown
                                                    size={24}
                                                    className="text-ink-muted"
                                                    style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                                />
                                            </div>
                                            <Collapse isOpen={isOpen}>
                                                <TableContainer
                                                    columns={b.cols}
                                                    data={b.data}
                                                    isGlobalFilter={true}
                                                    isPagination={true}
                                                    SearchPlaceholder="Search..."
                                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                                                    tableClass="table-hover mb-0"
                                                />
                                            </Collapse>
                                        </CardBody>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}

export default DailyRevenue
