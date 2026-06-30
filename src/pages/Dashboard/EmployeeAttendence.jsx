import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap"
import MainHeaderComp from "../../components/MainHeaderCom"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { GridLoader } from "react-spinners";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";
import TableContainer from "../../components/Table/TableContainer";
import usePostApiCall from "../../hooks/usePostApiCall";
import { TRIP_ODOMETER_FILTER } from "../../api";
import SimpleModal from "../../components/SimpleModal";
import { useExcelExport } from "../../hooks/useExcelExport";

const EmployeeAttendence = () => {
    const [EmployeeDatas, setEmployeeDatas] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [SelectedImgSrc, setSelectedImgSrc] = useState(null)
    
    const getImageSrc = (src) => {
        if (!src) return "";
        let imgUrl = src;
        
        // Upgrade http to https under secure contexts to avoid Mixed Content blockers
        if (window.location.protocol === "https:" && imgUrl.startsWith("http://")) {
            imgUrl = imgUrl.replace("http://", "https://");
        }

        // ONLY during local development (localhost), rewrite to use the Vite proxy /media/ path
        // to bypass CORS blocks on the local developer machine.
        // In production (admin.velexp.com), preserve the absolute backend domain (https://velexp.com/media/...)
        // since the media files are hosted on velexp.com while the UI is on admin.velexp.com.
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocalhost && imgUrl.includes("/media/")) {
            imgUrl = imgUrl.substring(imgUrl.indexOf("/media/"));
        }
        
        return imgUrl;
    };
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    const [EmplyeeCode, setEmployeeCode] = useState("")
    const { apifunc: GetFilteredEmployee, data: EmployeeData, loading: EmployeeFilterLoading } = usePostApiCall()
    const { exportToExcel, isExporting } = useExcelExport();

    const DownloadBookingDetails = () => {
        if (!EmployeeDatas || EmployeeDatas.length === 0) {
            alert("No data available to export");
            return;
        }

        const transformFn = (row) => ({
            "Employee Name": row.employee_name || `${row.employee?.first_name ?? ""} ${row.employee?.last_name ?? ""}`.trim(),
            "Employee Code": row.employee_code || "-",
            "Vehicle Number": row.vehicle_number || "-",
            "Trip Number": row.trip_number || "-",
            "Type": row.info_type || "-",
            "Trip Date": row.trip_date ? new Date(row.trip_date).toUTCString() : "-",
            "Odometer Reading": row.odometer_reading || "-",
            "Notes": row.notes || "-"
        });

        exportToExcel(EmployeeDatas, "EmployeeTripDetails", transformFn);
    };

    const handleDownloadImage = async () => {
        if (!SelectedImgSrc) return;
        try {
            const response = await fetch(SelectedImgSrc);
            if (!response.ok) throw new Error("Network response was not ok");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Try to extract original filename or fall back to standard naming
            let filename = `Odometer_Image_${new Date().getTime()}.jpg`;
            try {
                const urlObj = new URL(SelectedImgSrc, window.location.origin);
                const pathParts = urlObj.pathname.split("/");
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart.includes(".")) {
                    filename = lastPart;
                }
            } catch (e) {
                // Keep default filename
            }

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
            
            // Absolute fallback: if fetch fails, try downloading directly without target="_blank"
            const link = document.createElement("a");
            link.href = SelectedImgSrc;
            link.download = `Odometer_Image_${new Date().getTime()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

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

        if (selectedRange?.startDate === "" || selectedRange?.endDate === "") {
            alert("Enter the Date Range")
            return
        }
        GetFilteredEmployee(TRIP_ODOMETER_FILTER, payload)
    }

    useEffect(() => {
        if (EmployeeData) {
            setEmployeeDatas(Array.isArray(EmployeeData) ? EmployeeData : (EmployeeData?.data || []))
        }

    }, [EmployeeData])
    const columns = useMemo(
        () => [
            {
                header: "Employee Name",
                accessorFn: (row) =>
                    row.employee_name || `${row.employee?.first_name ?? ""} ${row.employee?.last_name ?? ""}`.trim(),
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
                header: "Trip Number",
                accessorKey: "trip_number",
                enableSorting: true,
                enableColumnFilter: false,
                size: 100,
            },
            {
                header: "Vehicle Number",
                accessorKey: "vehicle_number",
                enableSorting: true,
                enableColumnFilter: false,
                size: 120,
            },
            {
                header: "Type",
                accessorKey: "info_type",
                enableSorting: true,
                enableColumnFilter: false,
                size: 100,
            },
            {
                header: "Odometer Reading",
                accessorKey: "odometer_reading",
                enableSorting: true,
                enableColumnFilter: false,
                size: 140,
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
                                setSelectedImgSrc(getImageSrc(getValue()))
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
        <div className='page-content py-0 px-0  '>
            <div className="bg-white sticky-top" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title=" Employee Trip Details" />
            </div>
            <div className="container-fluid px-3">
                {/*  header */}

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
                                        onDownloadExcle={DownloadBookingDetails}
                                        ExcleLoading={isExporting}
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
                        onSuccess={handleDownloadImage}
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