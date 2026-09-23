import { useCallback, useEffect, useMemo, useState } from "react";
import Select, { components } from "react-select";
import { Button, Col, FormGroup, Input, Label, Row } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import {
    OPS_PICKUP_PENDING_REPORT,
    DOWNLOAD_OPS_PICKUP_PENDING_REPORT,
    ADMIN_PICKUP_PENDING_REPORT,
    DOWNLOAD_ADMIN_PICKUP_PENDING_REPORT,
} from "../../../api";
import { customStyles } from "../../../helpers/CustomStyle";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchServiceCenters } from "@/services/reference.service";
import { useRegions } from "../../../hooks/queries/useReferenceData";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { usePermissions } from "../../../features/auth/usePermissions";
import { authFetch } from "@/lib/http";

const SELECT_ALL_OPTION = { value: "__all__", label: "Select All" };
const MAX_RANGE_DAYS = 60;
const ADMIN_PAGE_SIZE = 200;

// Shows first 2 selected chips then "+N more" badge — same as PendingReport.jsx
const SCMultiValue = ({ index, getValue, ...props }) => {
    const total = getValue().length;
    if (index < 2) return <components.MultiValue {...props} />;
    if (index === 2)
        return (
            <span className="badge bg-brand-500 ml-1 self-center">
                +{total - 2}
            </span>
        );
    return null;
};

const daySpan = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

const PickupPendingReport = () => {
    useEffect(() => { document.title = "Pickup Pending Report"; }, []);

    const { ErrorToaster } = ToasterProvider();
    const { isAdmin, isSuperUser } = usePermissions();
    // Admins get the all-India, paginated view; everyone else gets the
    // ops-scoped view (their own mapped service centres, via the Bearer
    // token -- no user_id needed, and the backend doesn't paginate it).
    const useAdmin = isAdmin || isSuperUser;

    // ── Service Centers (cached 30min via react-query) ──────────────────────
    const { data: serviceCenterList, isLoading: scLoading } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    });
    const [scOptions, setScOptions] = useState([]);
    const [selectedSCs, setSelectedSCs] = useState([]);

    useEffect(() => {
        if (serviceCenterList) {
            const opts = serviceCenterList
                .map((e) => ({ value: e.ec_code, label: e.ec_code }))
                .filter((item, idx, self) => idx === self.findIndex((t) => t.value === item.value));
            setScOptions(opts);
        }
    }, [serviceCenterList]);

    const handleSCChange = (chosen) => {
        if (!chosen) { setSelectedSCs([]); return; }
        setSelectedSCs(chosen.some((o) => o.value === "__all__") ? scOptions : chosen);
    };

    // ── Region (admin only -- narrows all-India results instead of by SC) ──
    const { data: regionOptions = [] } = useRegions({ enabled: useAdmin });
    const [selectedRegion, setSelectedRegion] = useState(null);

    // ── Include WAB (ops only, per this endpoint's own spec) ────────────────
    const [includeWab, setIncludeWab] = useState(false);

    // ── Date range -- defaults to the last 7 days, well under the 60-day cap ─
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 6);
    const [selectedRange, setSelectedRange] = useState({ startDate: weekAgo, endDate: today });

    // ── Report data ────────────────────────────────────────────────────────
    const [reportData, setReportData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const buildPayload = useCallback((page = 1, page_size = ADMIN_PAGE_SIZE) => {
        const fmt = YMD_DateFormate(selectedRange);
        const payload = {
            start_date: fmt.from_date || undefined,
            end_date: fmt.to_date || undefined,
        };
        if (selectedSCs.length) payload.service_center = selectedSCs.map((s) => s.value).join(",");

        if (useAdmin) {
            const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
            payload.user_id = authUser?.user?.id;
            payload.page = page;
            payload.page_size = page_size;
            if (selectedRegion?.value) payload.region = selectedRegion.value;
        } else if (includeWab) {
            payload.include_wab = true;
        }
        return payload;
    }, [selectedSCs, selectedRange, useAdmin, selectedRegion, includeWab]);

    // Mirrors the server's own 60-day cap and start/end pairing rule, so a bad
    // range is caught before a round trip instead of only after a 400.
    const validateRange = () => {
        const fmt = YMD_DateFormate(selectedRange);
        if (!fmt.from_date || !fmt.to_date) {
            ErrorToaster("Select a start and end date");
            return null;
        }
        const span = daySpan(fmt.from_date, fmt.to_date);
        if (span > MAX_RANGE_DAYS) {
            ErrorToaster(`Date range too large: ${span} days requested, max ${MAX_RANGE_DAYS} days.`);
            return null;
        }
        return fmt;
    };

    const fetchReport = async (page = 1) => {
        const fmt = validateRange();
        if (!fmt) return;

        setLoading(true);
        setReportData([]);
        try {
            const url = useAdmin ? ADMIN_PICKUP_PENDING_REPORT : OPS_PICKUP_PENDING_REPORT;
            const res = await authFetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload(page, ADMIN_PAGE_SIZE)),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                ErrorToaster(json?.error || "Failed to load report");
                return;
            }
            const rows = Array.isArray(json?.shipments) ? json.shipments
                : Array.isArray(json?.results) ? json.results
                : Array.isArray(json) ? json
                : [];
            setReportData(rows);
            setTotalCount(json?.total_shipments ?? json?.count ?? rows.length);
            setCurrentPage(json?.page ?? page);
            setTotalPages(json?.total_pages ?? 1);
        } catch (err) {
            console.error("Pickup pending report fetch error:", err);
            ErrorToaster("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        const fmt = validateRange();
        if (!fmt) return;

        setIsExporting(true);
        try {
            const url = useAdmin ? DOWNLOAD_ADMIN_PICKUP_PENDING_REPORT : DOWNLOAD_OPS_PICKUP_PENDING_REPORT;
            const res = await authFetch(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload(1, 5000)),
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || `Server error: ${res.status}`);
            }
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `Pickup_Pending_Report_${fmt.from_date}_${fmt.to_date}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Pickup pending report download error:", err);
            ErrorToaster(err.message || "Download failed");
        } finally {
            setIsExporting(false);
        }
    };

    // Field names for this report aren't fixed in advance -- the ops and admin
    // variants aren't guaranteed to return identical shapes -- so columns are
    // derived from whatever the response actually carries, rather than a
    // hardcoded (and possibly wrong) list of accessor keys.
    const columns = useMemo(() => {
        if (!reportData.length) return [];
        return Object.keys(reportData[0]).map((key) => ({
            header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            accessorKey: key,
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const v = getValue();
                if (v === null || v === undefined || v === "") return "—";
                if (typeof v === "boolean") return v ? "Yes" : "No";
                return String(v);
            },
        }));
    }, [reportData]);

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Pickup Pending Report"
                subTitle={useAdmin
                    ? "Shipments awaiting pickup, all-India."
                    : "Shipments awaiting pickup at your service centres."}
            />

            <div className="container-fluid page-fit-body px-2">
                <Row className="gx-2 items-end flex-wrap pt-2 border-bottom pb-2">
                    <Col xs="auto" style={{ minWidth: 220 }}>
                        <FormGroup className="mb-2">
                            <Label className="mb-1 text-xs font-semibold">Date Range</Label>
                            <DateRangeInput value={selectedRange} onChange={setSelectedRange} isBorder />
                        </FormGroup>
                    </Col>

                    <Col xs="auto" style={{ minWidth: 280 }}>
                        <FormGroup className="mb-2">
                            <Label className="mb-1 text-xs font-semibold">
                                Service Center {!useAdmin && <span className="text-ink-muted font-normal">(blank = all yours)</span>}
                            </Label>
                            <Select
                                isMulti
                                placeholder={scLoading ? "Loading..." : "All Service Centres"}
                                options={[SELECT_ALL_OPTION, ...scOptions]}
                                value={selectedSCs}
                                onChange={handleSCChange}
                                styles={customStyles}
                                closeMenuOnSelect={false}
                                hideSelectedOptions={false}
                                components={{ MultiValue: SCMultiValue }}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                            />
                        </FormGroup>
                    </Col>

                    {useAdmin && (
                        <Col xs="auto" style={{ minWidth: 200 }}>
                            <FormGroup className="mb-2">
                                <Label className="mb-1 text-xs font-semibold">Region</Label>
                                <Select
                                    isClearable
                                    placeholder="All Regions"
                                    options={regionOptions}
                                    value={selectedRegion}
                                    onChange={setSelectedRegion}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                            </FormGroup>
                        </Col>
                    )}

                    {!useAdmin && (
                        <Col xs="auto" className="mb-2">
                            <label className="flex items-center gap-1.5 text-sm text-ink" style={{ height: "2.2rem" }}>
                                <Input type="checkbox" checked={includeWab} onChange={(e) => setIncludeWab(e.target.checked)} />
                                Include WAB
                            </label>
                        </Col>
                    )}

                    <Col xs="auto" className="mb-2 flex items-center gap-2" style={{ flexWrap: "nowrap" }}>
                        <Button
                            color="primary"
                            onClick={() => fetchReport(1)}
                            disabled={loading}
                            style={{ height: "2.2rem", whiteSpace: "nowrap" }}
                        >
                            {loading ? "Loading..." : "Check"}
                        </Button>
                        {!loading && totalCount > 0 && (
                            <span
                                className="badge bg-canvas text-ink-muted border"
                                style={{ fontSize: 11, whiteSpace: "nowrap" }}
                            >
                                {totalCount.toLocaleString()} records
                            </span>
                        )}
                    </Col>
                </Row>

                <div className="page-fit-body mt-1">
                    {loading ? (
                        <Loader message="Loading Pickup Pending Report..." fullscreen={false} />
                    ) : (
                        <>
                            <TableContainer
                                columns={columns}
                                data={reportData}
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
                                fillHeight
                                tableHeight="65vh"
                                defaultPageSize={50}
                            />

                            {/* Server-side pager -- admin view only, the ops
                                endpoint isn't paginated. */}
                            {useAdmin && totalPages > 1 && (
                                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] px-4 py-2 backdrop-blur-xl">
                                    <span className="text-ink-muted text-xs">
                                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                        &nbsp;·&nbsp;{totalCount.toLocaleString()} total records
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={currentPage <= 1}
                                            onClick={() => fetchReport(currentPage - 1)}
                                        >
                                            ‹ Prev
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            outline
                                            disabled={currentPage >= totalPages}
                                            onClick={() => fetchReport(currentPage + 1)}
                                        >
                                            Next ›
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PickupPendingReport;
