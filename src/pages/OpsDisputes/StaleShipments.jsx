import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Button, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label
} from "reactstrap";
import Select from "react-select";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { OPS_DISPUTES_STALE, OPS_DISPUTES_MARK_DIS, SERVICE_CENTER_LIST } from "../../api";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../components/MainHeaderCom";
import { customStyles } from "../../helpers/CustomStyle";

const StaleShipments = () => {
    useEffect(() => { document.title = "Stale Shipments"; }, []);

    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, []);
    const { apifunc: fetchStale, data: staleData, loading } = useGetApiCall();
    const { apifunc: fetchSCs, data: scData } = usePostApiCall();
    const { apifunc: markDis, loading: markLoading } = usePostApiCall(null, "AWB marked as Disputed");

    const [modal, setModal] = useState(false);
    const [selectedAWB, setSelectedAWB] = useState(null);
    const [selectedSCs, setSelectedSCs] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const loadStale = useCallback((targetPage = 1, targetPageSize = pageSize) => {
        fetchStale(`${OPS_DISPUTES_STALE}?user_id=${userId}&page=${targetPage}&page_size=${targetPageSize}`);
        setPage(targetPage);
    }, [fetchStale, userId, pageSize]);

    useEffect(() => {
        loadStale(1);
        fetchSCs(SERVICE_CENTER_LIST, {});
    }, []);

    const scOptions = useMemo(() => {
        const list = scData?.results?.results || [];
        return list.map(sc => ({
            value: sc.id,
            label: `${sc.service_center_code} — ${sc.company_name}${sc.city ? ` (${sc.city})` : ""}`
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
            user_id: userId,
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
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

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

                {total > 0 && (
                    <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 px-3 py-3 bg-light rounded border">
                        <div className="d-flex align-items-center gap-3 mb-2 mb-sm-0">
                            <span className="text-muted small">
                                Showing <strong>{total > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total.toLocaleString()}</strong> entries
                            </span>
                            {total > 10 && (
                                <div className="d-flex align-items-center gap-2 ps-3 border-start">
                                    <label className="text-muted small mb-0">Per page:</label>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: "70px", cursor: "pointer" }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            const newSize = Number(e.target.value);
                                            setPageSize(newSize);
                                            setPage(1);
                                            loadStale(1, newSize);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    size="sm"
                                    color="secondary"
                                    outline
                                    disabled={page <= 1 || loading}
                                    onClick={() => loadStale(page - 1, pageSize)}
                                    className="px-3"
                                >
                                    ‹ Prev
                                </Button>

                                <div className="d-flex gap-1">
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
                                                    className="px-2"
                                                    onClick={() => loadStale(i, pageSize)}
                                                >
                                                    {i}
                                                </Button>
                                            );
                                        }
                                        return pages;
                                    })()}
                                </div>

                                <Button
                                    size="sm"
                                    color="secondary"
                                    outline
                                    disabled={page >= totalPages || loading}
                                    onClick={() => loadStale(page + 1, pageSize)}
                                    className="px-3"
                                >
                                    Next ›
                                </Button>
                            </div>
                        )}
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
                            isSearchable
                            options={scOptions}
                            value={selectedSCs}
                            onChange={setSelectedSCs}
                            placeholder="Search by code, company or city..."
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
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
