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

    const load = useCallback((status) => {
        fetchDisputes(`${OPS_DISPUTES_BASE}?employee_id=${userId}&status=${status}`);
    }, [fetchDisputes, userId]);

    useEffect(() => { load(activeTab); }, [activeTab]);

    const rows = useMemo(() => data?.results || [], [data]);

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
                subTitle={`Total: ${data?.total ?? rows.length}`}
            />

            <Nav tabs className="mt-3 mb-2">
                {STATUS_TABS.map(tab => (
                    <NavItem key={tab.value}>
                        <NavLink
                            className={activeTab === tab.value ? "active" : ""}
                            style={{ cursor: "pointer" }}
                            onClick={() => setActiveTab(tab.value)}
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
                <TableContainer
                    columns={columns}
                    data={rows}
                    isGlobalFilter={true}
                    isPagination={true}
                    SearchPlaceholder="Search AWB..."
                    tableClass="table-bordered table-nowrap"
                />
            )}
        </div>
    );
};

export default DisputeList;
