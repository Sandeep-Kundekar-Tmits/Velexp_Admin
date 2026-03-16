
import { useEffect, useMemo, useState } from "react";
import { Button, Col, FormGroup, Label, Row } from "reactstrap";
import Select from "react-select";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { GridLoader } from "react-spinners";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GET_ALL_SERVICE_PROVIDER_BOOKING, GET_DELIVARY_B2C_LABEL_GENERATION } from "../../../api";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useExcelExport } from "../../../hooks/useExcelExport";
import { useNavigate } from "react-router-dom";
import { customStyles } from "../../../helpers/CustomStyle";
// Updated formatDateLocal to handle both Date objects and strings
function formatDateLocal(d) {
    if (!d) return '';

    let date;
    if (typeof d === 'string') {
        date = new Date(d);
        // Handle YYYY-MM-DD format
        if (d.includes('-')) {
            const [year, month, day] = d.split('-').map(Number);
            date = new Date(year, month - 1, day);
        }
    } else if (d instanceof Date) {
        date = d;
    } else {
        return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', d);
        return '';
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
const ServiceProviderBooking = () => {
    const navigate = useNavigate()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });
    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    const [selectedOption, setSelectedOption] = useState({ value: "Delhivery", label: "Delhivery" })
    const handleDateChange = ({ startDate, endDate }) => {
        setSelectedRange({ startDate, endDate });
    };
    const [ServiceProviderData, setSerProviderBookingsData] = useState([])
    const [SelectedLabel, setSelectedLabel] = useState(null)
    const [isDownloading, setIsDownloading] = useState(false);


    //  defining the get service provider booking api
    const { apifunc: GetAllServiceProviderBooking, data: ServiceProviderBookings, error, loading: ServiceProviderBookingloading } = usePostApiCall()
    // defining the api to donwload the shipper lable
    const { apifunc: GetShipperLabelDownload, data: ShipperDownloadLableData, error: ShipperDownloadLablErr, loading: ShipperDownloadLabelLoading } = usePostApiCall()
    useEffect(() => {



        const today = new Date();               // e.g. 2025-12-20
        const start = new Date();
        start.setDate(today.getDate() - 6);     // 6 days before today => 7-day window
        setSelectedRange({
            startDate: formatDateLocal(start),
            endDate: formatDateLocal(today)
        })
        let payload = {
            user_id: JSON.parse(localStorage.getItem("authUser"))?.user?.id,
            service_provider: "Delhivery",
            from_date: formatDateLocal(start),    // e.g. "2025-12-14"
            to_date: formatDateLocal(today)     // e.g. "2025-12-20"
        };
        GetAllServiceProviderBooking(GET_ALL_SERVICE_PROVIDER_BOOKING, payload)
    }, [])

    const OnGetBookings = () => {
        if (selectedRange?.endDate === "" || selectedRange?.startDate == "") {
            alert("select the date range")
            return
        }
        if (!selectedOption) {
            alert("select the service providers")
        }
        let payload = {
            "user_id": JSON.parse(localStorage.getItem("authUser"))?.user?.id,
            "service_provider": selectedOption?.value,
            "from_date": formatDateLocal(selectedRange?.startDate),
            "to_date": formatDateLocal(selectedRange?.endDate)
        }
        console.log(payload, "payload")
        GetAllServiceProviderBooking(GET_ALL_SERVICE_PROVIDER_BOOKING, payload)
    }

    const DonwloadShippingLable = async (data) => {
        if (!data?.velexp_awbno || isDownloading) return;

        try {
            setSelectedLabel(data.velexp_awbno);
            setIsDownloading(true);

            const payload = {
                awbno: data.velexp_awbno,
                call_from: "booking",
            };

            const response = await fetch(GET_DELIVARY_B2C_LABEL_GENERATION, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}`, // if needed
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                let errorMsg = "Failed to download shipping label";

                // Try reading error message if backend sends JSON
                try {
                    const errData = await response.json();
                    errorMsg = errData?.msg || errorMsg;
                } catch (e) {
                    // ignore JSON parse error
                }

                ErrorToaster(errorMsg);
                return;
            }


            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Shipping_Label_${data.velexp_awbno}.pdf`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setIsDownloading(false);
            setSelectedLabel(null);
        }
    };

    const DownloadBookingDetails = () => {
        console.log(ServiceProviderData, "ServiceProviderData")
        exportToExcel(ServiceProviderData, "Service_Providers", (item) => ({
            'Sl No.': item.id,
            'Created Date': item.createddate?.split("T")[0] || '--',
            'Velexp AWB No.': item.velexp_awbno || '--',
            'Way Bill No.': item.package_waybill || '--',
            'Warehouse': item.warehouse || '--',
            'Status': item.status || '--'
        }));
    }



    const columns = useMemo(
        () => [
            {
                header: 'Sl No.',
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Created Date',
                accessorKey: 'createddate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue()?.split("T")[0] ?? "--",
            },
            {
                header: 'Velexp AWB No.',
                accessorKey: 'velexp_awbno',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Way Bill No.',
                accessorKey: 'package_waybill',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
            },
            {
                header: 'Warehouse',
                accessorKey: 'warehouse',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: "Actions",
                enableColumnFilter: false,
                accessorKey: "actions",
                enableSorting: false,
                cell: ({ row }) => {
                    const awb = row.original.velexp_awbno;
                    const isLoading =
                        isDownloading && SelectedLabel === awb;

                    return (
                        <div className="d-flex gap-2">
                            {row.original.status === "success" && (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => DonwloadShippingLable(row.original)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Downloading..." : "Shipping Label"}
                                </button>
                            )}
                        </div>
                    );
                },
            }

        ],
        [
            SelectedLabel,
        ] // Add handler functions here if they're defined outside the component
    );

    useEffect(() => {
        if (ServiceProviderBookings) {
            setSerProviderBookingsData(ServiceProviderBookings)
        }
    }, [ServiceProviderBookings])
    return (
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Bookings"
                    extraFields={
                        <Button color="primary" className="px-4 py-2" onClick={() => {
                            navigate("/corporate-booking")
                        }} >
                            New Booking
                        </Button>
                    }
                />
            </div>
            <div className="container-fluid">

                <Row className="mt-3">
                    <Col md={4}>
                        <FormGroup>
                            <Label>Service Provider</Label>
                            <Select
                                options={[
                                    { value: "Delhivery", label: "Delhivery" }
                                ]}
                                placeholder="Service Provider"
                                className="basic-select"
                                onChange={(value) => setSelectedOption(value)}
                                classNamePrefix="select"
                                defaultValue={{ value: "Delhivery", label: "Delhivery" }}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex align-items-end mb-3">
                        <Button color="primary" className="w-100" style={{ height: "35px" }} onClick={OnGetBookings} >
                            Get Data
                        </Button>
                    </Col>
                </Row>

                <div className=" mt-1">
                    <div className='mt-2'>
                        {
                            ServiceProviderBookingloading ? <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Bookings ...</p>
                            </div>
                                :
                                <>{
                                    <TableContainer
                                        columns={columns}
                                        data={ServiceProviderData || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        extraFiled={
                                            <div style={{ width: '250px' }}>
                                                <DateRangeInput
                                                    onChange={handleDateChange}
                                                    value={selectedRange}
                                                    className="h-100"
                                                    isBorderRight={true}
                                                />
                                            </div>
                                        }
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
                </div>
            </div>
        </div>
    )
}
export default ServiceProviderBooking