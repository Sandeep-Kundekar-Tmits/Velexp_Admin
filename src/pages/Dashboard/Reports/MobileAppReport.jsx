// Mobile App Report: two status-source breakdowns from the same
// admin-reports family (Bearer auth plus an explicit user_id in the body,
// service centre list sourced from the full directory rather than an
// employee's mapped set) -- Hourly (status-source-hourly, always post-OFD
// now; the old "All Statuses" scope toggle is gone, scope is just never
// sent) and Pre PUD (status-source-prepud, scope is fixed server-side to
// pre_pud so there's nothing to toggle there either). Both share the same
// filter shape (date/service_center/region) and response shape (summary +
// hourly[]), so one Section component renders both.
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Badge, Button, Card, CardBody, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import ToasterProvider from "../../../helpers/ToasterProvider";
import {
    STATUS_SOURCE_HOURLY_REPORT,
    DOWNLOAD_STATUS_SOURCE_HOURLY_REPORT,
    STATUS_SOURCE_PREPUD_REPORT,
    DOWNLOAD_STATUS_SOURCE_PREPUD_REPORT,
} from "../../../api";
import { customStyles } from "../../../helpers/CustomStyle";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
    fetchServiceCenters,
    fetchRegions,
    toServiceCenterOptions,
    toRegionOptions,
} from "@/services/reference.service";
import { authFetch } from "@/lib/http";

const StatBadge = ({ label, value, color = "primary" }) => (
    <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</span>
        <Badge color={color}>{value ?? "—"}</Badge>
    </div>
);

const todayISO = () => new Date().toISOString().split("T")[0];

const humanize = (key) => key
    .replace(/_pct$/, " %")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Cycles through a few colours so a growing/shrinking set of sources (today:
// mobile + system; tomorrow: maybe +desktop, +app) stays visually distinct
// without a hardcoded per-source colour map.
const SUMMARY_COLORS = ["primary", "info", "warning", "success", "secondary", "dark"];

/**
 * One status-source report: its own date/service-centre/region filters,
 * Check/Export Excel, summary strip and hourly table. Used for both the
 * Hourly and Pre PUD sections below -- same request shape (user_id, date?,
 * service_center?, region?), same response shape (summary + hourly[]).
 */
const StatusSourceSection = ({ title, subtitle, fetchUrl, downloadUrl, filenamePrefix, scOptions, regionOptions }) => {
    const { ErrorToaster } = ToasterProvider();

    const [selectedSCs, setSelectedSCs] = useState([]);
    const [region, setRegion] = useState("");
    const [date, setDate] = useState(todayISO());

    const [hourly, setHourly] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // The filter row + summary strip collapse once the table area is
    // scrolled, so the rows get the room back -- reappear once scrolled
    // back near the top. Same pattern as CodPendingReport.jsx.
    const scrollRef = useRef(null);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;
        const onScroll = () => setFiltersCollapsed(el.scrollTop > 8);
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const buildPayload = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const payload = { user_id: authUser?.user?.id };
        if (date) payload.date = date;
        if (selectedSCs.length) payload.service_center = selectedSCs.map((s) => s.value).join(",");
        if (region) payload.region = region;
        return payload;
    };

    const fetchReport = async () => {
        setLoading(true);
        setHasChecked(true);
        try {
            const res = await authFetch(fetchUrl, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                ErrorToaster(json?.error || "Failed to load report");
                setHourly([]);
                setSummary(null);
                return;
            }
            setHourly(Array.isArray(json?.hourly) ? json.hourly : []);
            setSummary(json?.summary ?? null);
        } catch (err) {
            console.error(`${title} fetch error:`, err);
            ErrorToaster("Failed to load report");
            setHourly([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        setIsExporting(true);
        try {
            const res = await authFetch(downloadUrl, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || `Server error: ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filenamePrefix}_${date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`${title} download error:`, err);
            ErrorToaster(err.message || "Download failed");
        } finally {
            setIsExporting(false);
        }
    };

    // Built from whatever keys the first row actually has, rather than a
    // fixed list -- the real API has no "desktop"/"desktop_pct" (only
    // mobile/system today), and a hardcoded column list either showed those
    // as permanently blank or silently dropped a source the backend adds
    // later. "hour" (the raw 0-23 number) is skipped since "label" is its
    // already-formatted "00:00-00:59" form.
    const columns = useMemo(() => {
        if (!hourly.length) return [];
        return Object.keys(hourly[0])
            .filter((key) => key !== "hour")
            .map((key) => ({
                header: humanize(key),
                accessorKey: key,
                cell: ({ getValue }) => {
                    const v = getValue();
                    if (v === null || v === undefined || v === "") return "-";
                    if (typeof v === "number" && key.endsWith("_pct")) return `${v}%`;
                    if (typeof v === "number") return v.toLocaleString();
                    return String(v);
                },
            }));
    }, [hourly]);

    return (
        <div className="mb-6">
            {/* Everything below scrolls together as one area; the filter
                row + summary strip above the table tuck away once that
                scroll moves past the top, so the rows get the screen space
                back. Same pattern as CodPendingReport.jsx. */}
            <div ref={scrollRef} className="scroll-slim" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div
                className="transition-[max-height,opacity] duration-300 ease-out"
                style={filtersCollapsed ? { maxHeight: 0, opacity: 0, overflow: "hidden" } : { maxHeight: 600, opacity: 1, overflow: "hidden" }}
            >
            {/* No heading here -- the tab label above already says
                Post OFD/Pre PUD, so this would just repeat it. */}
            {subtitle && <p className="mb-3 text-xs text-ink-muted">{subtitle}</p>}

            <Card className="mb-3">
                <CardBody className="flex flex-wrap items-end gap-3 py-3">
                    <div className="flex flex-col gap-1.5">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">Date</Label>
                        {/* dd-mm-yyyy display -- a native type="date" input's text
                            is locale-driven and can't be forced to a fixed format,
                            so this uses the same DatePicker + dateFormat pattern
                            DailyRevenue/index.jsx already uses. `date` itself stays
                            a YYYY-MM-DD string (what the API needs); only the
                            displayed text and the picker popup are dd-mm-yyyy. */}
                        <DatePicker
                            selected={(() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d); })()}
                            onChange={(d) => d && setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)}
                            dateFormat="dd-MM-yyyy"
                            maxDate={new Date()}
                            className="form-control form-control-sm"
                            wrapperClassName="d-inline-block"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">Service Centers</Label>
                        <Select
                            isMulti
                            placeholder="All service centers"
                            options={scOptions}
                            value={selectedSCs}
                            onChange={(chosen) => setSelectedSCs(chosen || [])}
                            styles={customStyles}
                            closeMenuOnSelect={false}
                            hideSelectedOptions={false}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:w-40">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">Region</Label>
                        <select
                            className="form-select form-select-sm"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                        >
                            <option value="">All regions</option>
                            {regionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <Button color="primary" onClick={fetchReport} disabled={loading}>
                        {loading ? "Loading..." : "Check"}
                    </Button>
                    <Button
                        color="success"
                        className="ml-auto"
                        onClick={downloadExcel}
                        disabled={isExporting}
                    >
                        {isExporting ? "Exporting..." : "Export Excel"}
                    </Button>
                </CardBody>
            </Card>

            {summary && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {/* One badge per summary field the response actually sends,
                        pairing each source's count with its own "_pct" field
                        (e.g. mobile + mobile_pct -> "22 (8.5%)") instead of a
                        fixed Total/Mobile/Desktop/System list. */}
                    {Object.keys(summary)
                        .filter((key) => !key.endsWith("_pct"))
                        .map((key, i) => {
                            const pctKey = `${key}_pct`;
                            const hasPct = Object.prototype.hasOwnProperty.call(summary, pctKey);
                            const value = typeof summary[key] === "number" ? summary[key].toLocaleString() : summary[key];
                            return (
                                <StatBadge
                                    key={key}
                                    label={humanize(key)}
                                    value={hasPct ? `${value} (${summary[pctKey]}%)` : value}
                                    color={SUMMARY_COLORS[i % SUMMARY_COLORS.length]}
                                />
                            );
                        })}
                </div>
            )}
            </div>

            <div className="page-fit-body mt-1">
                {!hasChecked ? (
                    <p className="text-ink-muted py-6 text-center text-xs">Press Check to load the report</p>
                ) : loading ? (
                    <Loader message={`Loading ${title}...`} fullscreen={false} />
                ) : (
                    <TableContainer
                        columns={columns}
                        data={hourly}
                        isGlobalFilter={false}
                        isPagination={false}
                        tableClass="table-nowrap mb-0"
                        defaultPageSize={24}
                        isStickyHeader={true}
                        stickyTop={0}
                    />
                )}
            </div>
            </div>
        </div>
    );
};

const TABS = [
    { key: "post-ofd", label: "Post OFD" },
    { key: "pre-pud", label: "Pre PUD" },
];

const MobileAppReport = () => {
    useEffect(() => {
        document.title = "Mobile App Report";
    }, []);

    const [activeTab, setActiveTab] = useState(TABS[0].key);

    // ── Service centres & regions (cached 30min via react-query), shared by both tabs ──
    const { data: serviceCenterList } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    });
    const { data: regionList } = useQuery({
        queryKey: qk.reference.regions(),
        queryFn: fetchRegions,
        staleTime: 30 * 60_000,
    });
    const scOptions = useMemo(() => toServiceCenterOptions(serviceCenterList), [serviceCenterList]);
    const regionOptions = useMemo(() => toRegionOptions(regionList), [regionList]);

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Mobile App Report"
                subTitle="Hourly breakdown of status updates by source (mobile / system)."
            />

            <div className="container-fluid page-fit-body px-2">
                <Nav tabs className="nav-tabs-custom nav-justified mb-3">
                    {TABS.map((tab) => (
                        <NavItem key={tab.key}>
                            <NavLink
                                active={activeTab === tab.key}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveTab(tab.key)}
                                className={activeTab === tab.key ? "bg-[#3B82F6]/12 text-[15px] font-bold" : "text-[15px] font-bold"}
                            >
                                {tab.label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeTab}>
                    <TabPane key="post-ofd" tabId="post-ofd">
                        {activeTab === "post-ofd" && (
                            <StatusSourceSection
                                title="Post OFD"
                                subtitle="Status updates by source, after Out-For-Delivery."
                                fetchUrl={STATUS_SOURCE_HOURLY_REPORT}
                                downloadUrl={DOWNLOAD_STATUS_SOURCE_HOURLY_REPORT}
                                filenamePrefix="Mobile_App_Report_PostOFD"
                                scOptions={scOptions}
                                regionOptions={regionOptions}
                            />
                        )}
                    </TabPane>

                    <TabPane key="pre-pud" tabId="pre-pud">
                        {activeTab === "pre-pud" && (
                            <StatusSourceSection
                                title="Pre PUD"
                                subtitle="Status updates by source, scoped to pre-pickup statuses only."
                                fetchUrl={STATUS_SOURCE_PREPUD_REPORT}
                                downloadUrl={DOWNLOAD_STATUS_SOURCE_PREPUD_REPORT}
                                filenamePrefix="Mobile_App_Report_PrePUD"
                                scOptions={scOptions}
                                regionOptions={regionOptions}
                            />
                        )}
                    </TabPane>
                </TabContent>
            </div>
        </div>
    );
};

export default MobileAppReport;
