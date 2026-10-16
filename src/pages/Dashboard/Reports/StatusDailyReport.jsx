// Status Daily Report: daily shipment counts by status code, broken down by
// service centre and region. GET, not POST (unlike its sibling admin-reports
// endpoints), and the exact response shape beyond "summary, per service
// centre, per region, cache" isn't documented -- rendered generically here
// (any array-of-objects field becomes its own table, any plain object
// becomes a badge strip) so this keeps working whatever the backend actually
// sends, the same approach MobileAppReport.jsx uses for its own admin-reports
// endpoints.
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Badge, Button, Card, CardBody, Input, Label } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { customStyles } from "../../../helpers/CustomStyle";
import { authFetch } from "@/lib/http";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { STATUS_DAILY_REPORT, DOWNLOAD_STATUS_DAILY_REPORT, GET_ALL_REGION } from "../../../api";

const todayISO = () => new Date().toISOString().split("T")[0];
const humanize = (key) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const MAX_STATUS_CODES = 20;

const StatusDailyReport = () => {
    useEffect(() => { document.title = "Status Daily Report"; }, []);
    const { ErrorToaster } = ToasterProvider();

    const [date, setDate] = useState(todayISO());
    const [statusCodes, setStatusCodes] = useState([]);
    const [statusInput, setStatusInput] = useState("");
    const [region, setRegion] = useState(null);

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

    const addStatus = () => {
        const code = statusInput.trim().toUpperCase();
        if (!code) return;
        if (statusCodes.includes(code)) { setStatusInput(""); return; }
        if (statusCodes.length >= MAX_STATUS_CODES) { ErrorToaster(`Up to ${MAX_STATUS_CODES} status codes per request`); return; }
        setStatusCodes([...statusCodes, code]);
        setStatusInput("");
    };
    const removeStatus = (code) => setStatusCodes(statusCodes.filter((c) => c !== code));

    const buildQuery = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const params = new URLSearchParams();
        params.set("user_id", authUser?.user?.id ?? "");
        params.set("status", statusCodes.join(","));
        params.set("date", date);
        if (region?.value) params.set("region", region.value);
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

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Status Daily Report"
                subTitle="Daily shipment counts by status, service centre and region."
            />

            <div className="page-fit-body relative z-10 pb-4">
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
                            <div className="flex items-center gap-2">
                                <Input
                                    value={statusInput}
                                    onChange={(e) => setStatusInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStatus(); } }}
                                    placeholder="e.g. SPD, CNA, OFD…"
                                    className="flex-1"
                                />
                                <Button type="button" color="secondary" className="shrink-0" onClick={addStatus} disabled={!statusInput.trim()}>
                                    + Add
                                </Button>
                            </div>
                            {statusCodes.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {statusCodes.map((code) => (
                                        <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-ink">
                                            {code}
                                            <button type="button" onClick={() => removeStatus(code)} aria-label={`Remove ${code}`} className="leading-none text-ink-muted hover:text-danger-500">
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
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

                {!hasChecked ? (
                    <Card><CardBody className="py-12 text-center text-ink-muted">Set your filters and click Check.</CardBody></Card>
                ) : loading ? (
                    <Loader message="Loading…" fullscreen={false} />
                ) : (
                    <>
                        {objectSections.map(({ key, title, entries }) => (
                            <Card key={key} className="mb-3">
                                <CardBody>
                                    <h6 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">{title}</h6>
                                    <div className="flex flex-wrap gap-2">
                                        {entries.map(([k, v]) => (
                                            <Badge key={k} color="info" pill>
                                                {humanize(k)}: {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        {arraySections.map(({ key, title, rows, columns }) => (
                            <Card key={key} className="mb-3">
                                <CardBody className="p-0">
                                    <h6 className="px-4 pt-3 text-xs font-bold uppercase tracking-wider text-ink-muted">{title}</h6>
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
                                </CardBody>
                            </Card>
                        ))}
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
