import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label
} from "reactstrap";
import Select from "react-select";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { OPS_DISPUTES_STALE, OPS_DISPUTES_MARK_DIS, SERVICE_CENTER } from "../../api";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../components/MainHeaderCom";

const SERVER_PAGE_SIZE = 100;

const StaleShipments = () => {
    useEffect(() => { document.title = "Stale Shipments"; }, []);

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, []);
    const { apifunc: fetchStale, data: staleData, loading } = useGetApiCall();
    const { apifunc: fetchSCs, data: scData } = useGetApiCall();
    const { apifunc: markDis, loading: markLoading } = usePostApiCall(null, "AWB marked as Disputed");

    const [modal, setModal] = useState(false);
    const [selectedAWB, setSelectedAWB] = useState(null);
    const [selectedSCs, setSelectedSCs] = useState([]);
    const [page, setPage] = useState(1);

    const loadStale = useCallback((targetPage = 1) => {
        fetchStale(`${OPS_DISPUTES_STALE}?user_id=${userId}&page=${targetPage}&page_size=${SERVER_PAGE_SIZE}`);
        setPage(targetPage);
    }, [fetchStale, userId]);

    useEffect(() => {
        loadStale(1);
        fetchSCs(`${SERVICE_CENTER}`);
    }, []);

    const scOptions = useMemo(() => {
        if (!scData) return [];
        const list = Array.isArray(scData) ? scData : scData?.results || [];
        return list.map(sc => ({
            value: sc.id,
            label: `${sc.service_center_code || sc.code || sc.name} — ${sc.city || ""}`
        }));
    }, [scData]);

    const openModal = useCallback((awbno) => {
        setSelectedAWB(awbno);
        setSelectedSCs([]);
        setModal(true);
    }, []);

    const handleMarkDis = async () => {
        if (!selectedSCs.length) return;
        const res = await markDis(OPS_DISPUTES_MARK_DIS, {
            employee_id: userId,
            awbno: selectedAWB,
            service_center_ids: selectedSCs.map(s => s.value)
        });
        if (res?.status === "success") {
            setModal(false);
            loadStale(page);
        }
    };

    const rows = useMemo(() => staleData?.results || [], [staleData]);
    const total = staleData?.total ?? 0;
    const hasMore = staleData?.has_more ?? false;
    const totalPages = Math.max(1, Math.ceil(total / SERVER_PAGE_SIZE));

    const columns = useMemo(() => [
        {
            header: "AWB No",
            accessorKey: "awbno",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Last Status",
            accessorKey: "last_status",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Last Update",
            accessorKey: "last_update",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleString() : "--"
        },
        {
            header: "Last SC",
            accessorKey: "last_sc",
            enableSorting: true,
            enableColumnFilter: false,
        },
        {
            header: "Consignee",
            accessorKey: "consignee_name",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Phone",
            accessorKey: "consignee_phone",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "City",
            accessorKey: "consignee_city",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Customer",
            accessorKey: "customer_name",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Order ID",
            accessorKey: "order_id",
            enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || "--"
        },
        {
            header: "Action",
            accessorKey: "action",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <Button color="warning" size="sm" onClick={() => openModal(row.original.awbno)}>
                    Mark Disputed
                </Button>
            )
        }
    ], [openModal]);

    if (loading) return (
        <div className="d-flex justify-content-center mt-5">
            <GridLoader color="#556ee6" />
        </div>
    );

    return (
        <div className="page-content">
            <MainHeaderComp
                title="Stale Shipments"
                subTitle={`AWBs with no tracking update for 7+ days — ${staleData?.total ?? rows.length} total`}
            />
            <div className="mt-3">
                <TableContainer
                    columns={columns}
                    data={rows}
                    isGlobalFilter={true}
                    isPagination={false}
                    SearchPlaceholder="Search AWB..."
                    tableClass="table-bordered table-nowrap"
                />

                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-1 py-2 border-top">
                        <span className="text-muted small">
                            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                            &nbsp;·&nbsp;{total.toLocaleString()} total records
                        </span>
                        <div className="d-flex gap-2">
                            <Button
                                size="sm"
                                color="secondary"
                                outline
                                disabled={page <= 1}
                                onClick={() => loadStale(page - 1)}
                            >
                                ‹ Prev
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                outline
                                disabled={!hasMore}
                                onClick={() => loadStale(page + 1)}
                            >
                                Next ›
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={modal} toggle={() => setModal(false)}>
                <ModalHeader toggle={() => setModal(false)}>
                    Mark as Disputed — {selectedAWB}
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label>
                            Service Centers <span className="text-danger">*</span>
                        </Label>
                        <Select
                            isMulti
                            options={scOptions}
                            value={selectedSCs}
                            onChange={setSelectedSCs}
                            placeholder="Select service centers..."
                        />
                        <small className="text-muted mt-1 d-block">
                            Managers at these SCs will see this dispute.
                        </small>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setModal(false)}>Cancel</Button>
                    <Button
                        color="warning"
                        disabled={!selectedSCs.length || markLoading}
                        onClick={handleMarkDis}
                    >
                        {markLoading ? "Marking..." : "Confirm"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default StaleShipments;
