// Daily Revenue — live, auto-refreshing dashboard for GET /reports/revenue_live/?date=YYYY-MM-DD
import React, { useMemo } from "react"
import { Button, Card, CardBody, Col, Collapse, Row, Spinner } from "reactstrap"
import { MdRefresh, MdKeyboardArrowDown } from "react-icons/md"
import { GridLoader } from "react-spinners"
import { useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import MainHeaderComp from "../../../../components/MainHeaderCom"
import TableContainer from "../../../../components/Table/TableContainer"
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
    const [openTables, setOpenTables] = useState({})
    const toggleTable = (title) => setOpenTables((prev) => ({ ...prev, [title]: !prev[title] }))

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
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp
                        title="Daily Revenue"
                        extraFields={
                            <div className="d-flex align-items-center gap-2 justify-content-end flex-wrap">
                                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                    <DatePicker
                                        selected={(() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d) })()}
                                        onChange={(d) => d && setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)}
                                        dateFormat="dd/MM/yyyy"
                                        maxDate={new Date()}
                                        className="form-control form-control-sm"
                                        wrapperClassName="d-inline-block"
                                        style={{ width: 130 }}
                                    />
                                    <Button color="primary" size="sm" onClick={refresh} disabled={loading} className="d-flex align-items-center gap-1 flex-shrink-0">
                                        {loading ? <Spinner size="sm" /> : <MdRefresh size={18} />} Refresh
                                    </Button>
                                </div>
                                <div className="text-end">
                                    <div className="text-muted small">
                                        As of <span className="fw-semibold">{formatAsOf(data?.as_of)}</span>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: "11px" }}>Auto-refreshing every 5 minutes</div>
                                </div>
                            </div>
                        }
                    />
                </div>

                <div className="container-fluid px-3 py-3">
                    {!data ? (
                        <div style={{ height: "40vh" }} className="d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-4 h6 text-muted">Loading revenue…</p>
                        </div>
                    ) : (
                        <>
                            <KpiCards
                                today={today}
                                yesterday={kpis?.yesterday}
                                mtd={kpis?.mtd}
                                todayLabel={todayLabel}
                                yesterdayLabel={yesterdayLabel}
                            />

                            {/* Trend (40%) + product mix (60%) side by side */}
                            <Row>
                                <Col lg={5}>
                                    <RevenueAreaChart rows={kpis?.last_7_days || []} />
                                </Col>
                                <Col lg={7}>
                                    <ProductBarChart rows={products} />
                                </Col>
                            </Row>

                            {/* Composition — revenue shares grouped in one row (equal size, list on the right) */}
                            <Row>
                                <Col lg={6}>
                                    <BreakdownDonut title="Revenue Share by Region" rows={regions} labelKey="region" legendPosition="right" height={340} />
                                </Col>
                                <Col lg={6}>
                                    <BreakdownDonut title="Revenue Share by Payment Mode" rows={payments} labelKey="payment_mode" legendPosition="right" height={340} />
                                </Col>
                            </Row>

                            {/* Where — geographic distribution */}
                            <Row>
                                <Col lg={12}>
                                    <ServiceCenterMap rows={hubs} />
                                </Col>
                            </Row>

                            {/* When — intraday pattern */}
                            <Row>
                                <Col lg={12}>
                                    <HourlyBarChart rows={hours} />
                                </Col>
                            </Row>

                            {/* Who — top customers */}
                            <Row>
                                <Col lg={12}>
                                    <CustomerBarChart rows={customers} />
                                </Col>
                            </Row>

                            {/* Unpriced shipments (revenue leakage) + revenue by source — below top customers */}
                            <Row>
                                {/* <Col lg={8}> */}
                                <UnpricedShipments unpriced={unpriced} />
                                {/* </Col> */}
                                {/* <Col lg={4}>
                                    <RevenueBySource rows={bySource} />
                                </Col> */}
                            </Row>

                            {breakdowns.map((b) => {
                                const isOpen = !!openTables[b.title]
                                return (
                                    <Card key={b.title} className="shadow-sm border-0 mb-4">
                                        <CardBody className="p-0">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleTable(b.title)}
                                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTable(b.title)}
                                                className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center"
                                                style={{ cursor: "pointer", userSelect: "none" }}
                                                aria-expanded={isOpen}
                                            >
                                                <h5 className="mb-0 fw-bold">
                                                    {b.title}
                                                    <span className="text-muted fw-normal ms-2" style={{ fontSize: "13px" }}>
                                                        ({b.data.length})
                                                    </span>
                                                </h5>
                                                <MdKeyboardArrowDown
                                                    size={24}
                                                    className="text-muted"
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
                                                    isDownloadExcle={true}
                                                    ExcleLoading={isExporting}
                                                    onDownloadExcle={() =>
                                                        exportToExcel(b.data, `DailyRevenue_${b.title.replace(/\s+/g, "_")}_${date}`, (r) => exportRow(r, b.key))
                                                    }
                                                    pagination="pagination pagination-rounded justify-content-end mb-2"
                                                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                                                    tableClass="table-hover mb-0"
                                                />
                                            </Collapse>
                                        </CardBody>
                                    </Card>
                                )
                            })}
                        </>
                    )}
                </div>
            </div>
        </React.Fragment>
    )
}

export default DailyRevenue
