// Status Daily Report: daily shipment counts by status code, broken down by
// service centre and region. GET, not POST (unlike its sibling admin-reports
// endpoints), and the exact response shape beyond "summary, per service
// centre, per region, cache" isn't documented -- rendered generically here
// (any array-of-objects field becomes its own table, any plain object
// becomes a badge strip) so this keeps working whatever the backend actually
// sends, the same approach MobileAppReport.jsx uses for its own admin-reports
// endpoints.
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button, Card, CardBody, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { customStyles, CheckboxOption, SelectedCountValue } from "../../../helpers/CustomStyle";
import { formatDisplayDate, isIsoDateLike } from "../../../helpers/formatDisplayDate";
import { authFetch } from "@/lib/http";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters, toServiceCenterOptions } from "@/services/reference.service";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { STATUS_DAILY_REPORT, DOWNLOAD_STATUS_DAILY_REPORT, GET_ALL_REGION } from "../../../api";

const MULTI_SELECT_PROPS = {
    closeMenuOnSelect: false,
    hideSelectedOptions: false,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    styles: customStyles,
    menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
    menuPosition: "fixed",
};

const todayISO = () => new Date().toISOString().split("T")[0];
const humanize = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const MAX_STATUS_CODES = 20;

// Every checkpoint code the pickup/drop SC-attribution rule already covers
// (see api/index.js's own note on this endpoint) plus the handful the curl
// examples named directly -- the known vocabulary a daily count actually
// makes sense for. Same checkbox-per-option + selected-count multi-select
// every other report filter here uses, not free text, since these are fixed
// codes, not arbitrary values.
const STATUS_CODE_OPTIONS = [
    "SAO", "LDP", "PUD", "SMR", "ITR", "SOH", "SAM", "SDH", "ITM", "LMT", "SAD",
    "SPU", "FMPNR", "OFP", "PUI", "FMICA", "FMPNA", "FMPUC", "FMVLC", "FMHOC",
    "OFD",
    "SPH", "DRC", "ICA", "CRF", "CNS", "RTA", "CAN", "COS", "ERA", "PUP", "DPT", "RTO", "DIS", "OSA", "ODD", "CNA", "SPL", "SDM", "SDO",
    "RTS",
    "SPD",
].sort().map((code) => ({ value: code, label: code }));

// Array -> comma list (not JSON.stringify's "[\"ABN\"]"), boolean -> Yes/No,
// an ISO date/datetime -> dd-mm-yyyy, everything else as-is.
const formatSummaryValue = (v) => {
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (isIsoDateLike(v)) return formatDisplayDate(v) || v;
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
};

/* One label/value tile. Fixed-size and non-shrinking so a short "Cached:
   false" and a long "Expires At: 16-10-2026 13:33" both stay fully readable
   on one line, instead of the old Badge pills that squeezed arbitrarily
   long text into a pill-shaped box with no minimum width. */
const SummaryTile = ({ label, value }) => (
    <div className="flex shrink-0 flex-col gap-0.5 whitespace-nowrap rounded-lg border border-white/8 bg-white/3 px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</span>
        <span className="text-[13px] font-semibold text-ink">{formatSummaryValue(value)}</span>
    </div>
);

const StatusDailyReport = () => {
    useEffect(() => { document.title = "Status Daily Report"; }, []);
    const { ErrorToaster } = ToasterProvider();

    const [date, setDate] = useState(todayISO());
    const [statusCodes, setStatusCodes] = useState([]);
    const [serviceCenters, setServiceCenters] = useState([]);
    const [region, setRegion] = useState(null);

    const { data: scRaw } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    });
    const scOptions = useMemo(() => toServiceCenterOptions(scRaw), [scRaw]);

    const { apifunc: GetAllRegions, data: RegionsRaw } = useGetApiCall();
    useEffect(() => { GetAllRegions(GET_ALL_REGION); }, [GetAllRegions]);
    const regionOptions = useMemo(() => {
        if (!Array.isArray(RegionsRaw)) return [];
        return RegionsRaw
            .map((ele) => ({ value: ele?.region, label: ele?.region }))
            .filter((item) => item.value)
            .filter((item, index, self) => index === self.findIndex((t) => t.value.toLowerCase() === item.value.toLowerCase()));
    }, [RegionsRaw]);

    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // The filter row + summary strip collapse once the table area is
    // scrolled, so the rows get the room back -- reappear once scrolled
    // back near the top. Same pattern as CodPendingReport.jsx/MobileAppReport.jsx.
    const scrollRef = useRef(null);
    const [filtersCollapsed, setFiltersCollapsed] = useState(false);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;
        const onScroll = () => setFiltersCollapsed(el.scrollTop > 8);
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const handleStatusChange = (opts) => {
        const values = (opts || []).map((o) => o.value);
        if (values.length > MAX_STATUS_CODES) {
            ErrorToaster(`Up to ${MAX_STATUS_CODES} status codes per request`);
            return;
        }
        setStatusCodes(values);
    };

    const buildQuery = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const params = new URLSearchParams();
        params.set("user_id", authUser?.user?.id ?? "");
        params.set("status", statusCodes.join(","));
        params.set("date", date);
        if (region?.value) params.set("region", region.value);
        if (serviceCenters.length) params.set("service_center", serviceCenters.map((s) => s.value).join(","));
        return params.toString();
    };

    const fetchReport = async () => {
        if (!statusCodes.length) { ErrorToaster("Add at least one status code"); return; }
        setLoading(true);
        setHasChecked(true);
        try {
            const res = await authFetch(`${STATUS_DAILY_REPORT}?${buildQuery()}`, { method: "GET" });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                ErrorToaster(json?.error || json?.detail || "Failed to load report");
                setResponse(null);
                return;
            }
            setResponse(json);
        } catch (err) {
            console.error("Status Daily Report fetch error:", err);
            ErrorToaster("Failed to load report");
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        if (!statusCodes.length) { ErrorToaster("Add at least one status code"); return; }
        setIsExporting(true);
        try {
            const res = await authFetch(`${DOWNLOAD_STATUS_DAILY_REPORT}?${buildQuery()}`, { method: "GET" });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || errJson?.detail || `Server error: ${res.status}`);
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // Server names it "<STATUSES>_Daily_Report_<date>.xlsx" -- honour
            // Content-Disposition when present, else build the same name
            // ourselves from what was just sent.
            const disposition = res.headers.get("content-disposition") || "";
            const match = disposition.match(/filename="?([^";]+)"?/i);
            a.download = match ? match[1] : `${statusCodes.join("_")}_Daily_Report_${date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Status Daily Report download error:", err);
            ErrorToaster(err.message || "Download failed");
        } finally {
            setIsExporting(false);
        }
    };

    const arraySections = useMemo(() => {
        if (!response || typeof response !== "object") return [];
        return Object.entries(response)
            .filter(([, v]) => Array.isArray(v) && v.length && typeof v[0] === "object")
            .map(([key, rows]) => ({
                key,
                title: humanize(key),
                rows,
                columns: Object.keys(rows[0]).map((col) => ({
                    header: humanize(col),
                    accessorKey: col,
                    cell: ({ getValue }) => {
                        const v = getValue();
                        return v === null || v === undefined || v === "" ? "—" : String(v);
                    },
                })),
            }));
    }, [response]);

    const objectSections = useMemo(() => {
        if (!response || typeof response !== "object") return [];
        return Object.entries(response)
            .filter(([, v]) => v && typeof v === "object" && !Array.isArray(v))
            .map(([key, obj]) => ({ key, title: humanize(key), entries: Object.entries(obj) }));
    }, [response]);

    // Whichever breakdown arrays the response actually sent (By Region, By
    // Service Center, Hourly, or anything else) as tabs instead of stacked
    // tables -- keeps whatever tab was open if it's still there after a new
    // Check, otherwise falls back to the first one.
    const [activeArrayTab, setActiveArrayTab] = useState(null);
    useEffect(() => {
        setActiveArrayTab((prev) => {
            if (!arraySections.length) return null;
            return arraySections.some((s) => s.key === prev) ? prev : arraySections[0].key;
        });
    }, [arraySections]);

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Status Daily Report"
                subTitle="Daily shipment counts by status, service centre and region."
            />

            {/* scrollRef is the one thing on this screen that scrolls -- a
                plain fixed-height box, not the page-fit/fillHeight cascade
                (that system needs every ancestor wrapper to opt in too, and
                mixing the two left this box with no real bounded height, so
                scrolling it never actually changed its scrollTop and the
                filters/summary stayed collapsed with no way back). Same
                self-contained maxHeight + overflowY approach MobileAppReport.jsx
                already uses for this exact collapse behaviour. */}
            <div ref={scrollRef} className="scroll-slim relative z-10 pb-4" style={{ maxHeight: "78vh", overflowY: "auto" }}>
                <div
                    className="transition-[max-height,opacity] duration-300 ease-out"
                    style={filtersCollapsed ? { maxHeight: 0, opacity: 0, overflow: "hidden" } : { maxHeight: 900, opacity: 1, overflow: "hidden" }}
                >
                    <Card className="mb-3">
                        <CardBody className="flex flex-wrap items-end gap-3 py-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="mb-0 text-xs font-bold text-ink-muted">Date *</Label>
                                {/* dd-mm-yyyy display -- a native type="date" input's text
                                    is locale-driven and can't be forced to a fixed format,
                                    so this uses the same DatePicker + dateFormat pattern
                                    MobileAppReport.jsx already uses. `date` itself stays a
                                    YYYY-MM-DD string (what the API needs). */}
                                <DatePicker
                                    selected={(() => { const [y, m, d] = date.split("-").map(Number); return new Date(y, m - 1, d); })()}
                                    onChange={(d) => d && setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)}
                                    dateFormat="dd-MM-yyyy"
                                    maxDate={new Date()}
                                    className="form-control form-control-sm"
                                    wrapperClassName="d-inline-block"
                                />
                            </div>

                            <div className="flex w-full flex-col gap-1.5 sm:w-80">
                                <Label className="mb-0 text-xs font-bold text-ink-muted">Status Codes * (up to {MAX_STATUS_CODES})</Label>
                                <Select
                                    isMulti
                                    options={STATUS_CODE_OPTIONS}
                                    value={STATUS_CODE_OPTIONS.filter((o) => statusCodes.includes(o.value))}
                                    onChange={handleStatusChange}
                                    placeholder="Select status codes…"
                                    {...MULTI_SELECT_PROPS}
                                />
                            </div>

                            <div className="flex w-full flex-col gap-1.5 sm:w-64">
                                <Label className="mb-0 text-xs font-bold text-ink-muted">Service Centers</Label>
                                <Select
                                    isMulti
                                    options={scOptions}
                                    value={serviceCenters}
                                    onChange={(opts) => setServiceCenters(opts || [])}
                                    placeholder="All service centers"
                                    {...MULTI_SELECT_PROPS}
                                />
                            </div>

                            <div className="flex w-full flex-col gap-1.5 sm:w-56">
                                <Label className="mb-0 text-xs font-bold text-ink-muted">Region</Label>
                                <Select
                                    options={regionOptions}
                                    value={region}
                                    onChange={setRegion}
                                    isClearable
                                    placeholder="All regions"
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            <Button color="primary" onClick={fetchReport} disabled={loading}>
                                {loading ? "Checking…" : "Check"}
                            </Button>
                            <Button color="success" onClick={downloadExcel} disabled={isExporting}>
                                {isExporting ? "Downloading…" : "Download Report"}
                            </Button>
                        </CardBody>
                    </Card>

                    {/* Filters/Summary/Notes/Cache (whatever the response
                        actually names its object fields) side by side on one
                        row, each group divided from the next, instead of a
                        separate full-width card per section. Not the former
                        Badge pills either, which squeezed an array field like
                        service_center into a literal "[\"ABN\"]" and could
                        read as unreadable depending on the pill's colour. */}
                    {objectSections.length > 0 && (
                        <Card className="mb-3">
                            <CardBody className="py-2.5">
                                <div className="flex flex-nowrap items-stretch gap-4 overflow-x-auto">
                                    {objectSections.map(({ key, title, entries }) => (
                                        <div key={key} className="flex shrink-0 flex-nowrap items-center gap-2 border-r border-white/8 pr-4 last:border-r-0 last:pr-0">
                                            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{title}</span>
                                            {entries.map(([k, v]) => (
                                                <SummaryTile key={k} label={humanize(k)} value={v} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {!hasChecked ? (
                    <Card><CardBody className="py-12 text-center text-ink-muted">Set your filters and click Check.</CardBody></Card>
                ) : loading ? (
                    <Loader message="Loading…" fullscreen={false} />
                ) : (
                    <>
                        {/* By Region / By Service Center / Hourly, or
                            whatever other breakdown arrays the response
                            sent, as tabs rather than stacked tables. Each
                            TabPane needs its own unique `key` -- without one,
                            TabContent's filter-to-the-active-tabId render
                            reuses the same component instance across a
                            switch instead of remounting it, so the previous
                            tab's own table state (page, search) would leak
                            into whichever tab opens next. */}
                        {arraySections.length > 0 && (
                            <Card className="mb-3">
                                <CardBody className="p-0">
                                    <Nav tabs className="px-3 pt-2">
                                        {arraySections.map(({ key, title }) => (
                                            <NavItem key={key}>
                                                <NavLink
                                                    className={activeArrayTab === key ? "active" : undefined}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => setActiveArrayTab(key)}
                                                >
                                                    {title}
                                                </NavLink>
                                            </NavItem>
                                        ))}
                                    </Nav>
                                    <TabContent activeTab={activeArrayTab}>
                                        {arraySections.map(({ key, rows, columns }) => (
                                            <TabPane key={key} tabId={key}>
                                                <TableContainer
                                                    columns={columns}
                                                    data={rows}
                                                    isGlobalFilter={true}
                                                    isPagination={true}
                                                    isCustomPageSize={true}
                                                    defaultPageSize={20}
                                                    SearchPlaceholder="Search within results..."
                                                    tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                                                />
                                            </TabPane>
                                        ))}
                                    </TabContent>
                                </CardBody>
                            </Card>
                        )}
                        {!objectSections.length && !arraySections.length && (
                            <Card><CardBody className="py-12 text-center text-ink-muted">No data returned for these filters.</CardBody></Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default StatusDailyReport;
