import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Col, FormGroup, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from "reactstrap";
import {
    MdAccessTime, MdCalendarMonth, MdCurrencyRupee, MdDateRange,
    MdHistory, MdLocalShipping, MdToday, MdTrendingDown, MdTrendingFlat, MdTrendingUp,
} from "react-icons/md";
import { GridLoader } from "react-spinners";
import { toast } from "react-toastify";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { REVENUE_DAILY_REPORT } from "../../../api";
import { formatAsOf, formatINRCompact, formatInt, longDate } from "./DailyRevenue/revenueFormat";

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
            ? <span className="text-success fw-semibold">▲ {text}</span>
            : <span className="text-danger fw-semibold">▼ {text}</span>;
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
        ],
    },
    {
        id: "same_day_last_month",
        header: shortDate(labels.same_day_last_month) || "Same Day Last Month",
        columns: [
            { id: "sdlm_volume", header: "Volume", accessorKey: "same_day_last_month.volume", enableColumnFilter: false, cell: plainCell },
            { id: "sdlm_revenue", header: "Revenue", accessorKey: "same_day_last_month.revenue", enableColumnFilter: false, cell: plainCell },
        ],
    },
    {
        id: "day_variation",
        header: "Day Variation",
        columns: [
            { id: "dv_volume", header: "Volume", accessorKey: "day_variation.volume", enableColumnFilter: false, cell: trendVolumeCell },
            { id: "dv_revenue", header: "Revenue", accessorKey: "day_variation.revenue", enableColumnFilter: false, cell: trendRevenueCell },
        ],
    },
    {
        id: "day_variation_pct",
        header: "Day Variation %",
        columns: [
            { id: "dvp_volume", header: "Volume", accessorKey: "day_variation_pct.volume", enableColumnFilter: false, cell: trendPctCell },
            { id: "dvp_revenue", header: "Revenue", accessorKey: "day_variation_pct.revenue", enableColumnFilter: false, cell: trendPctCell },
        ],
    },
    {
        id: "mtd",
        header: labels.mtd_range || "MTD",
        columns: [
            { id: "mtd_volume", header: "Volume", accessorKey: "mtd.volume", enableColumnFilter: false, cell: plainCell },
            { id: "mtd_revenue", header: "Revenue", accessorKey: "mtd.revenue", enableColumnFilter: false, cell: plainCell },
        ],
    },
    {
        id: "same_span_last_month",
        header: labels.same_span_last_month_range || "Same Span Last Month",
        columns: [
            { id: "sslm_volume", header: "Volume", accessorKey: "same_span_last_month.volume", enableColumnFilter: false, cell: plainCell },
            { id: "sslm_revenue", header: "Revenue", accessorKey: "same_span_last_month.revenue", enableColumnFilter: false, cell: plainCell },
        ],
    },
    {
        id: "mtd_variation",
        header: "MTD Variation",
        columns: [
            { id: "mtdv_volume", header: "Volume", accessorKey: "mtd_variation.volume", enableColumnFilter: false, cell: trendVolumeCell },
            { id: "mtdv_revenue", header: "Revenue", accessorKey: "mtd_variation.revenue", enableColumnFilter: false, cell: trendRevenueCell },
        ],
    },
    {
        id: "mtd_variation_pct",
        header: "MTD Variation %",
        columns: [
            { id: "mtdvp_volume", header: "Volume", accessorKey: "mtd_variation_pct.volume", enableColumnFilter: false, cell: trendPctCell },
            { id: "mtdvp_revenue", header: "Revenue", accessorKey: "mtd_variation_pct.revenue", enableColumnFilter: false, cell: trendPctCell },
        ],
    },
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

// soft tinted background from a hex accent (e.g. "#556ee6" -> "rgba(85,110,230,0.12)")
const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
};

const TREND_COLOR = { up: "#34c38f", down: "#f46a6a", flat: "#74788d" };
const TREND_ICON = { up: MdTrendingUp, down: MdTrendingDown, flat: MdTrendingFlat };

const StatTile = ({ title, icon: Icon, accent, value, delta, deltaValueText, comparisonLabel }) => {
    const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    const TrendIcon = TREND_ICON[trend];
    const trendColor = TREND_COLOR[trend];
    return (
        <Card className="border-0 shadow-sm h-100" style={{ borderTop: `3px solid ${accent}` }}>
            <CardBody className="px-3 py-2">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <span
                        className="fw-bold text-uppercase rounded px-2 py-1"
                        style={{ fontSize: "11.5px", letterSpacing: ".5px", background: tint(accent), color: accent }}
                    >
                        {title}
                    </span>
                    <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{ width: 34, height: 34, background: tint(accent), color: accent }}
                    >
                        <Icon size={18} />
                    </span>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: accent }}>{value}</h4>
                <div className="d-flex align-items-center flex-wrap gap-1 small">
                    <span
                        className="d-inline-flex align-items-center gap-1 rounded px-2 py-1 fw-bold"
                        style={{ background: tint(trendColor, 0.14), color: trendColor }}
                    >
                        <TrendIcon size={14} />
                        {deltaValueText}
                    </span>
                    <span className="text-muted">{comparisonLabel}</span>
                </div>
            </CardBody>
        </Card>
    );
};

const InfoPill = ({ icon: Icon, label, value }) => (
    <span className="d-inline-flex align-items-center gap-1 badge bg-light text-dark border fw-normal px-2 py-2">
        <Icon size={14} className="text-primary" />
        <span className="text-muted">{label}:</span>
        <span className="fw-bold">{value}</span>
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
    const [activeTab, setActiveTab] = useState("company");
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

            const res = await fetch(`${REVENUE_DAILY_REPORT}?${params.toString()}`, {
                method: "GET",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const json = await res.json();

            const companyRows = Array.isArray(json?.company_level) ? json.company_level : [];
            const branchRows = Array.isArray(json?.branch_level) ? json.branch_level : [];

            setCompanyData(companyRows);
            setBranchData(branchRows);
            setMeta({ asOf: json?.as_of, labels: json?.labels || {} });

            if (!companyRows.length && !branchRows.length) {
                toast("No revenue data found.", { position: "bottom-right", autoClose: 4000 });
            }
        } catch (err) {
            console.error("Revenue daily report fetch error:", err);
            toast.error(err.message || "Failed to load revenue report.", { position: "bottom-right", autoClose: 5000 });
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

            const res = await fetch(`${REVENUE_DAILY_REPORT}${qs ? `?${qs}` : ""}`, {
                method: "GET",
                credentials: "include",
            });
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
            toast.error("Failed to download report.", { position: "bottom-right", autoClose: 5000 });
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
            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
            defaultPageSize={50}
        />
    );

    return (
        <div className="page-content py-0 px-0">
            <div className="position-sticky bg-white" style={{ top: 0, zIndex: 100 }}>
                <MainHeaderComp title="Revenue Report" />
            </div>

            <div className="container-fluid px-3">
                <Row className="align-items-end pt-3 pb-2">
                    <Col md={3}>
                        <FormGroup className="mb-2">
                            <Label className="mb-1 small fw-semibold">Date (optional)</Label>
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
                    <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "40vh" }}>
                        <GridLoader size={20} />
                        <p className="mt-4 h5">Loading Revenue Report...</p>
                    </div>
                ) : (
                    hasSearched && (
                        <>
                            {summary && (
                                <>
                                    {meta && (
                                        <div className="d-flex flex-wrap align-items-center gap-2 border-top pt-3 pb-3">
                                            <InfoPill icon={MdToday} label="Today" value={longDate(meta.labels.today) || meta.labels.today || "—"} />
                                            <InfoPill icon={MdHistory} label="Same Day Last Month" value={longDate(meta.labels.same_day_last_month) || meta.labels.same_day_last_month || "—"} />
                                            <InfoPill icon={MdDateRange} label="MTD Range" value={meta.labels.mtd_range || "—"} />
                                            <InfoPill icon={MdCalendarMonth} label="Same Span Last Month" value={meta.labels.same_span_last_month_range || "—"} />
                                            <InfoPill icon={MdAccessTime} label="Data as of" value={formatAsOf(meta.asOf)} />
                                        </div>
                                    )}
                                    <Row className="g-3 pb-3">
                                        <Col lg={3} md={6}>
                                            <StatTile
                                                title="Today Volume"
                                                icon={MdLocalShipping}
                                                accent="#50a5f1"
                                                value={formatInt(summary.todayVolume)}
                                                delta={summary.dayVarVolume}
                                                deltaValueText={deltaText(summary.dayVarVolume, "volume")}
                                                comparisonLabel="vs same day last month"
                                            />
                                        </Col>
                                        <Col lg={3} md={6}>
                                            <StatTile
                                                title="Today Revenue"
                                                icon={MdCurrencyRupee}
                                                accent="#556ee6"
                                                value={formatINRCompact(summary.todayRevenue)}
                                                delta={summary.dayVarRevenue}
                                                deltaValueText={deltaText(summary.dayVarRevenue, "revenue")}
                                                comparisonLabel="vs same day last month"
                                            />
                                        </Col>
                                        <Col lg={3} md={6}>
                                            <StatTile
                                                title="MTD Volume"
                                                icon={MdCalendarMonth}
                                                accent="#f1b44c"
                                                value={formatInt(summary.mtdVolume)}
                                                delta={summary.mtdVarVolume}
                                                deltaValueText={deltaText(summary.mtdVarVolume, "volume")}
                                                comparisonLabel="vs same span last month"
                                            />
                                        </Col>
                                        <Col lg={3} md={6}>
                                            <StatTile
                                                title="MTD Revenue"
                                                icon={MdCurrencyRupee}
                                                accent="#34c38f"
                                                value={formatINRCompact(summary.mtdRevenue)}
                                                delta={summary.mtdVarRevenue}
                                                deltaValueText={deltaText(summary.mtdVarRevenue, "revenue")}
                                                comparisonLabel="vs same span last month"
                                            />
                                        </Col>
                                    </Row>
                                </>
                            )}

                            <div className="d-flex align-items-center justify-content-between border-bottom">
                                <Nav tabs className="mb-0 border-bottom-0">
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
                                <span className="badge bg-light text-muted border mb-1">
                                    {(activeTab === "company" ? companyData.length : branchData.length).toLocaleString()} records
                                </span>
                            </div>
                            <div className="pt-3">
                                <TabContent activeTab={activeTab}>
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
