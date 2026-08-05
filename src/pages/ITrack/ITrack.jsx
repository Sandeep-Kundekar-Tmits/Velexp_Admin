import React, { useState, useMemo, useCallback } from "react";
import { Button, Input, Label } from "@/components/ui";
import MainHeaderCom from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { ITRACK_SCANS } from "../../api";
import ToasterProvider from "../../helpers/ToasterProvider";
import Loader from "@/Loaders/Loader";
const ITrack = () => {
    const [awbNumber, setAwbNumber] = useState("");
    const { apifunc: getScans, data, loading, error } = useGetApiCall();
    const { ErrorToaster } = ToasterProvider();

    const handleScan = async () => {
        if (!awbNumber) {
            ErrorToaster("Please enter an AWB number");
            return;
        }
        await getScans(`${ITRACK_SCANS}?awb=${awbNumber}`);
    };

    const columns = useMemo(() => [
        {
            header: 'ID',
            accessorKey: 'id',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'AWB',
            accessorKey: 'awb',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Employee Code',
            accessorKey: 'employee_code',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Scanned By',
            accessorKey: 'scanned_by',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Service Center',
            accessorKey: 'service_center',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Screen Name',
            accessorKey: 'screen_name',
            enableColumnFilter: false,
            enableSorting: true,
        },
        {
            header: 'Scan Time',
            accessorKey: 'created_at',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const date = new Date(getValue());
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            }
        },
    ], []);

    const processedData = useMemo(() => {
        return Array.isArray(data) ? data : [];
    }, [data]);

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom
                title="ITrack - AWB Scan History"
                subTitle="Scan an AWB to see every checkpoint recorded against it."
            />

            <div className="container-fluid page-fit-body relative z-10 pb-4">
                {/* One filter row, no Card around it: a bordered box holding a
                    single field and a button was a panel inside a panel once
                    the grid below grew its own. A rule separates them.

                    A form, so Enter submits -- this screen is fed by a barcode
                    scanner, which types the AWB and sends Return. The old
                    onKeyPress handler did that by hand and is now the browser's
                    job. */}
                <form
                    className="filter-row"
                    onSubmit={(e) => { e.preventDefault(); handleScan(); }}
                >
                    <div className="filter-group">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label for="awbInput" className="form-label m-0 font-bold text-ink-muted">
                                Scan AWB
                            </Label>
                            <Input
                                id="awbInput"
                                type="text"
                                placeholder="Enter AWB Number"
                                value={awbNumber}
                                onChange={(e) => setAwbNumber(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="table-action-btn table-action-btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Scanning..." : "Submit"}
                        </Button>
                    </div>
                </form>

                <div className="page-fit-body mt-4">
                    {loading ? (
                        <Loader message="Fetching scan records..." fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={processedData}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search scan records..."
                            pagination="pagination"
                            buttonClass="btn-success"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            /* table-bordered dropped: .grid-shell draws the row
                               rules now, and the two only fought each other. */
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="60vh"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ITrack;
