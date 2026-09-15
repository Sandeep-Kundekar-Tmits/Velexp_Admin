import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Spinner } from "@/components/ui";
import Select from "react-select";
import { ListChecks } from "lucide-react";
import MainHeaderComp from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import DateRangeInput from "../../components/Common/DateRangeInput";
import { customStyles } from "../../helpers/CustomStyle";
import MarkForRtoModal from "../../components/RTO_Approval/MarkForRtoModal";
import MarkForRtoExcelModal from "../../components/RTO_Approval/MarkForRtoExcelModal";
import RtoBookingPanel from "../../components/RTO_Approval/RtoBookingPanel";
import BulkRtsMarkModal from "../../components/RTO_Approval/BulkRtsMarkModal";
import { GET_USER_API, GET_UNDELIVERED_SHIPMENTS, GET_DELIVERY_ATTEMPTS_REMARKS, BULK_SET_SHIPMENT_FLAG } from "../../api/index";
import usePostApiCall from "../../hooks/usePostApiCall";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import YMD_DateFormate from "../../helpers/YMD_DateFormate";
import { toast } from "react-toastify";
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions";
import { authFetch } from "@/lib/http";

const PAGE_TABS = [
    { value: "attempts", label: "Delivery Attempts (RTS)" },
    // RTO Booking tab hidden for now — re-add here to bring it back
    // { value: "rto_booking", label: "RTO Booking" },
];

const ATTEMPTS_SUB_TABS = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
];

const RtoApproval = () => {
    const { isAdmin } = checkCustomerPermissions();

    // Top-level page tab: RTS delivery-attempts flow / CS RTO flagging / Ops RTO booking
    const [pageTab, setPageTab] = useState("attempts");
    // Delivery Attempts sub-tab: Pending vs Approved (by shipment_flag)
    const [attemptsSubTab, setAttemptsSubTab] = useState("pending");
    const [markForRtoOpen, setMarkForRtoOpen] = useState(false);
    const [markForRtoExcelOpen, setMarkForRtoExcelOpen] = useState(false);
    const [removeRtoExcelOpen, setRemoveRtoExcelOpen] = useState(false);
    // Bulk RTS Mark modal (Excel upload / manual entry)
    const [bulkRtsOpen, setBulkRtsOpen] = useState(false);

    // State for managing date range filtering
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });

    // Remove (clear shipment_flag) confirm state — holds the AWB(s) to remove,
    // whether triggered from a single row's "Remove" button or the bulk "Remove RTO" button
    const [removeFlagAwbs, setRemoveFlagAwbs] = useState([]);
    const [showRemoveFlagConfirm, setShowRemoveFlagConfirm] = useState(false);
    const [removeFlagLoading, setRemoveFlagLoading] = useState(false);
    // AWB(s) the Mark for RTO modal was opened with (single row or bulk selection)
    const [markForRtoAwbs, setMarkForRtoAwbs] = useState([]);
    // State for the customer filter dropdown
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    // List of customer options fetched from the API
    const [userListOptions, setUserListOptions] = useState([])

    // Hook for fetching the customer list
    const { apifunc: GetUserList, data: userListData } = useGetApiCall()
    // Hook for fetching undelivered shipments (now using POST)
    const { apifunc: GetUndeliveredShipments, data: shipmentsData, loading: shipmentsLoading } = usePostApiCall()

    // Load user list on component mount
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
    }, [])

    // Process user list data into dropdown options when API returns
    useEffect(() => {
        if (userListData) {
            const options = userListData
                ?.filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null && name !== "null" && name !== "undefined" && name !== "";
                })
                ?.map((ele) => ({
                    value: ele.id,
                    label: ele.username ? `${ele.username} - ${ele.customer_name}` : ele.customer_name,
                    customer_name: ele.customer_name,
                }));
            setUserListOptions(options);
        }
    }, [userListData]);

    // Table state for row selections
    const [remarks, setRemarks] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    const [approvedRowSelection, setApprovedRowSelection] = useState({});
    // True once "Check" has been run for the currently selected customer/date range.
    // Reset whenever either filter changes so stale results from a previous
    // selection aren't shown until the user re-checks.
    const [hasSearched, setHasSearched] = useState(false);

    // List of shipments derived from the API response
    // Only return data once the user has checked the current customer + date range
    const filteredShipments = useMemo(() => {
        if (!hasSearched || !selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            return [];
        }
        return shipmentsData?.data || [];
    }, [shipmentsData, hasSearched, selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

    // Split by shipment_flag: not yet flagged (null) -> Pending, flagged -> Approved
    const pendingShipments = useMemo(
        () => filteredShipments.filter(s => !s.shipment_flag),
        [filteredShipments]
    );
    const approvedShipments = useMemo(
        () => filteredShipments.filter(s => !!s.shipment_flag),
        [filteredShipments]
    );

    /**
     * Manually fetch undelivered shipments when "Check" is clicked.
     */
    const handleCheck = () => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            toast.error("Please select both a customer and a date range.");
            return;
        }
        const datePayload = YMD_DateFormate(selectedRange);
        const payload = {
            customer_name: selectedCustomer.customer_name,
            from_date: datePayload.from_date,
            to_date: datePayload.to_date
        };
        GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, payload);
        setHasSearched(true);
    };

    // Clear row selections and stale results whenever filters change
    useEffect(() => {
        setRowSelection({});
        setApprovedRowSelection({});
        setHasSearched(false);
    }, [selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

    // Triggered when clicking Approve on a single row — opens the Mark for RTO modal
    // locked to this AWB (flags shipment_flag: "RTO_APPROVAL")
    const handleApprove = (row) => {
        setMarkForRtoAwbs([row.awbno].filter(Boolean));
        setMarkForRtoOpen(true);
    };

    // Triggered by "Approve Selected" — same modal, locked to the checked rows
    const handleApproveSelected = () => {
        setMarkForRtoAwbs(selectedShipments.map(s => s.awbno).filter(Boolean));
        setMarkForRtoOpen(true);
    };

    // Refresh the undelivered-shipments list after a successful RTO flag, keeping the
    // currently selected customer/date range
    const refreshShipments = () => {
        if (selectedCustomer && selectedRange.startDate && selectedRange.endDate) {
            const datePayload = YMD_DateFormate(selectedRange);
            GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, {
                customer_name: selectedCustomer.customer_name,
                from_date: datePayload.from_date,
                to_date: datePayload.to_date,
            });
        }
    };

    // Remove confirm — clears the shipment_flag for one or many AWBs (same
    // bulk-set-shipment-flag call as Approve, just with shipment_flag: null)
    const handleRemoveFlagConfirm = async () => {
        if (removeFlagAwbs.length === 0) return;
        setRemoveFlagLoading(true);
        try {
            const userId = JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id;
            const res = await authFetch(BULK_SET_SHIPMENT_FLAG, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    awbno_list: removeFlagAwbs,
                    shipment_flag: null,
                    user_id: userId,
                }),
            });
            const json = await res.json();
            if (!res.ok || json?.status === "error") throw new Error(json?.message || `Error ${res.status}`);
            toast.success(json?.message || "Removed from Approved", { autoClose: 4000 });
            setShowRemoveFlagConfirm(false);
            setRemoveFlagAwbs([]);
            setApprovedRowSelection({});
            refreshShipments();
        } catch (err) {
            toast.error(err.message, { autoClose: 5000 });
        } finally {
            setRemoveFlagLoading(false);
        }
    };

    // Clear all row selections
    const handleCancelSelection = () => {
        setRowSelection({});
    };

    const handleCancelApprovedSelection = () => {
        setApprovedRowSelection({});
    };

    const selectedShipments = useMemo(() => {
        return pendingShipments.filter((item, index) => rowSelection[index]);
    }, [rowSelection, pendingShipments]);

    const selectedApprovedShipments = useMemo(() => {
        return approvedShipments.filter((item, index) => approvedRowSelection[index]);
    }, [approvedRowSelection, approvedShipments]);

    // Triggered by the bulk "Remove RTO" button — opens the same confirm modal
    // used for a single row, locked to the checked rows
    const handleRemoveSelected = () => {
        setRemoveFlagAwbs(selectedApprovedShipments.map(s => s.awbno).filter(Boolean));
        setShowRemoveFlagConfirm(true);
    };


    // Columns shared by both tables (everything except selection/action)
    const baseColumns = useMemo(() => [
        {
            header: "AWB No.",
            accessorKey: "awbno",
        },
        {
            header: "Service Center",
            accessorKey: "service_center",
        },
        {
            header: "Latest Status",
            accessorKey: "latest_status",
            cell: ({ row }) => {
                const status = row.original.latest_status?.trim() || "";
                let badgeClass = "badge-soft-secondary";

                if (['SPD', 'Delivered'].includes(status)) {
                    badgeClass = "badge-soft-success";
                } else if (['SAO', 'LDP', 'PUD', 'SMR', 'ITR'].includes(status)) {
                    badgeClass = "badge-soft-primary";
                } else if (status === 'RTO') {
                    badgeClass = "badge-soft-danger";
                } else if (['SPH', 'DRC', 'ICA', 'CRF', 'CNS', 'RTA', 'CAN', 'COS', 'ERA', 'PUP', 'DPT', 'DIS', 'OSA', 'ODD', 'CNA'].includes(status)) {
                    badgeClass = "badge-soft-warning";
                }

                return (
                    <span className={`badge ${badgeClass} font-size-12 px-2 py-1`}>
                        {status || "--"}
                    </span>
                );
            }
        },
        {
            header: "Pick City",
            accessorKey: "pick_city",
        },
        {
            header: "Drop City",
            accessorKey: "drop_city",
        },
        {
            header: "Delivery Attempts",
            accessorKey: "delivery_attempts",
        },
    ], []);

    // Pending table: bulk-selectable, single action = Approve
    const pendingColumns = useMemo(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <div className="flex justify-center">
                    {selectedCustomer && (
                        <Input
                            type="checkbox"
                            checked={table.getIsAllRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                    )}
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ),
            size: 50,
        },
        ...baseColumns,
        {
            header: "Action",
            id: "action",
            cell: ({ row }) => (
                <Button
                    color="primary"
                    size="sm"
                    className="px-4 py-1"
                    style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                    onClick={() => handleApprove(row.original)}
                >
                    Approve
                </Button>
            ),
        },
    ], [selectedCustomer, baseColumns]);

    // Approved table: bulk-selectable, single action = Remove (clears the flag)
    const approvedColumns = useMemo(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <div className="flex justify-center">
                    {selectedCustomer && (
                        <Input
                            type="checkbox"
                            checked={table.getIsAllRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                    )}
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onChange={row.getToggleSelectedHandler()}
                    />
                </div>
            ),
            size: 50,
        },
        ...baseColumns,
        {
            header: "Action",
            id: "action",
            cell: ({ row }) => (
                <Button
                    color="danger"
                    size="sm"
                    className="px-4 py-1"
                    style={{ borderRadius: "8px" }}
                    onClick={() => {
                        setRemoveFlagAwbs([row.original.awbno].filter(Boolean));
                        setShowRemoveFlagConfirm(true);
                    }}
                >
                    Remove
                </Button>
            ),
        },
    ], [selectedCustomer, baseColumns]);



    const selectedRowCount = Object.keys(rowSelection).length;
    const selectedApprovedRowCount = Object.keys(approvedRowSelection).length;

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="RTO Approval"
                subTitle="Approve returns to origin, or mark shipments RTS in bulk."
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-ghost"
                        onClick={() => setBulkRtsOpen(true)}
                    >
                        <ListChecks aria-hidden="true" size={15} />
                        Bulk RTS Mark
                    </Button>
                }
            />

            <div className="container-fluid page-fit-body relative z-10 pb-4">
                {PAGE_TABS.length > 1 && (
                    <Nav tabs className="mb-2">
                        {PAGE_TABS.map((tab) => (
                            <NavItem key={tab.value}>
                                <NavLink
                                    className={pageTab === tab.value ? "active" : ""}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => setPageTab(tab.value)}
                                >
                                    {tab.label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>
                )}

                {pageTab === "attempts" && (
                    <>
                        <div className="filter-row">
                            <div className="filter-group">
                                <div className="flex w-full flex-col gap-1.5 sm:w-52">
                                    <Label className="form-label m-0 font-bold text-ink-muted">
                                        Select Customer
                                    </Label>
                                    <Select
                                        options={userListOptions}
                                        placeholder="Select Customer"
                                        value={selectedCustomer}
                                        onChange={(val) => setSelectedCustomer(val)}
                                        isClearable={true}
                                        styles={customStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                </div>

                                <div className="flex w-full flex-col gap-1.5 sm:w-56">
                                    <Label className="form-label m-0 font-bold text-ink-muted">
                                        Select Date Range
                                    </Label>
                                    <DateRangeInput
                                        value={selectedRange}
                                        onChange={(range) => setSelectedRange(range)}
                                        isBorder={true}
                                    />
                                </div>

                                <Button
                                    className="table-action-btn table-action-btn-primary"
                                    onClick={handleCheck}
                                >
                                    {shipmentsLoading ? "Checking.." : "Check"}
                                </Button>
                            </div>

                            <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
                                <Button
                                    className="table-action-btn table-action-btn-ghost"
                                    onClick={() => setMarkForRtoExcelOpen(true)}
                                >
                                    Mark for RTO (Excel)
                                </Button>
                                <Button
                                    color="danger"
                                    outline
                                    className="table-action-btn"
                                    onClick={() => setRemoveRtoExcelOpen(true)}
                                >
                                    Remove RTO (Excel)
                                </Button>
                            </div>
                        </div>

                        <Nav tabs className="mt-3 mb-2">
                            {ATTEMPTS_SUB_TABS.map((tab) => (
                                <NavItem key={tab.value}>
                                    <NavLink
                                        className={attemptsSubTab === tab.value ? "active" : ""}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setAttemptsSubTab(tab.value)}
                                    >
                                        {tab.label}{" "}
                                        <span className="badge bg-secondary ml-1">
                                            {tab.value === "pending" ? pendingShipments.length : approvedShipments.length}
                                        </span>
                                    </NavLink>
                                </NavItem>
                            ))}
                        </Nav>

                        <div className="page-fit-body mt-2">
                            {shipmentsLoading ? (
                                <div className="flex flex-col justify-center items-center" style={{ height: "40vh" }}>
                                    <Spinner style={{ width: "3rem", height: "3rem" }} />
                                    <p className="mt-4 text-lg">Loading shipments...</p>
                                </div>
                            ) : attemptsSubTab === "pending" ? (
                                <TableContainer
                                    columns={pendingColumns}
                                    data={pendingShipments}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    isCustomPageSize={true}
                                    SearchPlaceholder="Search across all columns..."
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                    theadClass="sticky top-0 z-10"
                                    isStickyHeader={true}
                                    stickyTop={0}
                                    fillHeight
                                    tableHeight="65vh"
                                    rowSelection={rowSelection}
                                    onRowSelectionChange={setRowSelection}
                                    defaultPageSize={100}
                                />
                            ) : (
                                <TableContainer
                                    columns={approvedColumns}
                                    data={approvedShipments}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    isCustomPageSize={true}
                                    SearchPlaceholder="Search across all columns..."
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                    theadClass="sticky top-0 z-10"
                                    isStickyHeader={true}
                                    stickyTop={0}
                                    fillHeight
                                    tableHeight="65vh"
                                    rowSelection={approvedRowSelection}
                                    onRowSelectionChange={setApprovedRowSelection}
                                    defaultPageSize={100}
                                />
                            )}
                        </div>
                    </>
                )}

                {pageTab === "rto_booking" && <RtoBookingPanel />}
            </div>

            <MarkForRtoModal
                isOpen={markForRtoOpen}
                toggle={() => setMarkForRtoOpen(false)}
                initialAwbList={markForRtoAwbs}
                onDone={() => {
                    refreshShipments();
                    setRowSelection({});
                }}
            />

            <MarkForRtoExcelModal
                isOpen={markForRtoExcelOpen}
                toggle={() => setMarkForRtoExcelOpen(false)}
                onDone={refreshShipments}
            />

            <MarkForRtoExcelModal
                isOpen={removeRtoExcelOpen}
                toggle={() => setRemoveRtoExcelOpen(false)}
                onDone={refreshShipments}
                mode="remove"
            />

            <BulkRtsMarkModal isOpen={bulkRtsOpen} toggle={() => setBulkRtsOpen(false)} />

            {/* Remove (clear shipment_flag) confirmation modal */}
            <Modal isOpen={showRemoveFlagConfirm} toggle={() => setShowRemoveFlagConfirm(false)} centered>
                <ModalHeader toggle={() => setShowRemoveFlagConfirm(false)}>Remove from Approved</ModalHeader>
                <ModalBody>
                    {removeFlagAwbs.length === 1 ? (
                        <>Are you sure you want to remove the RTO approval for AWB <strong>{removeFlagAwbs[0]}</strong>?</>
                    ) : (
                        <>Are you sure you want to remove the RTO approval for <strong>{removeFlagAwbs.length}</strong> shipments?</>
                    )}
                    {" "}It will move back to Pending.
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowRemoveFlagConfirm(false)} disabled={removeFlagLoading}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleRemoveFlagConfirm} disabled={removeFlagLoading}>
                        {removeFlagLoading
                            ? <><Spinner size="sm" /> Removing…</>
                            : "Remove"}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Bulk Action Footer */}
            {pageTab === "attempts" && attemptsSubTab === "pending" && selectedRowCount > 0 && (
                <div
                    className="fixed bottom-[--sidebar-gap] right-[--sidebar-gap] z-1000 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-white/10 bg-[rgba(17,24,39,0.85)] px-4 py-3 shadow-[0_24px_60px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl"
                    style={{ left: `calc(var(--sidebar-width) + var(--sidebar-gap) * 2)` }}
                >
                    <span className="mr-auto text-[13px] text-ink-muted">
                        {selectedRowCount} selected
                    </span>
                    <Button
                        onClick={handleCancelSelection}
                        className="table-action-btn table-action-btn-ghost"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApproveSelected}
                        className="table-action-btn table-action-btn-primary"
                    >
                        Approve Selected
                    </Button>
                </div>
            )}

            {pageTab === "attempts" && attemptsSubTab === "approved" && selectedApprovedRowCount > 0 && (
                <div
                    className="fixed bottom-[--sidebar-gap] right-[--sidebar-gap] z-1000 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-white/10 bg-[rgba(17,24,39,0.85)] px-4 py-3 shadow-[0_24px_60px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl"
                    style={{ left: `calc(var(--sidebar-width) + var(--sidebar-gap) * 2)` }}
                >
                    <span className="mr-auto text-[13px] text-ink-muted">
                        {selectedApprovedRowCount} selected
                    </span>
                    <Button
                        onClick={handleCancelApprovedSelection}
                        className="table-action-btn table-action-btn-ghost"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRemoveSelected}
                        className="table-action-btn"
                        style={{ background: "#f46a6a", borderColor: "#f46a6a", color: "#fff" }}
                    >
                        Remove RTO
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RtoApproval;
