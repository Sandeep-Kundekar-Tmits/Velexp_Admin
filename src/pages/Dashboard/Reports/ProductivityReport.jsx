import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { GridLoader } from "react-spinners";
import { Button, Col, Container, FormGroup, Label, Row } from "reactstrap";
import Select from "react-select";
import MainHeaderComp from "../../../components/MainHeaderCom";
import TabsProvider from "../../../components/TabsProvider";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import SelectedItemsDisplay from "../../../components/Common/SelectedItemsDisplay";
import TableContainer from "../../../components/Table/TableContainer";
import { customStyles } from "../../../helpers/CustomStyle";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useMultiExcelExport } from "../../../hooks/useMultiExcelExport";
import { FaFileExcel } from "react-icons/fa";
import { GET_ALL_REGION, SERVICE_CENTER, PRODUCTIVITY_REPORT } from "../../../api";

const ProductivityReport = () => {
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        region: [],
        service_center: [],
    });

    const [regions, setRegions] = useState([]);
    const [serviceCenters, setServiceCenters] = useState([]);
    const [reportData, setReportData] = useState({
        region_report: [],
        service_center_report: [],
        raw_data: [],
    });

    const { apifunc: getRegions, loading: regionLoading } = useGetApiCall();
    const { apifunc: getServiceCenters, loading: scLoading } = useGetApiCall();
    const { apifunc: getReport, loading: reportLoading } = usePostApiCall();
    const { exportMultiToExcel, isExporting: excelLoading } = useMultiExcelExport();

    useEffect(() => {
        const fetchOptions = async () => {
            const regionRes = await getRegions(GET_ALL_REGION);
            if (regionRes) {
                setRegions(regionRes.map(r => ({ value: r.region, label: r.region })));
            }

            const scRes = await getServiceCenters(SERVICE_CENTER);
            if (scRes) {
                setServiceCenters(scRes.map(sc => ({ value: sc.ec_code, label: `${sc.ec_code}` })));
            }
        };
        fetchOptions();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || []
        }));
    };

    const handleRemoveItem = (key, itemToRemove) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].filter(item => item.value !== itemToRemove.value)
        }));
    };

    const handleDateChange = (range) => {
        setFilters(prev => ({
            ...prev,
            start_date: range.startDate,
            end_date: range.endDate
        }));
    };

    const handleApply = async () => {
        if (!filters.start_date || !filters.end_date) {
            alert("Please select a date range.");
            return;
        }

        const payload = {
            start_date: filters.start_date ? format(new Date(filters.start_date), 'yyyy-MM-dd') : "",
            end_date: filters.end_date ? format(new Date(filters.end_date), 'yyyy-MM-dd') : "",
            region: filters.region.map(r => r.value),
            service_center: filters.service_center.map(sc => sc.value),
        };

        const res = await getReport(PRODUCTIVITY_REPORT, payload);
        if (res) {
            setReportData({
                region_report: res.region_report || [],
                service_center_report: res.service_center_report || [],
                raw_data: res.raw_data || [],
            });
        }
    };

    const handleDownloadExcel = () => {
        if (!reportData.raw_data || reportData.raw_data.length === 0) {
            alert("No data available to export.");
            return;
        }

        const headingPart = [
            `Start Date: ${format(new Date(filters.start_date), 'yyyy-MM-dd')}`,
            `End Date: ${format(new Date(filters.end_date), 'yyyy-MM-dd')}`,
            `Region: ${filters.region.map(r => r.value).join(", ") || "All"}`,
            `Service Center: ${filters.service_center.map(sc => sc.value).join(", ") || "All"}`
        ].join(", ");

        const sheets = [
            {
                sheetName: "Region Report",
                data: reportData.region_report.map(item => ({
                    "Region": item.region,
                    "Total SCs": item.total_scs,
                    "Unique Pincodes": item.unique_pincodes_served,
                    "Delivered (D)": item.delivered_d,
                    "Delivered (DV)": item.delivered_dv,
                    "Delivered (V)": item.delivered_v,
                    "Total Delivered": item.total_delivered,
                })),
                mainHeading: `Productivity Region Report, ${headingPart}`
            },
            {
                sheetName: "Service Center Report",
                data: reportData.service_center_report.map(item => ({
                    "Service Center": item.service_center,
                    "Region": item.region,
                    "Master Pincodes": item.master_pincodes,
                    "Served Pincodes": item.served_pincodes,
                    "Delivered (D)": item.delivered_d,
                    "Delivered (DV)": item.delivered_dv,
                    "Delivered (V)": item.delivered_v,
                    "Total Delivered": item.total_delivered,
                    "Active Staff": item.active_staff,
                    "Capacity": item.capacity,
                    "Gap": item.gap,
                })),
                mainHeading: `Productivity Service Center Report, ${headingPart}`
            },
            {
                sheetName: "Raw Data",
                data: reportData.raw_data.map(item => ({
                    "AWB No": item.awbno,
                    "AWB Date": item.awb_date ? format(new Date(item.awb_date), 'dd-MM-yyyy') : "-",
                    "Customer": item.customer_name,
                    "Pincode": item.drop_pincode,
                    "City": item.drop_city,
                    "Status Date": item.statdate ? format(new Date(item.statdate), 'dd-MM-yyyy') : "-",
                    "Status": item.status,
                    "Service Center": item.service_center,
                    "Emp ID": item.empid,
                    "Employee Name": item.empname,
                })),
                mainHeading: `Productivity Raw Data Report, ${headingPart}`
            }
        ];

        exportMultiToExcel(sheets, "Productivity_Report");
    };

    const regionColumns = useMemo(() => [
        { header: "Region", accessorKey: "region" },
        { header: "Total SCs", accessorKey: "total_scs" },
        { header: "Unique Pincodes", accessorKey: "unique_pincodes_served" },
        { header: "Delivered (D)", accessorKey: "delivered_d" },
        { header: "Delivered (DV)", accessorKey: "delivered_dv" },
        { header: "Delivered (V)", accessorKey: "delivered_v" },
        { header: "Total Delivered", accessorKey: "total_delivered" },
    ], []);

    const scColumns = useMemo(() => [
        { header: "Service Center", accessorKey: "service_center" },
        { header: "Region", accessorKey: "region" },
        { header: "Master Pincodes", accessorKey: "master_pincodes" },
        { header: "Served Pincodes", accessorKey: "served_pincodes" },
        { header: "Delivered (D)", accessorKey: "delivered_d" },
        { header: "Delivered (DV)", accessorKey: "delivered_dv" },
        { header: "Delivered (V)", accessorKey: "delivered_v" },
        { header: "Total Delivered", accessorKey: "total_delivered" },
        { header: "Active Staff", accessorKey: "active_staff" },
        { header: "Capacity", accessorKey: "capacity" },
        { header: "Gap", accessorKey: "gap" },
    ], []);

    const rawDataColumns = useMemo(() => [
        { header: "AWB No", accessorKey: "awbno" },
        {
            header: "AWB Date",
            accessorKey: "awb_date",
            cell: (info) => info.getValue() ? format(new Date(info.getValue()), 'dd-MM-yyyy') : "-"
        },
        { header: "Customer", accessorKey: "customer_name" },
        { header: "Pincode", accessorKey: "drop_pincode" },
        { header: "City", accessorKey: "drop_city" },
        {
            header: "Status Date",
            accessorKey: "statdate",
            cell: (info) => info.getValue() ? format(new Date(info.getValue()), 'dd-MM-yyyy') : "-"
        },
        { header: "Status", accessorKey: "status" },
        { header: "Service Center", accessorKey: "service_center" },
        { header: "Emp ID", accessorKey: "empid" },
        { header: "Employee Name", accessorKey: "empname" },
    ], []);

    const tabs = [
        {
            id: "region_report",
            label: "Region Report",
            component: reportLoading ? (
                <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                    <GridLoader size={20} />
                    <p className="mt-5 h5">Loading Region Report ...</p>
                </div>
            ) : (
                <TableContainer
                    columns={regionColumns}
                    data={reportData.region_report}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search Region Report..."
                    pagination="pagination  justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                />
            )
        },
        {
            id: "service_center_report",
            label: "Service Center Report",
            component: reportLoading ? (
                <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                    <GridLoader size={20} />
                    <p className="mt-5 h5">Loading SC Report ...</p>
                </div>
            ) : (
                <TableContainer
                    columns={scColumns}
                    data={reportData.service_center_report}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search SC Report..."
                    pagination="pagination justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                />
            )
        },
        {
            id: "raw_data",
            label: "Raw Data",
            component: reportLoading ? (
                <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                    <GridLoader size={20} />
                    <p className="mt-5 h5">Loading Raw Data ...</p>
                </div>
            ) : (
                <TableContainer
                    columns={rawDataColumns}
                    data={reportData.raw_data}
                    isGlobalFilter={true}
                    isCustomPageSize={true}
                    isPagination={true}
                    SearchPlaceholder="Search Raw Data..."
                    pagination="pagination justify-content-end mb-2"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                />
            )
        }
    ];

    return (
        <div className="page-content py-0 px-0">
            <div className="pb-0 mb-0">
                <div style={{ position: "sticky", top: 0, zIndex: 10, paddingBottom: "0px", paddingTop: "0px", backgroundColor: "white" }}>
                    <MainHeaderComp title="Productivity Report" />
                </div>

                <div className="container-fluid mt-0 pb-0 mb-0">
                    <div className="p-2">
                        <Row className="mb-1">
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Region</Label>
                                    <div className="d-flex align-items-center">
                                        <div style={{ minWidth: "250px", flex: "0 0 250px" }}>
                                            <Select
                                                isMulti
                                                options={regions}
                                                value={filters.region}
                                                onChange={(val) => handleFilterChange("region", val)}
                                                placeholder={regionLoading ? "Loading..." : "Select Region"}
                                                styles={customStyles}
                                                components={{ MultiValue: () => null }}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <SelectedItemsDisplay
                                                selectedItems={filters.region}
                                                onRemove={(item) => handleRemoveItem("region", item)}
                                                targetId="region-display"
                                                placeholder="No Region Selected"
                                            />
                                        </div>
                                    </div>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Service Center</Label>
                                    <div className="d-flex align-items-center">
                                        <div style={{ minWidth: "250px", flex: "0 0 250px" }}>
                                            <Select
                                                isMulti
                                                options={serviceCenters}
                                                value={filters.service_center}
                                                onChange={(val) => handleFilterChange("service_center", val)}
                                                placeholder={scLoading ? "Loading..." : "Select Service Center"}
                                                styles={customStyles}
                                                components={{ MultiValue: () => null }}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <SelectedItemsDisplay
                                                selectedItems={filters.service_center}
                                                onRemove={(item) => handleRemoveItem("service_center", item)}
                                                targetId="sc-display"
                                                placeholder="No Service Center Selected"
                                            />
                                        </div>
                                    </div>
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Select Date Range</Label>
                                    <DateRangeInput
                                        value={{ startDate: filters.start_date, endDate: filters.end_date }}
                                        onChange={handleDateChange}
                                        isBorder={true}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} className="d-flex align-items-end mb-3 gap-2" style={{ marginLeft: "-14px" }}>
                                <Button
                                    color="primary"
                                    onClick={handleApply}
                                    disabled={reportLoading}
                                    style={{ height: "35px" }}
                                    className={(reportData.region_report.length > 0 || reportData.service_center_report.length > 0 || reportData.raw_data.length > 0) ? "w-50" : "w-100"}
                                >
                                    {reportLoading ? "Applying..." : "Apply"}
                                </Button>
                                {(reportData.region_report.length > 0 || reportData.service_center_report.length > 0 || reportData.raw_data.length > 0) && (
                                    <Button
                                        disabled={excelLoading}
                                        onClick={handleDownloadExcel}
                                        className="d-flex align-items-center px-2 bg-success border-success text-white w-50"
                                        style={{
                                            height: "35px",
                                            borderRadius: "4px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {
                                            excelLoading ? <span className="me-2">Exporting...</span> : <span className="me-2">Download </span>
                                        }
                                        <FaFileExcel size={18} className="me-2" />
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>

                <div className="">
                    <TabsProvider tabs={tabs} />
                </div>
            </div>
        </div>
    );
};

export default ProductivityReport;