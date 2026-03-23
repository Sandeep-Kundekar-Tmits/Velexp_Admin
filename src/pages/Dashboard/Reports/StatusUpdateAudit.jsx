import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Button, FormGroup, Label } from "reactstrap";
import Select from "react-select";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../../components/MainHeaderCom";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import { customStyles } from "../../../helpers/CustomStyle";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_ALL_REGION, SERVICE_CENTER, STATUS_UPDATE } from "../../../api";
import YMD_DateFormate from "../../../helpers/YMD_DateFormate";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";
import SelectedItemsDisplay from "../../../components/Common/SelectedItemsDisplay";

const StatusUpdateAudit = () => {
    const { ErrorToaster } = ToasterProvider();
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [selectedRegion, setSelectedRegion] = useState([]);
    const [selectedServiceCenter, setSelectedServiceCenter] = useState([]);
    const [auditData, setAuditData] = useState([]);
    const [fullResponse, setFullResponse] = useState(null);

    // defining the api to get region
    const { apifunc: fetchRegions, data: regionData } = useGetApiCall()
    // defining the api to get service center
    const { apifunc: fetchServiceCenters, data: serviceCenterData } = useGetApiCall()
    // defining the api for audit data
    const { apifunc: fetchAuditData, loading: auditLoading } = usePostApiCall();
    const { exportToExcel, isExporting } = useExcelExport();

    // calling the api to get region and service center
    useEffect(() => {
        fetchRegions(GET_ALL_REGION)
        fetchServiceCenters(SERVICE_CENTER)
    }, [])

    // clear or filter service centers when region changes
    useEffect(() => {
        if (selectedRegion && selectedRegion.length > 0) {
            const selectedRegionValues = selectedRegion.map(r => r.value.toLowerCase());
            setSelectedServiceCenter(prev => prev.filter(sc => {
                const scData = serviceCenterData?.find(item => (item.ec_code || item.name) === sc.value);
                return scData && scData.region && selectedRegionValues.includes(scData.region.toLowerCase());
            }));
        }
    }, [selectedRegion, serviceCenterData]);

    const regionOptions = useMemo(() => {
        if (regionData) {
            return regionData.map(item => ({
                value: item.region,
                label: item.region
            }));
        }
        return [];
    }, [regionData]);

    const serviceCenterOptions = useMemo(() => {
        if (serviceCenterData) {
            let filteredData = serviceCenterData;
            if (selectedRegion && selectedRegion.length > 0) {
                const selectedRegionValues = selectedRegion.map(r => r.value.toLowerCase());
                filteredData = serviceCenterData.filter(item =>
                    item.region && selectedRegionValues.includes(item.region.toLowerCase())
                );
            }
            return filteredData.map(item => ({
                value: item.ec_code || item.name,
                label: item.ec_code || item.name
            }));
        }
        return [];
    }, [serviceCenterData, selectedRegion]);

    const totals = useMemo(() => {
        return auditData.reduce((acc, curr) => {
            acc.mobile += curr.mobile_count || 0;
            acc.manual += curr.manual_count || 0;
            acc.total += curr.total_count || 0;
            return acc;
        }, { mobile: 0, manual: 0, total: 0 });
    }, [auditData]);

    const columns = useMemo(
        () => [
            {
                header: "Status",
                id: "status_group",
                columns: [
                    {
                        header: () => null,
                        accessorKey: "status",
                        id: "status",
                        cell: ({ row }) => <span className="">{row.original.status || 0}</span>,
                        footer: () => <span className="fw-bolder">Total</span>
                    }
                ]
            },
            {

                header: "Mob Count",
                columns: [
                    {
                        header: "Count",
                        accessorKey: "mobile_count",
                        cell: ({ row }) => <span className="">{row.original.mobile_count || 0}</span>,
                        footer: () => <span className="fw-bolder">{totals.mobile}</span>
                    },
                    {
                        header: "%",
                        id: "mobile_percent",
                        cell: ({ row }) => {
                            const val = row.original.mobile_count || 0;
                            const total = row.original.total_count || 1;
                            return <span className="text-muted">{((val / total) * 100).toFixed(2)}%</span>;
                        },
                        footer: () => {
                            const percentage = totals.total > 0 ? ((totals.mobile / totals.total) * 100).toFixed(2) : "0.00";
                            return <span className="fw-bolder">{percentage}%</span>;
                        }
                    }
                ]
            },
            {
                header: "Manual Count",
                columns: [
                    {
                        header: "Count",
                        accessorKey: "manual_count",
                        cell: ({ row }) => <span className="">{row.original.manual_count || 0}</span>,
                        footer: () => <span className="fw-bolder">{totals.manual}</span>
                    },
                    {
                        header: "%",
                        id: "manual_percent",
                        cell: ({ row }) => {
                            const val = row.original.manual_count || 0;
                            const total = row.original.total_count || 1;
                            return <span className="text-muted">{((val / total) * 100).toFixed(2)}%</span>;
                        },
                        footer: () => {
                            const percentage = totals.total > 0 ? ((totals.manual / totals.total) * 100).toFixed(2) : "0.00";
                            return <span className="fw-bolder">{percentage}%</span>;
                        }
                    }
                ]
            },
            {
                header: () => "Total",
                id: "total_group",
                columns: [
                    {
                        header: () => null,
                        accessorKey: "total_count",
                        cell: ({ row }) => <span className="">{row.original.total_count || 0}</span>,
                        footer: () => <span className="fw-bolder">{totals.total}</span>
                    },
                ]
            },
        ],
        [totals, auditData]
    );

    const handleGetData = async () => {
        const { from_date, to_date } = YMD_DateFormate(selectedRange);

        if (!from_date || !to_date) {
            ErrorToaster("Please select a valid date range");
            return;
        }

        const payload = {
            start_date: from_date,
            end_date: to_date,
            regions: selectedRegion && selectedRegion.length > 0 ? selectedRegion.map(r => r.value) : [],
            service_centers: selectedServiceCenter && selectedServiceCenter.length > 0 ? selectedServiceCenter.map(sc => sc.value) : []
        };

        const response = await fetchAuditData(STATUS_UPDATE, payload);
        if (response) {
            setAuditData(response.status_totals || []);
            setFullResponse(response);
        } else {
            setAuditData([]);
            setFullResponse(null);
        }
    };

    const handleDownloadExcel = () => {
        if (!fullResponse || !fullResponse.report) {
            ErrorToaster("No data available to export");
            return;
        }

        const { from_date, to_date } = YMD_DateFormate(selectedRange);

        const filterPayload = {
            "Start Date": from_date || "--",
            "End Date": to_date || "--",
            "Regions": selectedRegion.length > 0 ? selectedRegion.map(r => r.label).join(", ") : "All",
            "Service Centers": selectedServiceCenter.length > 0 ? selectedServiceCenter.map(sc => sc.label).join(", ") : "All",
        };

        const reportData = fullResponse.report;

        // Calculate grand totals for Excel
        const excelGrandTotals = reportData.reduce((acc, curr) => {
            acc.mobile += Number(curr.mobile_count) || 0;
            acc.manual += Number(curr.manual_count) || 0;
            acc.total += Number(curr.total_count) || 0;
            return acc;
        }, { mobile: 0, manual: 0, total: 0 });

        const mappedData = reportData.map((item) => {
            const rowTotal = item.total_count || 1;
            return {
                "Service Center": item.service_center || "NA",
                "Status": item.status || "NA",
                "Date": item.trans_date || "NA",
                "Mobile Count": item.mobile_count || 0,
                "Mobile %": (((item.mobile_count || 0) / rowTotal) * 100).toFixed(2) + "%",
                "Manual Count": item.manual_count || 0,
                "Manual %": (((item.manual_count || 0) / rowTotal) * 100).toFixed(2) + "%",
                "Total Count": item.total_count || 0
            };
        });

        // Add Grand Total row at the end
        const grandTotalDenom = excelGrandTotals.total || 1;
        mappedData.push({
            "Service Center": "Grand Total",
            "Status": "",
            "Date": "",
            "Mobile Count": excelGrandTotals.mobile,
            "Mobile %": ((excelGrandTotals.mobile / grandTotalDenom) * 100).toFixed(2) + "%",
            "Manual Count": excelGrandTotals.manual,
            "Manual %": ((excelGrandTotals.manual / grandTotalDenom) * 100).toFixed(2) + "%",
            "Total Count": excelGrandTotals.total
        });

        exportToExcel(
            mappedData,
            "Status_Update_Audit",
            null,
            filterPayload
        );
    };


    return (
        <div className="page-content py-0 px-0" style={{ overflowX: 'hidden' }} >
            <div className="bg-white sticky-top " style={{ top: '0px', zIndex: 1001 }}>
                <MainHeaderComp title="Status Update Audit" subTitle="" />
            </div>


            <div className="mt-4 px-2">
                <Row className="mb-2 align-items-end border-bottom">
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label className="fw-bold text-muted  mb-1">Region</Label>
                            <div className="d-flex align-items-center">
                                <div style={{ width: "250px" }}>
                                    <Select
                                        options={regionOptions}
                                        value={selectedRegion}
                                        onChange={setSelectedRegion}
                                        placeholder="Select Region"
                                        styles={customStyles}
                                        isClearable
                                        isMulti
                                        controlShouldRenderValue={false}
                                        hideSelectedOptions={true}
                                    />
                                </div>
                                <SelectedItemsDisplay
                                    selectedItems={selectedRegion}
                                    onRemove={(item) => setSelectedRegion(selectedRegion.filter(r => r.value !== item.value))}
                                    targetId="region-overflow"
                                    placeholder='No Region Selected'
                                />
                            </div>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup className="mb-0">
                            <Label className="fw-bold text-muted mb-1">Service Center</Label>
                            <div className="d-flex align-items-center">
                                <div style={{ width: "250px" }}>
                                    <Select
                                        options={serviceCenterOptions}
                                        value={selectedServiceCenter}
                                        onChange={setSelectedServiceCenter}
                                        placeholder="Search Service Center"
                                        styles={customStyles}
                                        isClearable
                                        isMulti
                                        controlShouldRenderValue={false}
                                        hideSelectedOptions={true}
                                    />
                                </div>
                                <SelectedItemsDisplay
                                    selectedItems={selectedServiceCenter}
                                    onRemove={(item) => setSelectedServiceCenter(selectedServiceCenter.filter(s => s.value !== item.value))}
                                    targetId="sc-overflow"
                                    placeholder='No Service Center Selected'
                                />
                            </div>
                        </FormGroup>
                    </Col>
                </Row>
                <Row className="mb-4 align-items-end">
                    <Col md={3}>
                        <FormGroup className="mb-0">
                            <Label className="fw-bold text-muted mb-1">Date Range</Label>
                            <DateRangeInput value={selectedRange} onChange={setSelectedRange} isBorder={true} />
                        </FormGroup>
                    </Col>
                    <Col md={3} className="mb-3">
                        <Button
                            color="primary"
                            className="w-100"
                            style={{ height: "38px", fontWeight: "600" }}
                            onClick={handleGetData}
                            disabled={auditLoading || !selectedRange?.startDate || !selectedRange?.endDate}
                        >
                            {auditLoading ? "Loading..." : "Get Data"}
                        </Button>
                    </Col>
                </Row>

                <div style={{ position: 'relative' }}>
                    {
                        auditLoading ? (
                            <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Audit Data...</p>
                            </div>
                        ) : (
                            <TableContainer
                                columns={columns}
                                data={auditData || []}
                                isGlobalFilter={true}
                                isDownloadExcle={true}
                                onDownloadExcle={handleDownloadExcel}
                                ExcleLoading={isExporting}
                                isPagination={true}
                                defaultPageSize={50}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive w-100 dataTable no-footer"
                                isCustomPageSize={true}
                                isStickyHeader={true}
                                isStickyFooter={true}
                                tableHeight="500px"
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default StatusUpdateAudit;