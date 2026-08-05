import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { OPS_DISPUTES_LOST } from "../../api";
import Loader from "@/Loaders/Loader";
import MainHeaderComp from "../../components/MainHeaderCom";

const LostDashboard = () => {
    useEffect(() => { document.title = "Lost Shipments Dashboard"; }, []);

    const navigate = useNavigate();
    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, []);
    const { apifunc: fetchLost, data, loading } = useGetApiCall();

    useEffect(() => {
        fetchLost(`${OPS_DISPUTES_LOST}?employee_id=${userId}`);
    }, []);

    const rows = useMemo(() => data?.results || [], [data]);

    const columns = useMemo(() => [
        {
            header: "AWB No",
            accessorKey: "awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Marked Lost By",
            accessorKey: "marked_spl_by_name",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Marked Lost At",
            accessorKey: "marked_spl_at",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleString() : "--"
        },
        {
            header: "Remark",
            accessorKey: "spl_remark",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Service Centers",
            accessorKey: "service_centers",
            enableColumnFilter: false,
            cell: ({ getValue }) =>
                (getValue() || []).map(sc => sc.service_center_code).join(", ") || "--"
        },
        {
            header: "Documents",
            accessorKey: "documents",
            enableColumnFilter: false,
            enableSorting: false,
            cell: ({ getValue }) => {
                const docs = getValue() || [];
                if (!docs.length) return <span className="text-ink-muted">—</span>;
                return (
                    <span className="badge bg-secondary">
                        {docs.length} file{docs.length > 1 ? "s" : ""}
                    </span>
                );
            }
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

    if (loading) return (
        <Loader fullscreen={false} />
    );

    return (
        <div className="page-content">
            <MainHeaderComp
                title="Lost Shipments Dashboard"
                subTitle={`Total declared lost: ${data?.total ?? rows.length}`}
            />
            <div className="mt-4">
                <TableContainer
                    columns={columns}
                    data={rows}
                    isGlobalFilter={true}
                    isPagination={true}
                    SearchPlaceholder="Search AWB..."
                    tableClass="table-bordered table-nowrap"
                />
            </div>
        </div>
    );
};

export default LostDashboard;
