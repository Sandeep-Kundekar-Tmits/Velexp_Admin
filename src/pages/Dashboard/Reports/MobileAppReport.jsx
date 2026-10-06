// Mobile App Report (status-source-hourly): hourly breakdown of status
// updates by source — mobile / desktop / system — all-India, admin-reports
// family (same shape as COD Pending above: user_id in the body, service
// centre list sourced from the full directory rather than an employee's
// mapped set).
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Badge, Button, Card, CardBody, Label } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import ToasterProvider from "../../../helpers/ToasterProvider";
import {
    STATUS_SOURCE_HOURLY_REPORT,
    DOWNLOAD_STATUS_SOURCE_HOURLY_REPORT,
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

const MobileAppReport = () => {
    useEffect(() => {
        document.title = "Mobile App Report";
    }, []);

    const { ErrorToaster } = ToasterProvider();

    // ── Service centres & regions (cached 30min via react-query) ──────────
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

    const [selectedSCs, setSelectedSCs] = useState([]);
    const [region, setRegion] = useState("");
    const [date, setDate] = useState(todayISO());
    // "post_ofd" (default) only includes statuses after Out-For-Delivery;
    // "all" includes every non-OFD status, per the API.
    const [scope, setScope] = useState("post_ofd");

    const [hourly, setHourly] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const buildPayload = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const payload = { user_id: authUser?.user?.id };
        if (date) payload.date = date;
        if (selectedSCs.length) payload.service_center = selectedSCs.map((s) => s.value).join(",");
        if (region) payload.region = region;
        if (scope === "all") payload.scope = "all";
        return payload;
    };

    const fetchReport = async () => {
        setLoading(true);
        setHasChecked(true);
        try {
            const res = await authFetch(STATUS_SOURCE_HOURLY_REPORT, {
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
            console.error("Mobile app report fetch error:", err);
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
            const res = await authFetch(DOWNLOAD_STATUS_SOURCE_HOURLY_REPORT, {
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
            a.download = `Mobile_App_Report_${date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Mobile app report download error:", err);
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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Mobile App Report"
                subTitle="Hourly breakdown of status updates by source (mobile / desktop / system)."
            />

            <div className="container-fluid page-fit-body px-2">
                <Card className="mb-3">
                    <CardBody className="flex flex-wrap items-end gap-3 py-3">
                        <div className="flex flex-col gap-1.5">
                            <Label className="mb-0 text-xs font-bold text-ink-muted">Date</Label>
                            <input
                                type="date"
                                className="form-control form-control-sm"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
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

                        <div className="flex gap-1 rounded-lg border p-1">
                            <Button
                                size="sm"
                                color={scope === "post_ofd" ? "primary" : "secondary"}
                                outline={scope !== "post_ofd"}
                                onClick={() => setScope("post_ofd")}
                            >
                                Post-OFD Only
                            </Button>
                            <Button
                                size="sm"
                                color={scope === "all" ? "primary" : "secondary"}
                                outline={scope !== "all"}
                                onClick={() => setScope("all")}
                            >
                                All Statuses
                            </Button>
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

                <div className="page-fit-body mt-1">
                    {!hasChecked ? (
                        <p className="text-ink-muted py-6 text-center text-xs">Press Check to load the report</p>
                    ) : loading ? (
                        <Loader message="Loading Mobile App Report..." fullscreen={false} />
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
                            fillHeight
                            tableHeight="65vh"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileAppReport;
