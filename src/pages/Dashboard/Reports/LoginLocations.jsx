import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@/components/ui";
import TableContainer from "../../../components/Table/TableContainer";
import ServerPager from "../../../components/Common/ServerPager";
import MainHeaderComp from "../../../components/MainHeaderCom";
import Loader from "@/Loaders/Loader";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { authFetch, rawRequest } from "@/lib/http";
import { LOGIN_LOCATIONS_LIST, LOGIN_LOCATIONS_DOWNLOAD } from "../../../api";

const PAGE_SIZE = 25;

const SOURCES = [
    ["", "All sources"],
    ["OPS_WEB", "Ops web"],
    ["RIDER_APP", "Rider app"],
    ["DARKSTORE_APP", "Darkstore app"],
    ["CUSTOMER_PORTAL", "Customer portal"],
];
const LOGIN_METHODS = [
    ["", "All methods"],
    ["employee_login", "Employee login"],
    ["mobile_login", "Mobile login"],
    ["darkstore_login", "Darkstore login"],
    ["api_login", "API login"],
    ["jwt_login", "JWT login"],
    ["vel_otp_login", "OTP login"],
    ["userlogin", "Web page login"],
];
const LOCATION_FILTER = [
    ["", "Any"],
    ["true", "With location"],
    ["false", "Without location"],
];

const emptyFilters = { source: "", login_method: "", has_location: "", date_from: "", date_to: "", search: "" };

const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true });
};

const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

// Only non-empty filters go in the body; has_location is sent as a real boolean.
const buildBody = (f) => {
    const body = {};
    Object.entries(f).forEach(([k, v]) => {
        if (v === "") return;
        body[k] = k === "has_location" ? v === "true" : v;
    });
    return body;
};

const LoginLocations = () => {
    useEffect(() => { document.title = "Login Locations" }, []);

    const { ErrorToaster } = ToasterProvider();
    const [filters, setFilters] = useState(emptyFilters);
    const [applied, setApplied] = useState(emptyFilters);
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { ok, status, data } = await rawRequest(LOGIN_LOCATIONS_LIST, {
                method: "POST",
                body: { page, page_size: PAGE_SIZE, ...buildBody(applied) },
            });
            if (!ok) {
                setRows([]);
                setCount(0);
                return ErrorToaster(data?.error || data?.detail || data?.message || `Failed to load (${status})`);
            }
            // Rows sit at results.results, the same nesting as the employee list.
            setRows(data?.results?.results || []);
            setCount(data?.count || 0);
        } catch (e) {
            console.error("Load login locations failed:", e);
            ErrorToaster("Failed to load login locations");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, applied]);

    useEffect(() => { load(); }, [load]);

    const apply = () => {
        setPage(1);
        setApplied(filters);
    };

    const reset = () => {
        setFilters(emptyFilters);
        setPage(1);
        setApplied(emptyFilters);
    };

    const download = async () => {
        setIsExporting(true);
        try {
            const res = await authFetch(LOGIN_LOCATIONS_DOWNLOAD, {
                method: "POST",
                body: buildBody(applied),
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || errJson?.detail || `Server error: ${res.status}`);
            }
            const blobUrl = URL.createObjectURL(await res.blob());
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = "Login_Locations.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Login locations download error:", e);
            ErrorToaster(e.message || "Download failed");
        } finally {
            setIsExporting(false);
        }
    };

    const columns = useMemo(() => {
        const text = (header, accessorKey) => ({
            header, accessorKey, enableColumnFilter: false, enableSorting: false,
            cell: ({ getValue }) => dash(getValue()),
        });
        return [
            {
                header: "SL No", id: "sl_no", enableColumnFilter: false,
                cell: ({ row }) => (page - 1) * PAGE_SIZE + row.index + 1,
            },
            { header: "Time", accessorKey: "created_at", enableColumnFilter: false, enableSorting: false, cell: ({ getValue }) => fmtDate(getValue()) },
            {
                header: "Source", accessorKey: "source_display", enableColumnFilter: false, enableSorting: false,
                cell: ({ row }) => <Badge color="info">{row.original.source_display || row.original.source || "—"}</Badge>,
            },
            text("Method", "login_method"),
            text("Username", "username"),
            {
                header: "Name", id: "name", enableColumnFilter: false, enableSorting: false,
                cell: ({ row }) => dash(row.original.employee_name || row.original.customer_name),
            },
            text("Employee Code", "employee_code"),
            text("Latitude", "latitude"),
            text("Longitude", "longitude"),
            {
                header: "Map", id: "map", enableColumnFilter: false, enableSorting: false,
                cell: ({ row }) =>
                    row.original.has_location && row.original.map_url ? (
                        <a href={row.original.map_url} target="_blank" rel="noreferrer" className="text-brand-500 underline">Open</a>
                    ) : (
                        <Badge color="secondary">No location</Badge>
                    ),
            },
            text("Device ID", "device_id"),
            text("App Version", "app_version"),
            text("IP Address", "ip_address"),
        ];
    }, [page]);

    const setF = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Login Locations"
                subTitle="Where users logged in from, across ops web, rider app, darkstore app and customer portal."
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="grid grid-cols-1 gap-3 border-b border-white/8 pb-3 sm:grid-cols-3 lg:grid-cols-6">
                    <select className="form-control" value={filters.source} onChange={setF("source")}>
                        {SOURCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <select className="form-control" value={filters.login_method} onChange={setF("login_method")}>
                        {LOGIN_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <select className="form-control" value={filters.has_location} onChange={setF("has_location")}>
                        {LOCATION_FILTER.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <input type="date" className="form-control" value={filters.date_from} max={filters.date_to || undefined}
                        onChange={setF("date_from")} aria-label="From date" />
                    <input type="date" className="form-control" value={filters.date_to} min={filters.date_from || undefined}
                        onChange={setF("date_to")} aria-label="To date" />
                    <input className="form-control" placeholder="Username, code, name, device ID" value={filters.search}
                        onChange={setF("search")} onKeyDown={(e) => e.key === "Enter" && apply()} />
                </div>
                <div className="flex flex-wrap items-center gap-2 py-3">
                    <Button color="primary" size="sm" onClick={apply} disabled={loading}>Search</Button>
                    <Button color="secondary" size="sm" onClick={reset} disabled={loading}>Reset</Button>
                    <Button color="success" size="sm" onClick={download} disabled={isExporting || loading}>
                        {isExporting ? "Downloading…" : "Download Excel"}
                    </Button>
                    <span className="ml-auto text-xs text-ink-muted">
                        <b className="text-ink">{count.toLocaleString()}</b> records
                    </span>
                </div>

                <div className="page-fit-body">
                    {loading ? (
                        <Loader message="Loading Login Locations…" fullscreen={false} />
                    ) : (
                        <>
                            <TableContainer
                                columns={columns}
                                headerAlign="left"
                                data={rows}
                                isGlobalFilter={false}
                                isPagination={false}
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                fillHeight
                                tableHeight="58vh"
                            />
                            <ServerPager
                                currentPage={page}
                                totalPages={Math.ceil(count / PAGE_SIZE)}
                                totalCount={count}
                                onPageChange={setPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginLocations;
