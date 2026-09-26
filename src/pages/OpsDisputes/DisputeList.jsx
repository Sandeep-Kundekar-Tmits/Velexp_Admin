import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button, Nav, NavItem, NavLink,
    Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, FormFeedback
} from "@/components/ui";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { OPS_DISPUTES_BASE, OPS_DISPUTES_MARK_DIS, SERVICE_CENTER_LIST } from "../../api";
import Loader from "@/Loaders/Loader";
import MainHeaderComp from "../../components/MainHeaderCom";
import { customStyles } from "../../helpers/CustomStyle";
import ToasterProvider from "../../helpers/ToasterProvider";

const STATUS_TABS = [
    { label: "Open", value: "OPEN" },
    { label: "Lost (SPL)", value: "SPL" },
    { label: "Closed", value: "CLOSED" },
    { label: "All", value: "ALL" },
];

const STATUS_BADGE = { OPEN: "warning", SPL: "danger", CLOSED: "success" };

const DisputeList = () => {
    useEffect(() => { document.title = "Disputes"; }, []);

    const navigate = useNavigate();
    const { ErrorToaster } = ToasterProvider();
    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, []);
    const { apifunc: fetchDisputes, data, loading } = useGetApiCall();

    const [activeTab, setActiveTab] = useState("OPEN");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const load = useCallback((status, targetPage = 1, targetPageSize = pageSize) => {
        fetchDisputes(`${OPS_DISPUTES_BASE}?user_id=${userId}&status=${status}&page=${targetPage}&page_size=${targetPageSize}`);
        setPage(targetPage);
    }, [fetchDisputes, userId, pageSize]);

    useEffect(() => { load(activeTab, 1, pageSize); }, []);

    // Mark Disputed -- standalone version of StaleShipments.jsx's per-row
    // action: that one already knows the AWB from the row it's on, so its
    // modal only asks for Service Centers. Raised from here with no row to
    // start from, so the AWB is its own field, plus a Remark this page's
    // action captures that the stale-shipments flow currently doesn't.
    const { apifunc: fetchSCs, data: scData } = usePostApiCall();
    const { apifunc: markDis, loading: markLoading } = usePostApiCall(null, "AWB marked as Disputed");

    useEffect(() => { fetchSCs(SERVICE_CENTER_LIST, {}); }, []);

    const scOptions = useMemo(() => {
        const list = scData?.results?.results || [];
        return list.map(sc => ({
            value: sc.id,
            label: `${sc.service_center_code} — ${sc.company_name}${sc.city ? ` (${sc.city})` : ""}`
        }));
    }, [scData]);

    const [markModal, setMarkModal] = useState(false);
    const [markAwb, setMarkAwb] = useState("");
    const [markSCs, setMarkSCs] = useState([]);
    const [markRemark, setMarkRemark] = useState("");
    const [markErrors, setMarkErrors] = useState({});

    const openMarkModal = () => {
        setMarkAwb("");
        setMarkSCs([]);
        setMarkRemark("");
        setMarkErrors({});
        setMarkModal(true);
    };

    const handleMarkDis = async () => {
        const errors = {};
        if (!markAwb.trim()) errors.awbno = "AWB number is required";
        if (!markSCs.length) errors.service_centers = "Select at least one service centre";
        if (!markRemark.trim()) errors.remark = "Remark is required";
        setMarkErrors(errors);
        if (Object.keys(errors).length) return;

        const res = await markDis(OPS_DISPUTES_MARK_DIS, {
            user_id: userId,
            awbno: markAwb.trim(),
            service_center_ids: markSCs.map(s => s.value),
            remark: markRemark.trim(),
        });
        if (res?.status === "success") {
            setMarkModal(false);
            load(activeTab, page, pageSize);
        } else {
            // This endpoint answers 200 OK with {status:"error", message}
            // for a logical rejection (e.g. "AWB has a terminal status and
            // cannot be disputed") -- usePostApiCall's own error toast only
            // fires on a non-2xx HTTP status, so it never sees this.
            ErrorToaster(res?.message || "Failed to mark AWB as disputed");
        }
    };

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
        setPage(1);
        load(tabValue, 1, pageSize);
    };

    const rows = useMemo(() => Array.isArray(data) ? data : (data?.results || []), [data]);
    const total = useMemo(() => Array.isArray(data) ? data.length : (data?.total ?? data?.count ?? rows.length), [data, rows]);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const columns = useMemo(() => [
        {
            header: "AWB No",
            accessorKey: "awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Status",
            accessorKey: "dispute_status",
            enableColumnFilter: false,
            cell: ({ getValue }) => {
                const s = getValue();
                return <span className={`badge bg-${STATUS_BADGE[s] || "secondary"}`}>{s}</span>;
            }
        },
        {
            header: "Service Centers",
            accessorKey: "service_centers",
            enableColumnFilter: false,
            cell: ({ getValue }) =>
                (getValue() || []).map(sc => sc.service_center_code).join(", ") || "--"
        },
        {
            header: "Marked By",
            accessorKey: "marked_dis_by_name",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Marked At",
            accessorKey: "marked_dis_at",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleString() : "--"
        },
        {
            header: "Action",
            accessorKey: "action",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <Button
                    color="primary"
                    size="sm"
                    onClick={() => navigate(`/ops-disputes/${row.original.id}`)}
                >
                    View
                </Button>
            )
        }
    ], [navigate]);

    return (
        /* page-fit with no page-fit-body chain: the grid is wrapped only in a
           fragment, so it is already a direct flex child of this root. */
        <div className="page-content page-fit">
            <MainHeaderComp
                title="Disputes"
                subTitle={`Total: ${total}`}
                extraFields={
                    <Button color="warning" onClick={openMarkModal}>
                        Mark Disputed
                    </Button>
                }
            />

            <Nav tabs className="mt-4 mb-2">
                {STATUS_TABS.map(tab => (
                    <NavItem key={tab.value}>
                        <NavLink
                            className={activeTab === tab.value ? "active" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => handleTabChange(tab.value)}
                        >
                            {tab.label}
                        </NavLink>
                    </NavItem>
                ))}
            </Nav>

            {loading ? (
                <Loader fullscreen={false} />
            ) : (
                <>
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={true}
                        isPagination={false}
                        SearchPlaceholder="Search AWB..."
                        tableClass="table-bordered table-nowrap"
                        fillHeight
                    />

                    <div className="flex flex-wrap justify-between items-center mt-4 px-4 py-2 bg-canvas rounded border">
                        <div className="flex items-center gap-2 mb-2 mb-sm-0">
                            <span className="text-ink-muted text-xs">
                                Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} entries
                            </span>
                            <div className="flex items-center gap-1 ml-4">
                                <span className="text-ink-muted text-xs">Per page:</span>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: "80px", cursor: "pointer" }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        const newSize = Number(e.target.value);
                                        setPageSize(newSize);
                                        setPage(1);
                                        load(activeTab, 1, newSize);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    color="secondary"
                                    outline
                                    disabled={page <= 1 || loading}
                                    onClick={() => load(activeTab, page - 1, pageSize)}
                                >
                                    ‹ Prev
                                </Button>
                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5;
                                    let start = Math.max(1, page - 2);
                                    let end = Math.min(totalPages, start + maxVisible - 1);
                                    if (end - start + 1 < maxVisible) {
                                        start = Math.max(1, end - maxVisible + 1);
                                    }
                                    for (let i = start; i <= end; i++) {
                                        pages.push(
                                            <Button
                                                key={i}
                                                size="sm"
                                                color={page === i ? "primary" : "secondary"}
                                                outline={page !== i}
                                                disabled={loading}
                                                onClick={() => load(activeTab, i, pageSize)}
                                            >
                                                {i}
                                            </Button>
                                        );
                                    }
                                    return pages;
                                })()}
                                <Button
                                    size="sm"
                                    color="secondary"
                                    outline
                                    disabled={page >= totalPages || loading}
                                    onClick={() => load(activeTab, page + 1, pageSize)}
                                >
                                    Next ›
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Modal isOpen={markModal} toggle={() => setMarkModal(false)}>
                <ModalHeader toggle={() => setMarkModal(false)}>
                    Mark AWB as Disputed
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label>AWB No <span className="text-danger-500">*</span></Label>
                        <Input
                            type="text"
                            value={markAwb}
                            onChange={(e) => setMarkAwb(e.target.value ? e.target.value.toUpperCase() : "")}
                            invalid={!!markErrors.awbno}
                            placeholder="Enter AWB number"
                        />
                        {markErrors.awbno && <FormFeedback>{markErrors.awbno}</FormFeedback>}
                    </FormGroup>
                    <FormGroup>
                        <Label>Service Centers <span className="text-danger-500">*</span></Label>
                        <Select
                            isMulti
                            isSearchable
                            options={scOptions}
                            value={markSCs}
                            onChange={setMarkSCs}
                            placeholder="Search by code, company or city..."
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                        {markErrors.service_centers && (
                            <div className="text-danger-500 text-xs mt-1">{markErrors.service_centers}</div>
                        )}
                        <small className="text-ink-muted mt-1 block">
                            Managers at these SCs will see this dispute.
                        </small>
                    </FormGroup>
                    <FormGroup className="mb-0">
                        <Label>Remark <span className="text-danger-500">*</span></Label>
                        <Input
                            type="textarea"
                            value={markRemark}
                            onChange={(e) => setMarkRemark(e.target.value)}
                            invalid={!!markErrors.remark}
                            placeholder="Reason for raising this dispute"
                        />
                        {markErrors.remark && <FormFeedback>{markErrors.remark}</FormFeedback>}
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setMarkModal(false)}>Cancel</Button>
                    <Button color="warning" disabled={markLoading} onClick={handleMarkDis}>
                        {markLoading ? "Marking..." : "Confirm"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default DisputeList;
