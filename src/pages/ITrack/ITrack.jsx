import React, { useState, useMemo, useCallback } from "react";
import { Button, Col, Row, Input, FormGroup, Label, Card, CardBody } from "reactstrap";
import MainHeaderCom from "../../components/MainHeaderCom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { ITRACK_SCANS } from "../../api";
import ToasterProvider from "../../helpers/ToasterProvider";
import { GridLoader } from "react-spinners";

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

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleScan();
        }
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
        <div className="page-content py-0 px-0">
            <MainHeaderCom title="ITrack - AWB Scan History" />
            
            <div className="container-fluid px-3 mt-3">
                <Card>
                    <CardBody>
                        <Row className="align-items-center">
                            <Col md={6}>
                                <div className="d-flex align-items-center gap-2">
                                    <Label for="awbInput" className="mb-0 text-nowrap">Scan AWB:</Label>
                                    <Input
                                        id="awbInput"
                                        type="text"
                                        placeholder="Enter AWB Number"
                                        value={awbNumber}
                                        onChange={(e) => setAwbNumber(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoFocus
                                        style={{ maxWidth: "300px" }}
                                    />
                                    <Button
                                        color="primary"
                                        onClick={handleScan}
                                        disabled={loading}
                                    >
                                        {loading ? "..." : "Submit"}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <div className="mt-4">
                    {loading ? (
                        <div className="d-flex flex-column justify-content-center align-items-center py-5">
                            <GridLoader size={15} color="#34c38f" />
                            <p className="mt-3">Fetching scan records...</p>
                        </div>
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
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            isStickyHeader={true}
                            stickyTop={0}
                            tableHeight="60vh"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ITrack;
