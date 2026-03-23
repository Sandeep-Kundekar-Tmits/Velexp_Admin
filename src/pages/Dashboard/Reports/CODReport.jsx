
import { Button, Card, CardBody, Col, FormGroup, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../../helpers/CustomStyle"
import { FaCloudDownloadAlt } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { COD_UPLOAD_REPORTS, GET_USER_API, SERVICE_CENTER, UPLOAD_GET_REVENUE_API } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { GridLoader } from "react-spinners";
import { useExcelExport } from "../../../hooks/useExcelExport";
import { format } from "date-fns";
import MainHeaderComp from "../../../components/MainHeaderCom";
const CODReport = () => {
    const columns = useMemo(
        () => [
            {
                header: "AWB No",
                accessorKey: "awbno",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Pickup Pincode",
                accessorKey: "pick_pincode",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Drop Pincode",
                accessorKey: "drop_pincode",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Weight (Kg)",
                accessorKey: "weight",
                enableColumnFilter: false,
                enableSorting: true,
                cell: (info) => info.getValue() ?? 0,
            },
            {
                header: "Shipment Value",
                accessorKey: "shipment_value",
                enableColumnFilter: false,
                enableSorting: true,
                cell: (info) => info.getValue() ?? 0,
            },

            {
                header: "Customer Name",
                accessorKey: "customer_name",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Origin SC",
                accessorKey: "orgsc",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Consignee City",
                accessorKey: "consignee_city",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Date",
                accessorKey: "date",
                enableColumnFilter: false,
                enableSorting: true,
                size: 280,
                cell: (info) => {
                    const value = info.getValue();
                    return value || "N/A";
                },
            },
            {
                header: "COD Amount",
                accessorKey: "cod_amount",
                enableColumnFilter: false,
                enableSorting: true,
                cell: (info) => info.getValue() ?? 0,
            },
        ],
        []
    );

    const [Customers, setCustomers] = useState([])
    const [SelectedInfo, setSelectedInfo] = useState({
        customer: "All",
    })
    const [CodData, setCodData] = useState([])
    const [selectedRange, setSelectedRange] = useState({
        startDate: "",
        endDate: "",
    });

    const { exportToExcel, isExporting, exportProgress } = useExcelExport();
    //  api functions
    // defining get user api
    const { apifunc: GetAllCustomers, data: CustomerList, loading: CustomerLoading } = useGetApiCall()
    // defining the get revenue api
    const { apifunc: UploadCodReport, data: CodReportData, loading: CodReportLoading } = usePostApiCall(null)
    // functions
    const OnSelectChange = (key, option) => {
        setSelectedInfo({
            ...SelectedInfo,
            [key]: option?.value
        })
    }

    const handleChange = (range) => {
        setSelectedRange(range);
    };

    // functions
    const CheckClick = async () => {
        if (selectedRange.startDate === "" && selectedRange.endDate === "") {
            alert("select the range")
            return
        }

        if (SelectedInfo.customer === "") {
            setSelectedInfo("All")
        }

        const formattedRange = {
            start: selectedRange?.startDate
                ? format(selectedRange.startDate, 'dd-MM-yyyy')
                : "",
            end: selectedRange?.endDate
                ? format(selectedRange.endDate, 'dd-MM-yyyy')
                : "",
        };

        let payload = {
            "start_date": formattedRange?.start,
            "end_date": formattedRange?.end,
            "customer_name": SelectedInfo?.customer ? SelectedInfo?.customer : "All",
        }
        //  calling the api
        const CodeReport = await UploadCodReport(COD_UPLOAD_REPORTS, payload)

        if (CodeReport) {
            setCodData(CodeReport?.bookings)
        }
    }


    // useEffects
    useEffect(() => {
        // calling the customer api
        GetAllCustomers(`${GET_USER_API}/`)
    }, [])

    useEffect(() => {
        // customers
        if (CustomerList) {
            let updatedOptions = CustomerList
                .filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null &&
                        name !== "null" &&
                        name !== "undefined" &&
                        name !== "";
                })
                .map((ele) => ({
                    value: ele.customer_name,
                    label: `${ele.customer_name}-${ele?.username}`
                }));

            setCustomers(updatedOptions)
        }
    }, [CustomerList])

    const DownloadCODDetails = () => {
        if (selectedRange.startDate === "" && selectedRange.endDate === "") {
            alert("select the range")
            return
        }
        const formattedRange = {
            start: selectedRange?.startDate
                ? format(selectedRange.startDate, 'dd-MM-yyyy')
                : "",
            end: selectedRange?.endDate
                ? format(selectedRange.endDate, 'dd-MM-yyyy')
                : "",
        };

        let payload = {
            "start_date": formattedRange?.start,
            "end_date": formattedRange?.end,
            "customer_name": SelectedInfo?.customer ? SelectedInfo?.customer : "All",
        }
        exportToExcel(CodData, "COD_Details", (item) => ({
            "AWB No": item.awbno,
            "Pickup Pincode": item.pick_pincode,
            "Drop Pincode": item.drop_pincode,
            "Weight (Kg)": item.weight ?? 0,
            "Shipment Value": item.shipment_value ?? 0,
            "Payment Mode": item.paymentmode,
            "Customer Name": item.customer_name,
            "Origin SC": item.orgsc,
            "Consignee City": item.consignee_city,
            "Consignee State": item.consignee_state,
            "Date": (() => {
                if (!item.date) return "N/A";
                // Handle dd-mm-yyyy format safely
                const [day, month, year] = item.date.split("-");
                return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
            })(),
            "COD Amount": item.cod_amount ?? 0,
        }), payload);

    }
    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white sticky-top" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="COD Report" />
            </div>
            <div className="container-fluid px-3">
                <div className="mt-3">
                    <Row>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Customer</Label>
                                <Select
                                    name="customer"
                                    options={Customers}
                                    // value={{ value: SelectedInfo?.customer, label: SelectedInfo?.customer }}
                                    placeholder={CustomerLoading ? "Loading..." : "Search Customer"}
                                    isClearable={true}
                                    onChange={(option) => OnSelectChange("customer", option)}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label>Start Date and End Date</Label>
                                <DateRangeInput
                                    value={selectedRange}
                                    onChange={handleChange}
                                    isBorder={true}
                                />
                            </FormGroup>
                        </Col>




                        {/* buttons */}
                        <Col md={2} className='d-flex mb-3 align-content-center flex-wrap gap-2 mt-4'>
                            {/* <div className="d-flex "> */}
                            <Button color="primary"
                                onClick={CheckClick}
                                style={{ height: "2.2rem", width: "100%" }}>
                                {
                                    CodReportLoading ? "Checking..." : "Check"
                                }
                            </Button>
                            {/* </div> */}
                        </Col>

                    </Row>

                </div>

                <div className=''>
                    <div className='mt-1'>
                        {
                            CodReportLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading COD Report ...</p>
                            </div>
                                :
                                <TableContainer
                                    isCustomPageSize={true}
                                    columns={columns}
                                    onDownloadExcle={DownloadCODDetails}
                                    data={CodData || []}
                                    isGlobalFilter={true}
                                    isDownloadExcle={true}
                                    isPagination={true}
                                    ExcleLoading={isExporting}
                                    SearchPlaceholder="Search From Table"
                                    pagination="pagination"
                                    paginationWrapper='dataTables_paginate paging_simple_numbers'
                                    tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CODReport
