// Shipment exceptions (OPS Reports): a Status dropdown (the statuses from the API, Resolved by default) with search, category, date and service-centre filters;
// the list loads on Get Data. A detail popup shows the status history.
// A Resolved exception can be updated here to Closed or Cancelled.
// Ops panel counterpart: Pages/ShipmentException/RaiseException.jsx.
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
import { customStyles } from "../../../helpers/CustomStyle";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { rawRequest } from "@/lib/http";
import ToasterProvider from "../../../helpers/ToasterProvider";
import {
    EXCEPTION_CATEGORY_LIST,
    SERVICE_CENTER_LIST,
    SHIPMENT_EXCEPTION_DETAIL,
    SHIPMENT_EXCEPTION_LIST,
    SHIPMENT_EXCEPTION_STATUS_UPDATE,
    SHIPMENT_EXCEPTION_STATUSES,
} from "../../../api";

const PAGE_SIZE = 50;

// Statuses come from the API (GET /shipment-exception/statuses/); this list is only used until it loads, or if it fails.
const FALLBACK_STATUSES = [
    { code: "OPEN", label: "Open" },
    { code: "IN_PROGRESS", label: "In Progress" },
    { code: "RESOLVED", label: "Resolved" },
    { code: "CLOSED", label: "Closed" },
    { code: "CANCELLED", label: "Cancelled" },
];

// "All" in the Status dropdown: every status code is sent as current_status.
const ALL_STATUSES = "ALL";

const EMPTY_RANGE = { startDate: null, endDate: null };

// A resolved exception can only be moved on to one of these.
const UPDATE_STATUSES = [
    { code: "CLOSED", label: "Closed" },
    { code: "CANCELLED", label: "Cancelled" },
];

const STATUS_BADGE = {
    OPEN: "info",
    IN_PROGRESS: "warning",
    RESOLVED: "success",
    CLOSED: "secondary",
    CANCELLED: "danger",
};

const MULTI_SELECT_PROPS = {
    styles: customStyles,
    menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
    menuPosition: "fixed",
};

const formatDateTime = (iso) => {
    if (!iso) return "--";
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-GB")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const lastStatus = (row) => {
    const last = row?.statuses?.[row.statuses.length - 1];
    return {
        code: row?.current_status || last?.status_code,
        label: row?.current_status_label || last?.status_name,
    };
};

const renderStatusBadge = (row) => {
    const { code, label } = lastStatus(row);
    if (!label) return <span>--</span>;
    return <span className={`badge bg-${STATUS_BADGE[code] || "secondary"}`}>{label}</span>;
};

const renderScChips = (list) =>
    (list || []).length ? (
        <div className="flex flex-wrap gap-1">
            {list.map((sc) => (
                <span key={sc.id} title={sc.city} className="badge bg-secondary">{sc.service_center_code}</span>
            ))}
        </div>
    ) : (
        <span>--</span>
    );

const ExceptionList = () => {
    useEffect(() => { document.title = "Exceptions"; }, []);

    const { apifunc: fetchList, data: listData, loading } = usePostApiCall();
    const { apifunc: fetchServiceCenters, data: scData } = usePostApiCall();
    const { apifunc: fetchDetail, loading: detailLoading } = usePostApiCall();
    const { apifunc: postStatus } = usePostApiCall();
    const { SucceesToaster, ErrorToaster } = ToasterProvider();

    const [tab, setTab] = useState("RESOLVED"); // Status dropdown: a status code, Resolved by default
    const [statuses, setStatuses] = useState(FALLBACK_STATUSES);
    const { apifunc: fetchCategories, data: categoryData } = usePostApiCall();

    // Filters (nothing is requested while they change): search text, category, created-date range (empty by default).
    // "Get Data" copies them into `applied`, and only then is the list loaded.
    const [searchInput, setSearchInput] = useState("");
    const [category, setCategory] = useState(null);
    const [range, setRange] = useState(EMPTY_RANGE);
    const [applied, setApplied] = useState(null); // null until Get Data is clicked
    // Update popup (Resolved tab): the row, the chosen status and the message
    const [updateRow, setUpdateRow] = useState(null);
    const [updateStatus, setUpdateStatus] = useState(UPDATE_STATUSES[0].code);
    const [updateMessage, setUpdateMessage] = useState("");
    const [saving, setSaving] = useState(false);

    const [serviceCenters, setServiceCenters] = useState([]);
    const [page, setPage] = useState(1);

    const [detail, setDetail] = useState(null);

    useEffect(() => {
        // the status list for the dropdown
        rawRequest(SHIPMENT_EXCEPTION_STATUSES, { method: "GET" })
            .then(({ ok, data }) => {
                const list = ok ? (Array.isArray(data) ? data : data?.results || []) : [];
                const clean = list.filter((x) => x?.code).map((x) => ({ code: x.code, label: x.label || x.code }));
                if (clean.length) setStatuses(clean);
            })
            .catch(() => { /* keep the fallback list */ });
        fetchServiceCenters(SERVICE_CENTER_LIST, {});
        fetchCategories(EXCEPTION_CATEGORY_LIST, {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categoryOptions = useMemo(() => {
        const list = categoryData?.results?.results || categoryData?.results || (Array.isArray(categoryData) ? categoryData : []);
        return list.map((c) => ({ value: c.id, label: c.name }));
    }, [categoryData]);

    const scOptions = useMemo(
        () =>
            (scData?.results?.results || []).map((sc) => ({
                value: sc.id,
                label: `${sc.service_center_code}${sc.city ? ` (${sc.city})` : ""}`,
            })),
        [scData],
    );
    // Loads the list for the applied filters; does nothing until Get Data has been clicked.
    const load = useCallback(() => {
        if (!applied) return;
        const payload = {
            page,
            page_size: PAGE_SIZE,
            current_status: applied.tab === ALL_STATUSES ? statuses.map((x) => x.code) : [applied.tab],
        };
        if (applied.search) payload.search = applied.search;
        if (applied.category) payload.exception_category = applied.category.value;
        if (applied.serviceCenters.length) payload.service_center_ids = applied.serviceCenters.map((s) => s.value);
        // both dates are needed, as YYYY-MM-DD, and they filter on the created date
        if (applied.range.startDate && applied.range.endDate) {
            const { from_date, to_date } = YMD_DateFormate(applied.range);
            payload.start_date = from_date;
            payload.end_date = to_date;
        }
        fetchList(SHIPMENT_EXCEPTION_LIST, payload);
    }, [applied, page, statuses, fetchList]);

    useEffect(() => { load(); }, [load]);

    // The button: take the filters as they are now and load page 1.
    const getData = () => {
        setPage(1);
        setApplied({ tab, search: searchInput.trim(), category, serviceCenters, range });
    };

    // Changing a filter only changes the form; the list reloads on Get Data.
    const onFilter = (setter) => (value) => setter(value);

    // The server filters by tab; this also drops any row whose own status is not one of the tab's, as a safety net.
    const rows = useMemo(
        () => (listData?.results?.results || []).filter((r) => {
            const code = lastStatus(r).code;
            const shown = applied?.tab || tab;
            return !code || shown === ALL_STATUSES || code === shown;
        }),
        [listData, applied, tab],
    );
    const total = listData?.count ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const openUpdate = (row) => {
        setUpdateRow(row);
        setUpdateStatus(UPDATE_STATUSES[0].code);
        setUpdateMessage("");
    };

    const saveUpdate = async () => {
        if (!updateRow || saving) return;
        if (!updateMessage.trim()) {
            ErrorToaster("Enter a message for this update");
            return;
        }
        setSaving(true);
        try {
            const res = await postStatus(SHIPMENT_EXCEPTION_STATUS_UPDATE, {
                exception: updateRow.id,
                status_code: updateStatus,
                status_message: updateMessage.trim(),
            });
            // usePostApiCall returns the parsed error body on a failed call (and shows its own toast).
            // A saved status comes back as the new record ({ id, exception, status_code, ... }), so `status_code`
            // is NOT an error marker; the new record's id is what says it worked.
            if (res && !Array.isArray(res) && !res.detail && !res.error && (res.id !== undefined || res.exception !== undefined)) {
                SucceesToaster(`Exception #${updateRow.id} marked ${UPDATE_STATUSES.find((s) => s.code === updateStatus)?.label}`);
                setUpdateRow(null);
                load();
            }
        } finally {
            setSaving(false);
        }
    };

    const openDetail = async (row) => {
        setDetail(row);
        const res = await fetchDetail(SHIPMENT_EXCEPTION_DETAIL, { id: row.id });
        if (res && !res.detail) setDetail(res);
    };

    const columns = useMemo(() => [
        { header: "ID", accessorKey: "id", enableColumnFilter: false },
        {
            header: "Bag / AWB No",
            accessorKey: "awb_no_bag_no",
            enableColumnFilter: false,
            cell: ({ getValue }) => {
                const items = String(getValue() || "").split(",").map((v) => v.trim()).filter(Boolean);
                if (!items.length) return "--";
                return (
                    <span>
                        <span className="badge bg-info">{items[0]}</span>
                        {items.length > 1 && <span className="badge bg-secondary ms-1">+{items.length - 1}</span>}
                    </span>
                );
            },
        },
        {
            header: "Exception Category",
            accessorKey: "exception_category_detail.name",
            enableColumnFilter: false,
            cell: ({ row }) => row.original.exception_category_detail?.name || "--",
        },
        {
            header: "Service Centers",
            accessorKey: "service_centers",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ getValue }) => renderScChips(getValue()),
        },
        {
            header: "Status",
            accessorKey: "current_status_label",
            enableColumnFilter: false,
            cell: ({ row }) => renderStatusBadge(row.original),
        },
        {
            header: "Exception Message",
            accessorKey: "exception_message",
            enableColumnFilter: false,
            cell: ({ getValue }) => (
                <span className="block max-w-[260px] truncate" title={getValue()}>{getValue() || "--"}</span>
            ),
        },
        {
            header: "Raised",
            accessorKey: "created_at",
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="leading-tight">
                    <div>{formatDateTime(row.original.created_at)}</div>
                    {row.original.created_by && <small className="text-ink-muted">by {row.original.created_by}</small>}
                </div>
            ),
        },
        {
            header: "Action",
            accessorKey: "action",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="flex gap-1">
                    <Button color="primary" size="sm" onClick={() => openDetail(row.original)}>View</Button>
                    {lastStatus(row.original).code === "RESOLVED" && (
                        <Button color="success" size="sm" onClick={() => openUpdate(row.original)}>Update</Button>
                    )}
                </div>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const detailItems = String(detail?.awb_no_bag_no || "").split(",").map((v) => v.trim()).filter(Boolean);

    return (
        <div className="page-content page-fit">
            <MainHeaderComp title="Exceptions" subTitle={`Total: ${total}`} />

            <div className="mt-3 mb-2 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-nowrap">
                <div className="min-w-0 lg:flex-[1.2]">
                    <Label>Service Centers</Label>
                    <Select
                        {...MULTI_SELECT_PROPS}
                        isMulti
                        options={scOptions}
                        value={serviceCenters}
                        onChange={onFilter((v) => setServiceCenters(v || []))}
                        placeholder="All"
                    />
                </div>
                <div className="min-w-0 lg:flex-[1.3]">
                    <Label>Raised between</Label>
                    <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                            <DateRangeInput
                                value={range}
                                onChange={onFilter(({ startDate, endDate }) => setRange({ startDate, endDate }))}
                                isBorder={true}
                            />
                        </div>
                        {(range.startDate || range.endDate) && (
                            <Button size="sm" color="secondary" outline onClick={() => onFilter(setRange)(EMPTY_RANGE)}>Clear</Button>
                        )}
                    </div>
                </div>
                <div className="min-w-0 lg:flex-1">
                    <Label>Category</Label>
                    <Select
                        {...MULTI_SELECT_PROPS}
                        isClearable
                        options={categoryOptions}
                        value={category}
                        onChange={onFilter((v) => setCategory(v || null))}
                        placeholder="All"
                    />
                </div>
                <div className="min-w-0 lg:w-36 lg:shrink-0">
                    <Label>Status</Label>
                    <Select
                        {...MULTI_SELECT_PROPS}
                        isSearchable={false}
                        options={[{ value: ALL_STATUSES, label: "All" }, ...statuses.map((x) => ({ value: x.code, label: x.label }))]}
                        value={{ value: tab, label: tab === ALL_STATUSES ? "All" : statuses.find((x) => x.code === tab)?.label || tab }}
                        onChange={(opt) => opt && setTab(opt.value)}
                    />
                </div>
                <div className="min-w-0 lg:flex-1">
                    <Label>Search</Label>
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") getData(); }}
                        placeholder="AWB, bag no or message"
                    />
                </div>
                <Button color="primary" onClick={getData} disabled={loading} className="w-full sm:col-span-2 lg:w-auto lg:shrink-0">
                    {loading ? "Loading..." : "Get Data"}
                </Button>
            </div>

            {!applied ? (
                <p className="text-ink-muted mt-4">Choose the filters, then click Get Data to load {tab === ALL_STATUSES ? "all" : (statuses.find((x) => x.code === tab)?.label || tab).toLowerCase()} exceptions.</p>
            ) : loading ? (
                <Loader fullscreen={false} />
            ) : (
                <>
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={false}
                        isPagination={false}
                        tableClass="table-bordered table-nowrap"
                        fillHeight
                    />
                    <div className="flex flex-wrap justify-between items-center mt-3 px-4 py-2 bg-canvas rounded border">
                        <span className="text-ink-muted text-xs">
                            Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, total)} of {total} entries
                        </span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <Button size="sm" color="secondary" outline disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</Button>
                                <span className="text-xs px-2">Page {page} of {totalPages}</span>
                                <Button size="sm" color="secondary" outline disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next ›</Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Modal isOpen={!!detail} toggle={() => setDetail(null)} size="lg">
                <ModalHeader toggle={() => setDetail(null)}>
                    Exception #{detail?.id} {detail && renderStatusBadge(detail)}
                </ModalHeader>
                <ModalBody>
                    {detailLoading && !detail?.statuses ? (
                        <Loader fullscreen={false} />
                    ) : detail && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <small className="text-ink-muted block uppercase">Date</small>
                                    <strong>{detail.created_at?.split("T")[0] || "--"}</strong>
                                </div>
                                <div>
                                    <small className="text-ink-muted block uppercase">Exception Category</small>
                                    <strong>{detail.exception_category_detail?.name || "--"}</strong>
                                </div>
                            </div>

                            <div>
                                <small className="text-ink-muted block uppercase mb-1">AWB / Bag ID / Request No / Customer</small>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {detailItems.map((v, i) => <span key={`${v}-${i}`} className="badge bg-info">{v}</span>)}
                                    {!detailItems.length && <span>--</span>}
                                </div>
                            </div>

                            <div>
                                <small className="text-ink-muted block uppercase mb-1">Service Centers</small>
                                {renderScChips(detail.service_centers)}
                            </div>

                            <div>
                                <small className="text-ink-muted block uppercase mb-1">Exception Message</small>
                                <p className="rounded border px-3 py-2 mb-0 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                                    {detail.exception_message || "--"}
                                </p>
                            </div>

                            <div>
                                <small className="text-ink-muted block uppercase mb-2">Status History</small>
                                <ol className="max-h-48 overflow-y-auto border-l-2 ml-1 pl-3 space-y-3 list-none">
                                    {[...(detail.statuses || [])].reverse().map((s, i) => (
                                        <li key={s.id ?? i}>
                                            <div>
                                                {s.status_name && <span className={`badge bg-${STATUS_BADGE[s.status_code] || "secondary"} me-2`}>{s.status_name}</span>}
                                                {s.status_message}
                                            </div>
                                            <small className="text-ink-muted">
                                                {formatDateTime(s.created_at)}{s.created_by ? ` · ${s.created_by}` : ""}
                                            </small>
                                        </li>
                                    ))}
                                    {!(detail.statuses || []).length && <li className="text-ink-muted">No updates yet</li>}
                                </ol>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setDetail(null)}>Close</Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={!!updateRow} toggle={() => !saving && setUpdateRow(null)} centered>
                <ModalHeader toggle={() => !saving && setUpdateRow(null)}>Update Exception #{updateRow?.id}</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-3">
                        <p className="m-0 text-sm text-ink-muted">This exception is Resolved. It can be moved on to Closed or Cancelled.</p>
                        <div className="flex items-center gap-4">
                            {UPDATE_STATUSES.map((s) => (
                                <label key={s.code} className="flex items-center gap-1.5 text-sm">
                                    <Input type="radio" name="exception-update-status" checked={updateStatus === s.code} onChange={() => setUpdateStatus(s.code)} />
                                    {s.label}
                                </label>
                            ))}
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="m-0">Message (required)</Label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={updateMessage}
                                onChange={(e) => setUpdateMessage(e.target.value)}
                                placeholder="Why is this being closed / cancelled?"
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setUpdateRow(null)} disabled={saving}>Cancel</Button>
                    <Button color="primary" onClick={saveUpdate} disabled={saving || !updateMessage.trim()}>
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default ExceptionList;
