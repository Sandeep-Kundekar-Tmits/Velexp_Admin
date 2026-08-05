import React, { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import { Row, Col, Button, Input, Label, Modal, ModalHeader, ModalBody, Table as ReactstrapTable } from "@/components/ui";
import Select from 'react-select';
import TableContainer from '../../components/Table/TableContainer';
import { customStyles, CheckboxOption, SelectedCountValue } from '../../helpers/CustomStyle';
import DateRangeInput from '../../components/Common/DateRangeInput';
import MainHeaderComp from '../../components/MainHeaderCom';

/* Same contract as LastMileOperations.jsx: a checkbox per option instead of a
   chip strip beside the control, and a count in the control instead of one
   chip per value. See CustomStyle.jsx for why. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    menuPortalTarget: document.body,
    menuPosition: "fixed",
};

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

    const handleRowClick = useCallback((rowData) => {
        setSelectedRowData(rowData);
        setActiveComponent("performance_detail");
    }, []);

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
                // Was an Offcanvas sliding in from the right -- a drawer reads
                // as "more of the same page," but this is a single record's
                // detail, disconnected from whatever row is still showing
                // behind it. A centred modal is the right shape for that.
                <Modal
                    isOpen={activeComponent === "performance_detail"}
                    toggle={() => setActiveComponent("")}
                    centered
                    size="lg"
                    scrollable
                >
                    <ModalHeader toggle={() => setActiveComponent("")}>
                        {/* Was the literal string "Report title" -- a
                            placeholder left in from the mockup. The row that
                            opened this modal is right there in state. */}
                        {selectedRowData?.service_centre
                            ? `${selectedRowData.service_centre} -- Performance Detail`
                            : "Performance Detail"}
                    </ModalHeader>
                    <ModalBody>
                        {/* Label above, value below, muted-uppercase-on-bold --
                            the same stat convention as the tiles on the
                            customer list, not the inverted bold-value-then-
                            small-caption the mockup had. "division"/
                            "employee_code" render the same dash every other
                            empty field does, not a lorem-ipsum-looking literal
                            string, since the mock dataset carries neither. */}
                        <Row className="mb-2">
                            {[
                                { label: "Region", value: selectedRowData?.region },
                                { label: "Service Centre", value: selectedRowData?.service_centre },
                                { label: "Division", value: selectedRowData?.division },
                                { label: "Employee Code", value: selectedRowData?.employee_code },
                                { label: "Total Capacity", value: selectedRowData?.total_capacity },
                                { label: "Total Delivery", value: selectedRowData?.total_delivery },
                            ].map(({ label, value }) => (
                                <Col key={label} md={6} className="mb-4">
                                    <p className="m-0 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                        {label}
                                    </p>
                                    <p className="m-0 mt-1 text-[15px] font-semibold text-ink">
                                        {value || "--"}
                                    </p>
                                </Col>
                            ))}
                        </Row>

                        <div className="my-2 border-t border-white/8" />

                        <p className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
                            Delivery Schedule
                        </p>

                        {/* bordered/hover/responsive still set the base shape;
                            the [&_...]:! overrides replace Table's built-in
                            th background and hover tint, which are tuned for
                            the light theme this screen has moved off of. */}
                        <ReactstrapTable
                            bordered
                            hover
                            responsive
                            className="text-center [&_tbody_tr:hover]:!bg-white/5 [&_td]:!border-white/8 [&_th]:!border-white/8 [&_th]:!bg-canvas [&_th]:!text-[11px] [&_th]:!font-semibold [&_th]:!uppercase [&_th]:!tracking-wider [&_th]:!text-ink-muted [&_td]:!text-ink"
                        >
                            <thead>
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
                    </ModalBody>
                </Modal>
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
                /* Had no onClick at all -- it only opened the modal because a
                   click on it also bubbles up to the row's own handler
                   (handleUserClick below). A button that says "View Details"
                   should not depend on that; it should do the thing itself. */
                cell: ({ row }) => {
                    return (
                        <Button
                            type="button"
                            color="primary"
                            className="btn-sm btn-rounded"
                            onClick={() => handleRowClick(row.original)}
                        >
                            View Details
                        </Button>
                    );
                },
            },
        ],
        [handleRowClick]
    );

    const data = [
        { region: 'West', service_centre: 'PNQ', total_capacity: '1000', total_delivery: '850' },
        { region: 'North', service_centre: 'DEL', total_capacity: '1200', total_delivery: '1100' },
        // Add more mock data as needed
    ];

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Performance Report" subTitle="Capacity and delivery by region, service center and division." />

            <div className="page-fit-body relative z-10 pb-4">
                {/* Filters -- see LastMileOperations.jsx for the reasoning:
                    checkboxes in the dropdown replace the chip strip beside
                    the control, and every field wraps to the next line rather
                    than push the row past the card. */}
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Region
                        </Label>
                        <Select
                            value={selectedRegion}
                            onChange={setSelectedRegion}
                            options={regionOptions}
                            placeholder="Search Region"
                            styles={customStyles}
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Service Center
                        </Label>
                        <Select
                            value={selectedServiceCentre}
                            onChange={setSelectedServiceCentre}
                            options={serviceCentreOptions}
                            placeholder="Search Service Center"
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Select Division
                        </Label>
                        <Select
                            value={selectedDivision}
                            onChange={setSelectedDivision}
                            options={divisionOptions}
                            placeholder="Search Division"
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Date Range
                        </Label>
                        <DateRangeInput
                            value={selectedRange}
                            onChange={(range) => setSelectedRange(range)}
                            isBorder={true}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Employee Code
                        </Label>
                        <Input
                            type="text"
                            placeholder="Enter Employee Code"
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                        />
                    </div>

                    <Button color="primary" className="h-9.5 shrink-0 px-6">
                        Get Data
                    </Button>
                </div>

                <div className="page-fit-body mt-4">
                    <TableContainer
                        columns={columns}
                        data={data}
                        isGlobalFilter={true}
                        isPagination={true}
                        handleUserClick={handleRowClick}
                        SearchPlaceholder="Search across all columns..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                        theadClass="sticky top-0 z-10"
                        isStickyHeader={true}
                        stickyTop={0}
                        fillHeight
                        tableHeight="60vh"
                    />
                </div>

                {ReturnComponent(activeComponent)}
            </div>
        </div>
    );
};

export default PerformanceReport;
