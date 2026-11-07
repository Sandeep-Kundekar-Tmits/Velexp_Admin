// Shipment exceptions (OPS Reports): list with a service-centre filter (applied as they change), a read-only detail popup with the status history.
// Ops panel counterpart: Pages/ShipmentException/RaiseException.jsx.
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { Button, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import Loader from "@/Loaders/Loader";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { customStyles } from "../../../helpers/CustomStyle";
import usePostApiCall from "../../../hooks/usePostApiCall";
import {
    SERVICE_CENTER_LIST,
    SHIPMENT_EXCEPTION_DETAIL,
    SHIPMENT_EXCEPTION_LIST,
} from "../../../api";

const PAGE_SIZE = 50;

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

    const [serviceCenters, setServiceCenters] = useState([]);
    const [page, setPage] = useState(1);

    const [detail, setDetail] = useState(null);

    useEffect(() => {
        fetchServiceCenters(SERVICE_CENTER_LIST, {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scOptions = useMemo(
        () =>
            (scData?.results?.results || []).map((sc) => ({
                value: sc.id,
                label: `${sc.service_center_code}${sc.city ? ` (${sc.city})` : ""}`,
            })),
        [scData],
    );
    // Filters apply as they change.
    const load = useCallback(() => {
        const payload = { page, page_size: PAGE_SIZE };
        if (serviceCenters.length) payload.service_center_ids = serviceCenters.map((s) => s.value);
        fetchList(SHIPMENT_EXCEPTION_LIST, payload);
    }, [serviceCenters, page, fetchList]);

    useEffect(() => { load(); }, [load]);

    // a changed filter starts again from page 1
    const onFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const rows = useMemo(() => listData?.results?.results || [], [listData]);
    const total = listData?.count ?? rows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
                <Button color="primary" size="sm" onClick={() => openDetail(row.original)}>View</Button>
            ),
        },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], []);

    const detailItems = String(detail?.awb_no_bag_no || "").split(",").map((v) => v.trim()).filter(Boolean);

    return (
        <div className="page-content page-fit">
            <MainHeaderComp title="Exceptions" subTitle={`Total: ${total}`} />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 max-w-xl mt-3 mb-2 items-end">
                <div>
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
            </div>

            {loading ? (
                <Loader fullscreen={false} />
            ) : (
                <>
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={true}
                        isPagination={false}
                        SearchPlaceholder="Search..."
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
                                renderScChips(detail.service_centers)
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
        </div>
    );
};

export default ExceptionList;
