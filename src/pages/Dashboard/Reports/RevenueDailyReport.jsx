import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Col, FormGroup, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "@/components/ui";
import {
    MdAccessTime, MdCalendarMonth, MdCurrencyRupee, MdDateRange,
    MdHistory, MdLocalShipping, MdToday, MdTrendingDown, MdTrendingFlat, MdTrendingUp } from "react-icons/md";
import Loader from "@/Loaders/Loader";
import { toast } from "react-toastify";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { REVENUE_DAILY_REPORT } from "../../../api";
import { formatAsOf, formatINRCompact, formatInt, longDate } from "./DailyRevenue/revenueFormat";
import { AtRiskCustomersCard, RevenueBarChart, RevenueShareDonut, TopMoversChart } from "./RevenueDailyReportCharts";

import { authFetch } from "@/lib/http";
const AT_RISK_MIN_BASELINE = 500;

// "2026-07-20" -> "7/20/2026" (matches how the source system displays the date columns)
const shortDate = (ymd) => {
    if (!ymd) return "";
    const [y, m, d] = ymd.split("-");
    return `${Number(m)}/${Number(d)}/${y}`;
};

// Plain fact columns (today / mtd / same-span comparisons) — no color, just the number
const plainCell = (info) => {
    const v = info.getValue();
    return v === null || v === undefined ? "" : v;
};

// Variation columns — the signal worth calling out, so positive/negative gets a colored arrow
const trendCell = (formatText) => {
    // eslint-disable-next-line react/display-name -- tanstack cell renderer, not an exported component
    return (info) => {
        const v = info.getValue();
        if (v === null || v === undefined) return "";
        const text = formatText(v);
        if (typeof v !== "number" || v === 0) return text;
        return v > 0
            ? <span className="text-success-500 font-semibold">▲ {text}</span>
            : <span className="text-danger-500 font-semibold">▼ {text}</span>;
    };
};

const trendVolumeCell = trendCell((v) => v);
const trendRevenueCell = trendCell((v) => v);
const trendPctCell = trendCell((v) => `${v}%`);

// Each data row nests metric pairs as { volume, revenue } (e.g. row.today.volume) — accessorKey
// supports dot-notation, so columns read straight from the nested shape without flattening rows.
const metricColumnGroups = (labels = {}) => [
    {
        id: "today",
        header: shortDate(labels.today) || "Today",
        columns: [
            { id: "today_volume", header: "Volume", accessorKey: "today.volume", enableColumnFilter: false, cell: plainCell },
            { id: "today_revenue", header: "Revenue", accessorKey: "today.revenue", enableColumnFilter: false, cell: plainCell },
        ] },
    {
        id: "same_day_last_month",
        header: shortDate(labels.same_day_last_month) || "Same Day Last Month",
        columns: [
            { id: "sdlm_volume", header: "Volume", accessorKey: "same_day_last_month.volume", enableColumnFilter: false, cell: plainCell },
            { id: "sdlm_revenue", header: "Revenue", accessorKey: "same_day_last_month.revenue", enableColumnFilter: false, cell: plainCell },
        ] },
    {
        id: "day_variation",
        header: "Day Variation",
        columns: [
            { id: "dv_volume", header: "Volume", accessorKey: "day_variation.volume", enableColumnFilter: false, cell: trendVolumeCell },
            { id: "dv_revenue", header: "Revenue", accessorKey: "day_variation.revenue", enableColumnFilter: false, cell: trendRevenueCell },
        ] },
    {
        id: "day_variation_pct",
        header: "Day Variation %",
        columns: [
            { id: "dvp_volume", header: "Volume", accessorKey: "day_variation_pct.volume", enableColumnFilter: false, cell: trendPctCell },
            { id: "dvp_revenue", header: "Revenue", accessorKey: "day_variation_pct.revenue", enableColumnFilter: false, cell: trendPctCell },
        ] },
    {
        id: "mtd",
        header: labels.mtd_range || "MTD",
        columns: [
            { id: "mtd_volume", header: "Volume", accessorKey: "mtd.volume", enableColumnFilter: false, cell: plainCell },
            { id: "mtd_revenue", header: "Revenue", accessorKey: "mtd.revenue", enableColumnFilter: false, cell: plainCell },
        ] },
    {
        id: "same_span_last_month",
        header: labels.same_span_last_month_range || "Same Span Last Month",
        columns: [
            { id: "sslm_volume", header: "Volume", accessorKey: "same_span_last_month.volume", enableColumnFilter: false, cell: plainCell },
            { id: "sslm_revenue", header: "Revenue", accessorKey: "same_span_last_month.revenue", enableColumnFilter: false, cell: plainCell },
        ] },
    {
        id: "mtd_variation",
        header: "MTD Variation",
        columns: [
            { id: "mtdv_volume", header: "Volume", accessorKey: "mtd_variation.volume", enableColumnFilter: false, cell: trendVolumeCell },
            { id: "mtdv_revenue", header: "Revenue", accessorKey: "mtd_variation.revenue", enableColumnFilter: false, cell: trendRevenueCell },
        ] },
    {
        id: "mtd_variation_pct",
        header: "MTD Variation %",
        columns: [
            { id: "mtdvp_volume", header: "Volume", accessorKey: "mtd_variation_pct.volume", enableColumnFilter: false, cell: trendPctCell },
            { id: "mtdvp_revenue", header: "Revenue", accessorKey: "mtd_variation_pct.revenue", enableColumnFilter: false, cell: trendPctCell },
        ] },
];

const COMPANY_IDENTITY_LEAVES = [
    { header: "SrNo", accessorKey: "srno", enableColumnFilter: false, enableSorting: false },
    { header: "Customer Group", accessorKey: "customer_group", enableColumnFilter: false, enableSorting: true },
    { header: "Customer Name", accessorKey: "customer_name", enableColumnFilter: false, enableSorting: true },
    { header: "Product", accessorKey: "product", enableColumnFilter: false, enableSorting: true },
];

const BRANCH_IDENTITY_LEAVES = [
    ...COMPANY_IDENTITY_LEAVES,
    { header: "Region", accessorKey: "region", enableColumnFilter: false, enableSorting: true },
    { header: "Branch", accessorKey: "dest_sc", enableColumnFilter: false, enableSorting: true },
    { header: "Pincode", accessorKey: "drop_pincode", enableColumnFilter: false, enableSorting: true },
];

// Grouped under a blank header so row 1 shows one empty cell above these columns, matching the metric groups below
const COMPANY_IDENTITY_COLUMNS = [{ id: "identity", header: "", columns: COMPANY_IDENTITY_LEAVES }];
const BRANCH_IDENTITY_COLUMNS = [{ id: "identity", header: "", columns: BRANCH_IDENTITY_LEAVES }];

// soft tinted background from a hex accent (e.g. "#3B82F6" -> "rgba(85,110,230,0.12)")
const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
};

const TREND_COLOR = { up: "#22C55E", down: "#EF4444", flat: "#94A3B8" };
const TREND_ICON = { up: MdTrendingUp, down: MdTrendingDown, flat: MdTrendingFlat };

const StatTile = ({ title, icon: Icon, accent, value, delta, deltaValueText, comparisonLabel }) => {
    const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const TrendIcon = TREND_ICON[trend];
    const trendColor = TREND_COLOR[trend];
    return (
        <Card className="h-full" style={{ borderTop: `3px solid ${accent}` }}>
            <CardBody className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                    <span
                        className="font-bold uppercase rounded px-2 py-1"
                        style={{ fontSize: "11.5px", letterSpacing: ".5px", background: tint(accent), color: accent }}
                    >
                        {title}
                    </span>
                    <span
                        className="inline-flex items-center justify-center rounded-full"
                        style={{ width: 34, height: 34, background: tint(accent), color: accent }}
                    >
                        <Icon size={18} />
                    </span>
                </div>
                <h4 className="font-bold mb-2" style={{ color: accent }}>{value}</h4>
                <div className="flex items-center flex-wrap gap-1 text-xs">
                    <span
                        className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold"
                        style={{ background: tint(trendColor, 0.14), color: trendColor }}
                    >
                        <TrendIcon size={14} />
                        {deltaValueText}
                    </span>
                    <span className="text-ink-muted">{comparisonLabel}</span>
                </div>
            </CardBody>
        </Card>
    );
};

// Sums row.mtd.revenue grouped by keyFn(row), sorted highest first
const aggregateMtdRevenue = (rows, keyFn) => {
    const map = new Map();
    for (const row of rows) {
        const key = keyFn(row) || "—";
        map.set(key, (map.get(key) || 0) + (row.mtd?.revenue ?? 0));
    }
    return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
};

// Same as above, but also carries the same-span-last-month baseline for side-by-side comparison
const aggregateMtdWithBaseline = (rows, keyFn) => {
    const map = new Map();
    for (const row of rows) {
        const key = keyFn(row) || "—";
        const cur = map.get(key) || { value: 0, compareValue: 0 };
        cur.value += row.mtd?.revenue ?? 0;
        cur.compareValue += row.same_span_last_month?.revenue ?? 0;
        map.set(key, cur);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.value - a.value);
};

const InfoPill = ({ icon: Icon, label, value }) => (
    <span className="inline-flex items-center gap-1 badge bg-canvas text-ink border font-normal px-2 py-2">
        <Icon size={14} className="text-brand-500" />
        <span className="text-ink-muted">{label}:</span>
        <span className="font-bold">{value}</span>
    </span>
);

const RevenueDailyReport = () => {
    useEffect(() => {
        document.title = "Revenue Report";
    }, []);

    const today = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState("");
    const [companyData, setCompanyData] = useState([]);
    const [branchData, setBranchData] = useState([]);
    const [meta, setMeta] = useState(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        setCompanyData([]);
        setBranchData([]);
        setMeta(null);
        try {
            const params = new URLSearchParams({ format: "json" });
            if (selectedDate) params.set("date", selectedDate);

            const res = await authFetch(`${REVENUE_DAILY_REPORT}?${params.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: { Accept: "application/json" } });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();

            const companyRows = Array.isArray(json?.company_level) ? json.company_level : [];
            const branchRows = Array.isArray(json?.branch_level) ? json.branch_level : [];

            setCompanyData(companyRows);
            setBranchData(branchRows);
            setMeta({ asOf: json?.as_of, labels: json?.labels || {} });

            if (!companyRows.length && !branchRows.length) {
                toast("No revenue data found.", { autoClose: 4000 });
            }
        } catch (err) {
            console.error("Revenue daily report fetch error:", err);
            toast.error(err.message || "Failed to load revenue report.", { autoClose: 5000 });
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const downloadExcel = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams();
            if (selectedDate) params.set("date", selectedDate);
            const qs = params.toString();

            const res = await authFetch(`${REVENUE_DAILY_REPORT}${qs ? `?${qs}` : ""}`, {
                method: "GET",
                credentials: "include" });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Revenue_Daily_Report_${selectedDate || "all"}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Revenue daily report download error:", err);
            toast.error("Failed to download report.", { autoClose: 5000 });
        } finally {
            setIsExporting(false);
        }
    };

    const companyColumns = useMemo(
        () => [...COMPANY_IDENTITY_COLUMNS, ...metricColumnGroups(meta?.labels)],
        [meta]
    );
    const branchColumns = useMemo(
        () => [...BRANCH_IDENTITY_COLUMNS, ...metricColumnGroups(meta?.labels)],
        [meta]
    );

    const summary = useMemo(() => {
        if (!companyData.length) return null;
        return companyData.reduce((acc, row) => {
            acc.todayVolume += row.today?.volume ?? 0;
            acc.todayRevenue += row.today?.revenue ?? 0;
            acc.mtdVolume += row.mtd?.volume ?? 0;
            acc.mtdRevenue += row.mtd?.revenue ?? 0;
            acc.dayVarVolume += row.day_variation?.volume ?? 0;
            acc.dayVarRevenue += row.day_variation?.revenue ?? 0;
            acc.mtdVarVolume += row.mtd_variation?.volume ?? 0;
            acc.mtdVarRevenue += row.mtd_variation?.revenue ?? 0;
            return acc;
        }, { todayVolume: 0, todayRevenue: 0, mtdVolume: 0, mtdRevenue: 0, dayVarVolume: 0, dayVarRevenue: 0, mtdVarVolume: 0, mtdVarRevenue: 0 });
    }, [companyData]);

    const topCustomers = useMemo(
        () => aggregateMtdWithBaseline(companyData, (r) => r.customer_name).slice(0, 10),
        [companyData]
    );
    const byCustomerGroup = useMemo(
        () => aggregateMtdRevenue(companyData, (r) => r.customer_group),
        [companyData]
    );
    const byProduct = useMemo(
        () => aggregateMtdRevenue(companyData, (r) => r.product),
        [companyData]
    );
    const byRegion = useMemo(
        () => aggregateMtdRevenue(branchData, (r) => r.region).slice(0, 15),
        [branchData]
    );
    // Same customers and order as topCustomers (not an independent gainers/decliners scan) so
    // both charts can be read side by side — variation is just each customer's MTD minus baseline.
    const topMovers = useMemo(
        () => topCustomers.map((c) => ({
            key: c.key,
            value: c.value - c.compareValue,
            mtdRevenue: c.value,
            baselineRevenue: c.compareValue })),
        [topCustomers]
    );

    // Ranked by % decline (not absolute revenue) so small customers collapsing don't get
    // buried under bigger accounts — filtered to a minimum baseline to avoid near-zero-base noise.
    const atRiskCustomers = useMemo(() => {
        const map = new Map();
        for (const row of companyData) {
            const key = row.customer_name || "—";
            const cur = map.get(key) || { mtdRevenue: 0, baselineRevenue: 0 };
            cur.mtdRevenue += row.mtd?.revenue ?? 0;
            cur.baselineRevenue += row.same_span_last_month?.revenue ?? 0;
            map.set(key, cur);
        }
        return [...map.entries()]
            .map(([key, v]) => ({
                key,
                mtdRevenue: v.mtdRevenue,
                baselineRevenue: v.baselineRevenue,
                pctChange: v.baselineRevenue > 0 ? ((v.mtdRevenue - v.baselineRevenue) / v.baselineRevenue) * 100 : null }))
            .filter((d) => d.baselineRevenue >= AT_RISK_MIN_BASELINE && d.pctChange !== null && d.pctChange < 0)
            .sort((a, b) => a.pctChange - b.pctChange)
            .slice(0, 10);
    }, [companyData]);

    const deltaText = (value, unit) => {
        const sign = value > 0 ? "+" : "";
        return `${sign}${unit === "revenue" ? formatINRCompact(value) : formatInt(value)}`;
    };

    const renderTable = (data, columns) => (
        <TableContainer
            columns={columns}
            data={data}
            isGlobalFilter={true}
            isCustomPageSize={true}
            isDownloadExcle={true}
            isPagination={true}
            onDownloadExcle={downloadExcel}
            ExcleLoading={isExporting}
            SearchPlaceholder="Search from table..."
            pagination="pagination"
            paginationWrapper="dataTables_paginate paging_simple_numbers"
            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
            theadClass="sticky top-0 z-10"
            isStickyHeader={true}
            stickyTop={0}
            tableHeight="62vh"
            defaultPageSize={50}
        />
    );

    return (
        /* No page-fit: a dashboard of stat tiles and stacked tables, taller
           than the viewport by design, so it keeps scrolling. */
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline now,
                it hands the title to the layout's PageHeader. */}
            <MainHeaderComp
                title="Revenue Report"
                subTitle="Daily revenue against the previous period, by branch."
            />

            <div className="container-fluid px-4">
                <Row className="items-end pt-4 pb-2">
                    <Col md={3}>
                        <FormGroup className="mb-2">
                            <Label className="mb-1 text-xs font-semibold">Date (optional)</Label>
                            <Input
                                type="date"
                                max={today}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={3} className="mb-2">
                        <Button color="primary" onClick={fetchReport} disabled={loading} style={{ height: "38px" }}>
                            {loading ? "Submitting..." : "Submit"}
                        </Button>
                    </Col>
                </Row>

                {loading ? (
                    <Loader message="Loading Revenue Report..." fullscreen={false} />
                ) : (
                    hasSearched && (
                        <>
                            {summary && (
                                <>
                                    {meta && (
                                        <div className="flex flex-wrap items-center gap-2 border-top pt-4 pb-4">
                                            <InfoPill icon={MdToday} label="Today" value={longDate(meta.labels.today) || meta.labels.today || "—"} />
                                            <InfoPill icon={MdHistory} label="Same Day Last Month" value={longDate(meta.labels.same_day_last_month) || meta.labels.same_day_last_month || "—"} />
                                            <InfoPill icon={MdDateRange} label="MTD Range" value={meta.labels.mtd_range || "—"} />
                                            <InfoPill icon={MdCalendarMonth} label="Same Span Last Month" value={meta.labels.same_span_last_month_range || "—"} />
                                            <InfoPill icon={MdAccessTime} label="Data as of" value={formatAsOf(meta.asOf)} />
                                        </div>
                                    )}
                                    {/* Grid, not Row/Col: one gap value for both axes, so the four
                                        tiles keep the same spacing when they wrap. */}
                                    <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                            <StatTile
                                                title="Today Volume"
                                                icon={MdLocalShipping}
                                                accent="#38BDF8"
                                                value={formatInt(summary.todayVolume)}
                                                delta={summary.dayVarVolume}
                                                deltaValueText={deltaText(summary.dayVarVolume, "volume")}
                                                comparisonLabel="vs same day last month"
                                            />
                                        </div>
                                        <div>
                                            <StatTile
                                                title="Today Revenue"
                                                icon={MdCurrencyRupee}
                                                accent="#3B82F6"
                                                value={formatINRCompact(summary.todayRevenue)}
                                                delta={summary.dayVarRevenue}
                                                deltaValueText={deltaText(summary.dayVarRevenue, "revenue")}
                                                comparisonLabel="vs same day last month"
                                            />
                                        </div>
                                        <div>
                                            <StatTile
                                                title="MTD Volume"
                                                icon={MdCalendarMonth}
                                                accent="#F59D0E"
                                                value={formatInt(summary.mtdVolume)}
                                                delta={summary.mtdVarVolume}
                                                deltaValueText={deltaText(summary.mtdVarVolume, "volume")}
                                                comparisonLabel="vs same span last month"
                                            />
                                        </div>
                                        <div>
                                            <StatTile
                                                title="MTD Revenue"
                                                icon={MdCurrencyRupee}
                                                accent="#22C55E"
                                                value={formatINRCompact(summary.mtdRevenue)}
                                                delta={summary.mtdVarRevenue}
                                                deltaValueText={deltaText(summary.mtdVarRevenue, "revenue")}
                                                comparisonLabel="vs same span last month"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center justify-between border-bottom">
                                <Nav tabs className="mb-0 border-bottom-0">
                                    <NavItem>
                                        <NavLink
                                            active={activeTab === "dashboard"}
                                            onClick={() => setActiveTab("dashboard")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Dashboard
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            active={activeTab === "company"}
                                            onClick={() => setActiveTab("company")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Company Level
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            active={activeTab === "branch"}
                                            onClick={() => setActiveTab("branch")}
                                            style={{ cursor: "pointer" }}
                                        >
                                            Branch Level
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                                {activeTab !== "dashboard" && (
                                    <span className="badge bg-canvas text-ink-muted border mb-1">
                                        {(activeTab === "company" ? companyData.length : branchData.length).toLocaleString()} records
                                    </span>
                                )}
                            </div>
                            <div className="pt-4">
                                <TabContent activeTab={activeTab}>
                                    <TabPane tabId="dashboard">
                                        {activeTab === "dashboard" && (
                                            <>
                                                <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                    <div>
                                                        <RevenueBarChart
                                                            title="Top 10 Customers by MTD Revenue"
                                                            subtitle="MTD vs same span last month, company level"
                                                            data={topCustomers}
                                                            height={400}
                                                        />
                                                    </div>
                                                    <div>
                                                        <TopMoversChart data={topMovers} height={400} />
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <AtRiskCustomersCard data={atRiskCustomers} minBaseline={AT_RISK_MIN_BASELINE} />
                                                </div>
                                                {/* Grid, not Row/Col: three w-4/12 columns come to exactly
                                                    100%, so the Row's gap-4 pushed the third onto its own
                                                    line. A grid takes the gap out of the track sizing. */}
                                                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <RevenueShareDonut title="MTD Revenue by Customer Group" data={byCustomerGroup} />
                                                    </div>
                                                    <div>
                                                        <RevenueShareDonut title="MTD Revenue by Product" data={byProduct} />
                                                    </div>
                                                    <div>
                                                        <RevenueBarChart
                                                            title="MTD Revenue by Region"
                                                            subtitle="Branch level"
                                                            data={byRegion}
                                                            height={340}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </TabPane>
                                    <TabPane tabId="company">
                                        {activeTab === "company" && renderTable(companyData, companyColumns)}
                                    </TabPane>
                                    <TabPane tabId="branch">
                                        {activeTab === "branch" && renderTable(branchData, branchColumns)}
                                    </TabPane>
                                </TabContent>
                            </div>
                        </>
                    )
                )}
            </div>
        </div>
    );
};

export default RevenueDailyReport;
