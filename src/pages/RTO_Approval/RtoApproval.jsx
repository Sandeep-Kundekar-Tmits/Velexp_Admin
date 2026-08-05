import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui";
import Select from "react-select";
import { ListChecks } from "lucide-react";
import MainHeaderComp from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import DateRangeInput from "../../components/Common/DateRangeInput";
import { customStyles } from "../../helpers/CustomStyle";
import RtoApprovalModal from "../../components/RTO_Approval/RtoApprovalModal";
import RtoBulkApprovalModal from "../../components/RTO_Approval/RtoBulkApprovalModal";
import ViewRtoApproval from "../../components/RTO_Approval/ViewRtoApproval";
import BulkRtsMarkModal from "../../components/RTO_Approval/BulkRtsMarkModal";
import { UPDATE_CUSTOMER_SERVICE_REMARK, BULK_RTS_STATUS_UPDATE, GET_USER_API, GET_UNDELIVERED_SHIPMENTS, GET_DELIVERY_ATTEMPTS_REMARKS, RECORD_SAR_STATUS } from "../../api/index";
import usePostApiCall from "../../hooks/usePostApiCall";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import YMD_DateFormate from "../../helpers/YMD_DateFormate";
import { toast } from "react-toastify";
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions";

import { authFetch } from "@/lib/http";
const RtoApproval = () => {
    const { isAdmin } = checkCustomerPermissions();

    // State for managing date range filtering
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });

    // SAR remove state
    const [deleteRow, setDeleteRow] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [sarLoading, setSarLoading] = useState(false);
    // State to track which modal is currently active (single_approval, bulk_approval, view_approval)
    const [selectedModel, setSelectdModel] = useState("")
    // Bulk RTS Mark modal (Excel upload / manual entry)
    const [bulkRtsOpen, setBulkRtsOpen] = useState(false)
    // State to store the currently selected row for single actions
    const [selectedRow, setSelectedRow] = useState(null);
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

    // Hooks for submitting approval and status updates
    const { apifunc: UpdateRemark } = usePostApiCall(null, "Remark Updated Successfully");
    const { apifunc: BulkRtsUpdate } = usePostApiCall(() => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            toast.error("Please select both a customer and a date range.");
            return;
        }

        const datePayload = YMD_DateFormate(selectedRange);
        const payload = {
            // customer_id: selectedCustomer.value,
            customer_name: selectedCustomer.customer_name,
            from_date: datePayload.from_date,
            to_date: datePayload.to_date
        };
        GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, payload);
    }, "RTS Status Updated Successfully");

    // List of shipments derived from the API response
    // Only return data if both customer and date range are selected
    const filteredShipments = useMemo(() => {
        if (!selectedCustomer || !selectedRange.startDate || !selectedRange.endDate) {
            return [];
        }
        return shipmentsData?.data || [];
    }, [shipmentsData, selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

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
            // customer_id: selectedCustomer.value,
            customer_name: selectedCustomer.customer_name,
            from_date: datePayload.from_date,
            to_date: datePayload.to_date
        };
        GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, payload);
    };

    // Clear row selections whenever filters change
    useEffect(() => {
        setRowSelection({});
    }, [selectedCustomer, selectedRange.startDate, selectedRange.endDate]);

    // Triggered when clicking Approve on a single row
    const handleApprove = (row) => {
        console.log("Approving row:", row);
        setSelectedRow(row);
        setSelectdModel("single_approval")
    };

    /**
     * Handles the final submission for both single and bulk approvals.
     * Orchestrates remark updates followed by optional RTS status updates.
     */
    const handleApproveSubmit = async (data) => {
        const { remark, isRts, shipments } = data;
        const currentAwb = selectedRow?.awbno || "";
        // Normalize AWB list for bulk or single scenario
        const awbList = shipments ? shipments.map(s => s.awbno || "") : [currentAwb];

        try {
            // 1. Update Remark for all selected AWBs
            const remarkPayload = {
                awbno: awbList,
                remark: remark
            };
            await UpdateRemark(UPDATE_CUSTOMER_SERVICE_REMARK, remarkPayload);

            // 2. If 'Mark RTS' is selected, update the status for all AWBs
            if (isRts) {
                const authUser = JSON.parse(localStorage.getItem("authUser"));
                const rtsPayload = {
                    awbno_list: shipments
                        ? shipments.map(s => ({
                            awbno: s.awbno || "",
                            employee_id: authUser?.user?.id,
                            service_center: s.service_center
                        }))
                        : [{
                            awbno: currentAwb,
                            employee_id: authUser?.user?.id,
                            service_center: selectedRow?.service_center
                        }]
                };
                await BulkRtsUpdate(BULK_RTS_STATUS_UPDATE, rtsPayload);
            }
            // Close modal and clear selection on success
            setSelectdModel("");
            setRowSelection({});
        } catch (error) {
            console.error("Approval flow failed:", error);
        }
    };

    // SAR remove confirm
    const handleRemoveConfirm = async () => {
        if (!deleteRow?.awbno) return;
        setSarLoading(true);
        try {
            const res = await authFetch(RECORD_SAR_STATUS, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    awbno: deleteRow.awbno,
                    remark: "SAR",
                    user_id: JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
            toast.success(json?.message || "Removed successfully", { position: "bottom-right", autoClose: 4000 });
            setShowDeleteConfirm(false);
            setDeleteRow(null);
            if (selectedCustomer && selectedRange.startDate && selectedRange.endDate) {
                const datePayload = YMD_DateFormate(selectedRange);
                GetUndeliveredShipments(GET_UNDELIVERED_SHIPMENTS, {
                    customer_name: selectedCustomer.customer_name,
                    from_date: datePayload.from_date,
                    to_date: datePayload.to_date,
                });
            }
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setSarLoading(false);
        }
    };

    // Triggered when clicking View on a row
    const handleView = (row) => {
        console.log("Viewing row:", row);
        setSelectedRow(row);
        setSelectdModel("view_approval");
    };

    // Triggered by the Bulk Approval floating footer button
    const handleBulkApprove = () => {
        const selectedIds = Object.keys(rowSelection);
        console.log("Bulk approving IDs:", selectedIds);
        setSelectdModel("bulk_approval")
    };

    // Clear all row selections
    const handleCancelSelection = () => {
        setRowSelection({});
    };

    const selectedShipments = useMemo(() => {
        return filteredShipments.filter((item, index) => rowSelection[index]);
    }, [rowSelection, filteredShipments]);


    // Configuration for modal types
    const Components = [
        {
            title: "single_approval",
            component: <RtoApprovalModal
                isOpen={true}
                toggle={() => setSelectdModel("")}
                awbNumber={selectedRow?.awbno || ""}
                onApprove={handleApproveSubmit}
            />
        },
        {
            title: "bulk_approval",
            component: <RtoBulkApprovalModal
                isOpen={true}
                toggle={() => setSelectdModel("")}
                selectedShipments={selectedShipments.map(s => ({
                    ...s,
                    awbno: s.awbno || ""
                }))}
                onApprove={handleApproveSubmit}
            />
        },
        {
            title: "view_approval",
            component: <ViewRtoApproval
                isOpen={true}
                toggle={() => setSelectdModel("")}
                awbNumber={selectedRow?.awbno || ""}
                serviceCenter={selectedRow?.service_center}
            />
        }
    ]


    // Helper to render the currently selected modal
    const ReturnComponent = (title) => {
        let comp = Components.find(ele => ele.title === title)
        if (comp) {
            return comp.component
        }
        return <></>
    }

    // Table columns
    const columns = useMemo(() => [
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
        {
            header: "Action",
            id: "action",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        size="sm"
                        className="px-4 py-1"
                        style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                        onClick={() => handleApprove(row.original)}
                    >
                        Approve
                    </Button>
                    <Button
                        color="secondary"
                        size="sm"
                        className="px-4 py-1"
                        outline
                        style={{ borderRadius: "8px" }}
                        onClick={() => handleView(row.original)}
                    >
                        View
                    </Button>

                    <Button
                        color="danger"
                        size="sm"
                        className="px-4 py-1"
                        style={{ borderRadius: "8px" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteRow(row.original);
                            setShowDeleteConfirm(true);
                        }}
                        title="Remove (SAR)"
                    >
                        Remove
                    </Button>

                </div>
            ),
        },
    ], [selectedCustomer, filteredShipments]);



    const selectedRowCount = Object.keys(rowSelection).length;

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline now, it
                hands the title and the bulk action to the layout's PageHeader,
                which is already fixed above the scroll box. */}
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
                {/* One row with the action on the fields' baseline. The Check
                    button was carrying marginBottom:17px to fake its way past
                    the labels above the other two. */}
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
                </div>

                {/* fillHeight instead of a 75vh box with its own scrollbar --
                    that put the page's bar and the grid's bar side by side,
                    each moving a different part of the same table. */}
                <div className="page-fit-body mt-4">
                    <TableContainer
                        columns={columns}
                        data={filteredShipments}
                        isGlobalFilter={true}
                        loading={shipmentsLoading}
                        isPagination={true}
                        isCustomPageSize={true}
                        SearchPlaceholder="Search across all columns..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        /* table-bordered dropped: .grid-shell draws the row
                           rules now, and the two only fought each other. */
                        tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                        theadClass="sticky top-0 z-10"
                        isStickyHeader={true}
                        stickyTop={0}
                        fillHeight
                        tableHeight="65vh"
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                    />
                </div>
            </div>

            {
                ReturnComponent(selectedModel)
            }

            <BulkRtsMarkModal isOpen={bulkRtsOpen} toggle={() => setBulkRtsOpen(false)} />

            {/* SAR remove confirmation modal */}
            <Modal isOpen={showDeleteConfirm} toggle={() => setShowDeleteConfirm(false)} centered>
                <ModalHeader toggle={() => setShowDeleteConfirm(false)}>Remove Shipment</ModalHeader>
                <ModalBody>
                    Are you sure you want to remove AWB <strong>{deleteRow?.awbno}</strong>?
                    This will mark it as SAR and cannot be undone.
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={sarLoading}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleRemoveConfirm} disabled={sarLoading}>
                        {/* .spinner-border has no definition left in the compat
                            layer, so this rendered nothing at all while the
                            request was in flight. */}
                        {sarLoading
                            ? <><Spinner size="sm" /> Removing…</>
                            : "Remove"}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Bulk Action Footer */}
            {selectedRowCount > 0 && (
                /* A floating glass bar inset from the edges, matching the rail
                   and the panels. It was `fixed bottom-0 start-0 w-full
                   bg-white` -- a full-bleed white strip welded across the foot
                   of a dark screen, and it ran under the sidebar because it
                   started at the window edge rather than the content's. */
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
                        onClick={handleBulkApprove}
                        className="table-action-btn table-action-btn-primary"
                    >
                        Bulk Approval
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RtoApproval;