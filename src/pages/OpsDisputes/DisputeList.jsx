import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Nav, NavItem, NavLink } from "reactstrap";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { OPS_DISPUTES_BASE } from "../../api";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../components/MainHeaderCom";

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
        <div className="page-content">
            <MainHeaderComp
                title="Disputes"
                subTitle={`Total: ${total}`}
            />

            <Nav tabs className="mt-3 mb-2">
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
                <div className="d-flex justify-content-center mt-5">
                    <GridLoader color="#556ee6" />
                </div>
            ) : (
                <>
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={true}
                        isPagination={false}
                        SearchPlaceholder="Search AWB..."
                        tableClass="table-bordered table-nowrap"
                    />

                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 px-3 py-2 bg-light rounded border">
                        <div className="d-flex align-items-center gap-2 mb-2 mb-sm-0">
                            <span className="text-muted small">
                                Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} entries
                            </span>
                            <div className="d-flex align-items-center gap-1 ms-3">
                                <span className="text-muted small">Per page:</span>
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
                            <div className="d-flex align-items-center gap-1">
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
        </div>
    );
};

export default DisputeList;
