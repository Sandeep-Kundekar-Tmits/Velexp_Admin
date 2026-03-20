import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { GridLoader } from "react-spinners";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import TableContainer from "../../components/Table/TableContainer";
import usePostApiCall from "../../hooks/usePostApiCall";
import { EMPLOYEE_ODOMETER_FILTER } from "../../api";
import SimpleModal from "../../components/SimpleModal";

const EmployeeAttendence = () => {
    const [EmployeeDatas, setEmployeeDatas] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [SelectedImgSrc, setSelectedImgSrc] = useState(null)
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    const [EmplyeeCode, setEmployeeCode] = useState("")
    const { apifunc: GetFilteredEmployee, data: EmployeeData, loading: EmployeeFilterLoading } = usePostApiCall()
    const onInputChange = (name, e) => {
        if (name === "ec_code") {
            setEmployeeCode(e.target.value)
        }
    }
    const handleDateChange = ({ startDate, endDate }) => {
        setSelectedRange({ startDate, endDate });
    };

    const onGetData = () => {
        const formatToYMD = (date) => {
            if (!date) return null;
            return new Date(date).toISOString().slice(0, 10);
        };

        let payload = {
            employee_code: EmplyeeCode,
            from_date: formatToYMD(selectedRange?.startDate),
            to_date: formatToYMD(selectedRange?.endDate),
        };
        if (EmplyeeCode === "") {
            alert("Enter Employee Code")
            return
        }
        if (selectedRange?.startDate === "" || selectedRange?.endDate === "") {
            alert("Enter the Date Range")
            return
        }
        GetFilteredEmployee(EMPLOYEE_ODOMETER_FILTER, payload)
    }

    useEffect(() => {
        if (EmployeeData) {
            setEmployeeDatas(EmployeeData?.data)
        }

    }, [EmployeeData])
    const columns = useMemo(
        () => [
            {
                header: "Employee Name",
                accessorFn: (row) =>
                    `${row.employee?.first_name ?? ""} ${row.employee?.last_name ?? ""}`.trim(),
                enableSorting: true,
                enableColumnFilter: false,
                size: 180,
            },

            {
                header: "Trip Date",
                accessorKey: "trip_date",
                enableSorting: true,
                enableColumnFilter: false,
                size: 140,
                cell: ({ getValue }) =>
                    getValue()
                        ? new Date(getValue()).toUTCString()
                        : "-",
            },

            {
                header: "Type",
                accessorKey: "info_type",
                enableSorting: true,
                enableColumnFilter: false,
                size: 100,
            },

            {
                header: "Odometer Image",
                accessorKey: "odometer_image",
                enableSorting: false,
                enableColumnFilter: false,
                size: 120,
                cell: ({ getValue }) =>
                    getValue() ? (
                        <button
                            className="px-3 py-1 rounded-2 bg-light"
                            onClick={() => {
                                setSelectedImgSrc(getValue())
                                setIsModalOpen(true)
                            }}
                        >
                            View
                        </button>
                    ) : (
                        <span className="text-gray-400">No Image</span>
                    ),
            },
        ],
        []
    );

    return (
        <div className='page-content'>
            <div className="container-fluid">
                {/*  header */}
                <MainHeaderComp title=" Employee Trip Details" />

                {/* filters */}
                <Row className="mt-3">
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label for="Customer">Select Employee</Label>
                            {/* <Select
                                // options={UserListOptions}
                                placeholder="Search Customer"
                                // value={username || "All"}
                                // onChange={setUsername}
                                isClearable={true}
                                styles={customStyles} /> */}
                            <Input type="text" value={EmplyeeCode} placeholder="Enter Employee Code" onChange={(e) => onInputChange("ec_code", e)} style={{ height: "39px" }} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Start Date and End Date</Label>
                            <DateRangeInput
                                onChange={handleDateChange}
                                value={selectedRange}
                                className="h-100"
                                isBorder={true}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <Button onClick={onGetData} className="bg-primary" style={{ marginTop: "28px" }}>Get Data</Button>
                    </Col>
                </Row>

                {/* table */}
                <div>
                    <div className='mt-2'>
                        {
                            EmployeeFilterLoading ? <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Bookings ...</p>
                            </div>
                                :
                                <>{
                                    <TableContainer
                                        columns={columns}
                                        data={EmployeeDatas || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        isCustomPageSize={true}
                                        isDownloadExcle={true}
                                        // onDownloadExcle={DownloadBookingDetails}
                                        // ExcleLoading={isExporting}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    />
                                }
                                </>

                        }
                    </div>
                    <SimpleModal
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        cancelButtonName="Close"
                        successButtonName="Download"
                        onCancel={() => {
                            setIsModalOpen(false)
                        }}
                    // onSuccess={handleSuccess}
                    >
                        <img
                            src={SelectedImgSrc}
                            alt="odometer_img"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '60vh',
                                objectFit: 'contain'
                            }}
                            onError={(e) => {
                                e.target.src = '/path-to-fallback-image.png';
                                e.target.alt = 'Image not available';
                            }}
                        />
                    </SimpleModal>
                </div>
            </div>
        </div>
    )
}
export default EmployeeAttendence