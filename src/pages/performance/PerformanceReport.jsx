import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { Row, Col, Button, Input, Label, FormGroup, Offcanvas, OffcanvasHeader, OffcanvasBody, Table as ReactstrapTable } from 'reactstrap';
import Select from 'react-select';
import { X, CircleX } from 'lucide-react';
import TableContainer from '../../components/Table/TableContainer';
import { customStyles } from '../../helpers/CustomStyle';
import DateRangeInput from '../../components/Common/DateRangeInput';
import MainHeaderComp from '../../components/MainHeaderCom';
import SelectedItemsDisplay from '../../components/Common/SelectedItemsDisplay';

const PerformanceReport = () => {
    useEffect(() => {
        document.title = "Performance Report";
    }, []);

    const [selectedServiceCentre, setSelectedServiceCentre] = useState(null);
    const [selectedDivision, setSelectedDivision] = useState(null);
    const [employeeCode, setEmployeeCode] = useState("");
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });

    const [activeComponent, setActiveComponent] = useState("");
    const [selectedRowData, setSelectedRowData] = useState(null);

    const handleRowClick = (rowData) => {
        setSelectedRowData(rowData);
        setActiveComponent("performance_detail");
    };

    const ReturnComponent = (title) => {
        let compObj = Components.find(ele => ele.title === title)
        if (compObj) {
            return compObj.component
        }
        return <></>
    }

    const Components = [
        {
            title: "performance_detail",
            component: (
                <Offcanvas
                    isOpen={activeComponent === "performance_detail"}
                    toggle={() => setActiveComponent("")}
                    direction="end"
                    style={{ width: '500px' }}
                >
                    <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                        <h4 className="m-0 fw-bold" style={{ color: "#334155", fontSize: '18px' }}>Report title</h4>
                        <X
                            size={20}
                            className='text-muted cursor-pointer'
                            onClick={() => setActiveComponent("")}
                        />
                    </div>
                    <OffcanvasBody>
                        <Row className="mb-4">
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">{selectedRowData?.region || "region_name"}</h5>
                                <small className="text-muted">Region</small>
                            </Col>
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">{selectedRowData?.service_centre || "service_centre_name"}</h5>
                                <small className="text-muted">Service Centre</small>
                            </Col>
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">division_name</h5>
                                <small className="text-muted">Division</small>
                            </Col>
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">employee_code</h5>
                                <small className="text-muted">Employee Code</small>
                            </Col>
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">{selectedRowData?.total_capacity || "200"}</h5>
                                <small className="text-muted">Total Capacity</small>
                            </Col>
                            <Col md={6} className="mb-3">
                                <h5 className="mb-0">{selectedRowData?.total_delivery || "180"}</h5>
                                <small className="text-muted">Total Delivery</small>
                            </Col>
                        </Row>

                        <hr />

                        <ReactstrapTable bordered hover responsive className="text-center mt-3">
                            <thead className="bg-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Employees</th>
                                    <th>Total Delivery</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>01/Jan/2026</td>
                                    <td>2</td>
                                    <td>20</td>
                                </tr>
                                <tr>
                                    <td>02/Jan/2026</td>
                                    <td>5</td>
                                    <td>60</td>
                                </tr>
                                {/* Empty rows if needed matching the mockup */}
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i}><td style={{ height: '38px' }}></td><td></td><td></td></tr>
                                ))}
                            </tbody>
                        </ReactstrapTable>
                    </OffcanvasBody>
                </Offcanvas>
            )
        }
    ]

    const serviceCentreOptions = [
        { value: 'PNQ', label: 'PNQ' },
        { value: 'MUM', label: 'MUM' },
        { value: 'DEL', label: 'DEL' },
        { value: 'HYD', label: 'HYD' },
        { value: 'BLR', label: 'BLR' },
        { value: 'CHE', label: 'CHE' },
        { value: 'KOL', label: 'KOL' },
        { value: 'AMD', label: 'AMD' },
        { value: 'CCU', label: 'CCU' },
        { value: 'LKO', label: 'LKO' },
        { value: 'JAI', label: 'JAI' },
        { value: 'LUD', label: 'LUD' },
        { value: 'VNS', label: 'VNS' },
        { value: 'RPR', label: 'RPR' },
        { value: 'AGR', label: 'AGR' },
        { value: 'BHO', label: 'BHO' },
        { value: 'JBP', label: 'JBP' },
        { value: 'GWL', label: 'GWL' },
        { value: 'IND', label: 'IND' },
        { value: 'JAL', label: 'JAL' },
        { value: 'KHO', label: 'KHO' },
        { value: 'KOL', label: 'KOL' },
        { value: 'LKO', label: 'LKO' },
        { value: 'LUD', label: 'LUD' },
        { value: 'VNS', label: 'VNS' },
        { value: 'RPR', label: 'RPR' },
        { value: 'AGR', label: 'AGR' },
        { value: 'BHO', label: 'BHO' },
        { value: 'JBP', label: 'JBP' },
        { value: 'GWL', label: 'GWL' },
        { value: 'IND', label: 'IND' },
        { value: 'JAL', label: 'JAL' },
        { value: 'KHO', label: 'KHO' },
    ];

    const divisionOptions = [
        { value: 'Division 1', label: 'Division 1' },
        { value: 'Division 2', label: 'Division 2' },
        { value: 'Division 3', label: 'Division 3' },
        { value: 'Division 4', label: 'Division 4' },
        { value: 'Division 5', label: 'Division 5' },
        { value: 'Division 6', label: 'Division 6' },
        { value: 'Division 7', label: 'Division 7' },
        { value: 'Division 8', label: 'Division 8' },
        { value: 'Division 9', label: 'Division 9' },
        { value: 'Division 10', label: 'Division 10' },
    ];

    const regionOptions = [
        { value: 'West', label: 'West' },
        { value: 'North', label: 'North' },
        { value: 'East', label: 'East' },
        { value: 'South', label: 'South' },
    ];

    const columns = useMemo(
        () => [
            {
                header: 'Region',
                accessorKey: 'region',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Service Centre',
                accessorKey: 'service_centre',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Capacity',
                accessorKey: 'total_capacity',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Total Delivery',
                accessorKey: 'total_delivery',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Action',
                accessorKey: 'action',
                enableColumnFilter: false,
                enableSorting: false,
                cell: (cellProps) => {
                    return (
                        <Button
                            type="button"
                            color="primary"
                            className="btn-sm btn-rounded"
                        >
                            View Details
                        </Button>
                    );
                },
            },
        ],
        []
    );

    const data = [
        { region: 'West', service_centre: 'PNQ', total_capacity: '1000', total_delivery: '850' },
        { region: 'North', service_centre: 'DEL', total_capacity: '1200', total_delivery: '1100' },
        // Add more mock data as needed
    ];

    return (
        <div className="page-content py-0 px-0" style={{ overflowX: 'hidden' }}>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Performance Report"
                // subTitle="Performance Report"
                />
            </div>

            <div className="container-fluid px-2">
                <Row className="gx-3 d-flex align-items-center pt-2">
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label for="Region" className="fw-bold text-muted mb-1">Select Region</Label>
                            <Select
                                value={selectedRegion}
                                onChange={setSelectedRegion}
                                options={regionOptions}
                                placeholder="Search Region"
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label for="ServiceCenter" className="fw-bold text-muted mb-1">Select Service Center</Label>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <Select
                                        value={selectedServiceCentre}
                                        onChange={setSelectedServiceCentre}
                                        options={serviceCentreOptions}
                                        placeholder="Search Service Center"
                                        styles={customStyles}
                                        isMulti
                                        controlShouldRenderValue={false}
                                    />
                                </div>
                                <SelectedItemsDisplay
                                    selectedItems={selectedServiceCentre || []}
                                    onRemove={(item) => setSelectedServiceCentre(selectedServiceCentre.filter(i => i.value !== item.value))}
                                    targetId="popoverSC"
                                    maxDisplay={3}
                                />
                            </div>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label for="Division" className="fw-bold text-muted mb-1">Select Division</Label>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <Select
                                        value={selectedDivision}
                                        onChange={setSelectedDivision}
                                        options={divisionOptions}
                                        placeholder="Search Division"
                                        styles={customStyles}
                                        isMulti
                                        controlShouldRenderValue={false}
                                    />
                                </div>
                                <SelectedItemsDisplay
                                    selectedItems={selectedDivision || []}
                                    onRemove={(item) => setSelectedDivision(selectedDivision.filter(i => i.value !== item.value))}
                                    targetId="popoverDiv"
                                    maxDisplay={3}
                                />
                            </div>
                        </FormGroup>
                    </Col>
                </Row>

                <Row className="gx-3 d-flex align-items-end mt-2">
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label className="fw-bold text-muted mb-1">Date Range</Label>
                            <DateRangeInput
                                value={selectedRange}
                                onChange={(range) => setSelectedRange(range)}
                                isBorder={true}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup className="mb-2">
                            <Label className="fw-bold text-muted mb-1">Employee Code</Label>
                            <Input
                                type="text"
                                placeholder="Enter Employee Code"
                                value={employeeCode}
                                onChange={(e) => setEmployeeCode(e.target.value)}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2} className='d-flex mb-2 align-content-center flex-wrap gap-2'>
                        <Button color="primary" className="fw-bold" style={{ height: "2.4rem", width: "100%" }}>
                            Get Data
                        </Button>
                    </Col>
                </Row>

                <TableContainer
                    columns={columns}
                    data={data}
                    isGlobalFilter={true}
                    isPagination={true}
                    handleUserClick={handleRowClick}
                    SearchPlaceholder="Search across all columns..."
                    pagination="pagination"
                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    isStickyHeader={true}
                    stickyTop={0}
                    tableHeight="60vh"
                />

                {ReturnComponent(activeComponent)}
            </div>
        </div>
    );
};

export default PerformanceReport;
