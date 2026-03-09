import { useEffect, useMemo, useState } from "react";
import SearchableDropdown from "../../../components/Common/SearchableDropdown"
import { Button, Col, FormGroup, FormText, Input, Label, Row, Spinner } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from "../../../components/Table/TableContainer";
import { IoMdCloudDownload } from "react-icons/io";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_FRANCHISE_INVOICE, GET_USER_API, UPLOAD_FRANCHISE_INVOICE } from "../../../api";
import usePostApiCall from "../../../hooks/usePostApiCall";
import formatDateForPayload from "../../../helpers/DateHelper";
import { GridLoader } from "react-spinners";
// import downloadExcel from "../../helpers/downloadExcel";
import useExcelParser from "../../../hooks/useExcelParser";
import { downloadExcel } from "../../../helpers/downloadExcel";
import { usePDF } from "react-to-pdf";
import { Loader } from "rsuite";
import FranchiseInvoiceGenerate from "../../../PdfComponents/FranchiseInvoiceGenerate";
import ToasterProvider from "../../../helpers/ToasterProvider";

const CustomerInvoice = () => {
    const { toPDF, targetRef } = usePDF({
        filename: `Franchise_Invoice.pdf`,
        page: {
            margin: 10,
            timeout: 30000,
        },
    });
    // pdf data
    const [PdfData, setPdfData] = useState(null)
    const { ErrorToaster } = ToasterProvider()
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await toPDF();
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // GET_USER_API
    // defining the get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()

    //  definging the get the franchise billing
    const { apifunc: GetFranchiseeBilling, data: franchiseBilling, loading: franchiseeBillingLoading, error } = usePostApiCall()
    // show upload button
    const [showUploadBtn, SetShowUploadButton] = useState(false)

    //  convering the execle to json hook
    const { parseExcel: ConvertExcleToJson, data: JsonData, error: JsonError, isLoading: JsonLoadingError } = useExcelParser()
    // defining the upload franchise invoice api
    const { apifunc: uploadFranchiseInvoice, loading: UploadFranchiseInvoiceLoading } = usePostApiCall(null, "Invoice Uploaded Successfully")
    const [Customes, setCustomers] = useState([])
    const [UploadedFile, setUploadedFile] = useState(null)
    const [Error, setError] = useState(null)

    useEffect(() => {
        // calling the get user list api
        GetUserList(`${GET_USER_API}/`)
    }, [])

    useEffect(() => {
        if (UserList) {
            const typeOfUser = ["Franchise"];
            const UserUpdatedList = UserList
                .filter((ele) => typeOfUser.includes(ele?.cust_type?.type_of_cust))
                .map((ele) => {
                    // const name = ele?.customer_name ? ele?.customer_name : ele?.username
                    const name = `${ele?.customer_name || ""} - ${ele?.username}`
                    return name ? { name: name, id: ele?.id, value: ele?.customer_name } : null;
                })
                .filter(Boolean); // Remove any null entries

            setCustomers(UserUpdatedList);

            // console.log(UserList, "UserList")
        }
    }, [UserList]);

    const columns = useMemo(
        () => [
            {
                header: 'Booking Date',
                accessorKey: 'booking_date',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NAN',
            },
            {
                header: 'AWB No',
                accessorKey: 'awbno',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NAN',
            },
            {
                header: 'Product Type',
                accessorKey: 'product_type',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NAN',
            },
            {
                header: 'Final Rate',
                accessorKey: 'final_rate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'FSC',
                accessorKey: 'fsc',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'FOV',
                accessorKey: 'fov',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'GST',
                accessorKey: 'gst',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'Total Amount',
                accessorKey: 'total_amount',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'Collectable Amount',
                accessorKey: 'total_amount_collectable',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            },
            {
                header: 'Payment Mode',
                accessorKey: 'payment_status',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? 0,
            }

        ],
        []
    );

    //  billing
    const [BillData, setBilling] = useState([])
    // payload to update the file
    const [SelectedFranchiseInvoicePayload, setSeletedFranchiseInvoicePayload] = useState(null)
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [SelectedCustomer, setSelectedCustomer] = useState(null)
    const DownloadBookingDetails = async () => {
        // Transform your data with all required fields
        const exportData = BillData.map(item => ({
            "to_pincode": item?.drop_pincode || "--",
            "from_pincode": item?.pick_pincode || "--",
            "awbno": item?.awbno || "--",
            "booking_date": item?.booking_date || "NAN",
            "weight": item?.weight || 0,
            "final_rate": item?.final_rate || 0,
            "fsc": item?.fsc || 0,
            "fov": item?.fov || 0,
            "gst": item?.gst || 0,
            "status": item?.status,
            "total_amount": item?.total_amount || 0,
            "total_amount_collectable": item?.total_amount_collectable || 0,
            "product_type": item?.product_type || "NAN",
            "payment_status": item?.payment_status || "NA"
        }));
        let formatedDate = formatDateForPayload(selectedRange)
        const today = new Date();
        const invoiceDate =
            String(today.getDate()).padStart(2, "0") + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            today.getFullYear();
        let payload = {
            "customer_name": SelectedCustomer?.value,
            "customer_id": SelectedCustomer?.id,
            "start_date": formatedDate?.from_date,
            "end_date": formatedDate.to_date,
            "invoice_date": invoiceDate, // YYYY-MM-DD,
            "state": "",
            "total_amount": franchiseBilling?.total_amount
        }

        const payloadString = Object.entries(payload)
            .map(([key, value]) => `${key.toLowerCase()} - ${value}`)
            .join(', ');
        await downloadExcel(
            exportData,
            'Customer_Invoice.xlsx',
            "payload",
            payloadString
        );
    }

    useEffect(() => {
        document.title = "corporate Invoice";
    }, []);

    const [ChoosenOption, setChoosenOption] = useState("Generate Bill")

    // getting the franchisee details and calling get franchise Invoice api
    const CheckFranchiseDetails = async () => {
        setBilling([])
        if (!SelectedCustomer) {
            alert("selcted the customer")
            return
        }
        if (!selectedRange.startDate || !selectedRange.endDate) {
            alert("select the data range")
        }
        let formatedDate = formatDateForPayload(selectedRange)
        let payload = {
            "customer_id": SelectedCustomer?.id,
            "start_date": formatedDate?.from_date,
            "end_date": formatedDate.to_date
        }

        //  calling get franchise billing api 
        let franchiseeBillings = await GetFranchiseeBilling(GET_FRANCHISE_INVOICE, payload)
        if (franchiseeBillings) {
            setBilling(franchiseeBillings?.bills || [])
        }
        else {
            setError(franchiseeBillings)
            setBilling(franchiseeBillings?.bills || [])
        }
    }

    const handleLocationChange = (value) => {
        setSelectedCustomer(value);
    };
    const handleDateChange = (range) => {
        setSelectedRange(range);
    };


    //  uploading the invoice file
    const UploadInvoiceChange = async (e) => {
        setUploadedFile(e.target.files[0])
        let file = e.target.files[0]
        let requiredFields = ["awbno", "booking_date", "final_rate", "fsc", "fov", "gst", "total_amount", "total_amount_collectable", "product_type"]
        // let requiredFields=[]
        // const {
        //     titleCell = 'A1',
        //     dataStartRow = 2, // 0-indexed
        //     caseSensitiveHeaders = false
        // } = options;
        const options = {
            titleCell: 'A1',
            dataStartRow: 8, // 0-indexed
            caseSensitiveHeaders: false
        }
        let JsonData = await ConvertExcleToJson(file, requiredFields, options)
        if (JsonData?.data?.length > 0) {
            let startData1 = await ConvertExcleToJson(file, [], {
                titleCell: 'A3',
                dataStartRow: 3,
            })

            let EndData1 = await ConvertExcleToJson(file, [], {
                titleCell: 'A4',
                dataStartRow: 4,
            })
            let TotalAmount = await ConvertExcleToJson(file, [], {
                titleCell: 'A7',
                dataStartRow: 5,
            })

            let CustomerId = await ConvertExcleToJson(file, [], {
                titleCell: 'A2',
                dataStartRow: 2,
            })
            let CustomerName = await ConvertExcleToJson(file, [], {
                titleCell: 'A1',
                dataStartRow: 1,
            })

            let invoice_date = await ConvertExcleToJson(file, [], {
                titleCell: 'A5',
                dataStartRow: 1,
            })
            let state = await ConvertExcleToJson(file, [], {
                titleCell: 'A6',
                dataStartRow: 1,
            })
            const start_date = startData1.title.replace("start_date - ", "").trim()
            const end_date = EndData1.title.replace("end_date -", "").trim();

            // Convert string to Date object
            const startDateObj = new Date(
                start_date.split('-')[2], // year
                start_date.split('-')[1] - 1, // month (0-indexed)
                start_date.split('-')[0] // day
            );

            const endDateObj = new Date(
                end_date.split('-')[2], // year
                end_date.split('-')[1] - 1, // month (0-indexed)
                end_date.split('-')[0] // day
            );

            let createdById = JSON.parse(localStorage.getItem("authUser"))?.user?.id
            let requiredPayload = {
                customer_name: CustomerName.title.replace("customer_name -", "").trim(),
                customer_id: CustomerId.title.replace("customer_id -", "").trim(),
                created_by_id: createdById,
                start_date: startDateObj,
                end_date: endDateObj,
                generated_on: new Date().toISOString().split("T")[0],
                invoice_date: invoice_date?.title.replace("invoice_date -", "").trim(),
                state: state?.title.replace("state -", "").trim(),
                total_amount: parseInt(TotalAmount.title.replace("total_amount -", "").trim()),
                bills: JsonData?.data.map((ele) => {
                    return {
                        "awbno": ele?.awbno ? ele?.awbno : "",
                        "booking_date": ele?.booking_date || new Date(), // Fallback to current date if invalid
                        "final_rate": ele?.final_rate || 0,
                        "fsc": ele?.fsc === null ? 0 : ele?.fsc,
                        "fov": ele?.fov === null ? 0 : ele?.fov,
                        "gst": ele?.gst === null ? 0 : ele?.gst,
                        "total_amount": ele?.total_amount === null ? 0 : ele?.total_amount,
                        "total_amount_collectable": ele?.total_amount_collectable === null ? 0 : ele?.total_amount_collectable,
                        "product_type": ele?.product_type === "--" ? null : ele?.product_type
                    };
                })
            }
            SetShowUploadButton(true)
            setSeletedFranchiseInvoicePayload(requiredPayload)
            //  loading the payload
            console.log(requiredPayload, "requiredPayload")
        }
        else {
            console.log(JsonData, "JsonData")
            SetShowUploadButton(false)
            alert(`Upload Valid Excel file${JsonData?.message ? '\n' + JsonData.message : ''}`);
        }
    }

    const UploadInvoice = async () => {
        if (SelectedFranchiseInvoicePayload) {
            let uploadedSuccess = await uploadFranchiseInvoice(UPLOAD_FRANCHISE_INVOICE, SelectedFranchiseInvoicePayload)
            if (uploadedSuccess?.context?.pdf_invoice) {
                SetShowUploadButton(false)
                setUploadedFile(null)
                setPdfData(uploadedSuccess?.context?.pdf_invoice)
                // window.location.reload();
                setTimeout(() => {
                    handleDownload()
                }, 1000)
            }
            else {
                ErrorToaster("PDF Invoice Not Avalable")
            }
        }
    }
    return (
        <div className='page-content'>
            <div className="container-fluid">
                <h2 className="border-bottom pb-2">Generate Franchise Bills</h2>
                <div className="">
                    <Row className="pt-3">
                        <Col md={4}>
                            <FormGroup>
                                <Label className="">Select Customer</Label>
                                <SearchableDropdown
                                    onChange={handleLocationChange}
                                    locations={Customes}
                                    // value={SelectedCustomer}
                                    className="w-100"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup >
                                <Label>Start Date and End Date</Label>

                                <DateRangePicker
                                    startDate={selectedRange.startDate}
                                    endDate={selectedRange.endDate}
                                    onChange={handleDateChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex align-items-center gap-2 ">
                                <Button color="primary" className="d-flex justify-content-center align-items-center" style={{ height: "2.0rem", width: "100%", marginTop: "28px" }} onClick={CheckFranchiseDetails}>
                                    Check
                                </Button>
                            </div>
                        </Col>
                    </Row>
                    <Row className="border-bottom ">
                        <Col md={4}>
                            <FormGroup >
                                <Label for="gstUpload">Upload Invoice</Label>
                                <Input type="file" id="gstUpload" onChange={UploadInvoiceChange} />
                                {
                                    JsonLoadingError && <Spinner size="sm" className="">
                                        Loading...
                                    </Spinner>
                                }

                                <FormText color="muted">Upload Invoice file if available</FormText>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            {
                                <Button color="primary" onClick={UploadInvoice} disabled={!showUploadBtn || !UploadedFile} className=" d-flex justify-content-center " style={{ height: "2.2rem", width: "100%", marginTop: "28px" }} >
                                    {
                                        UploadFranchiseInvoiceLoading ? <Spinner size="sm" className="">
                                            Loading...
                                        </Spinner> : "Upload"
                                    }
                                </Button>
                            }
                        </Col>
                    </Row>
                </div>

                <div className=" mt-0">
                    <div className='mt-3'>
                        {
                            franchiseeBillingLoading ? <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Franchise Billing ...</p>
                            </div>
                                :
                                <>{
                                    error ?
                                        <div style={{ height: "50vh" }}>
                                            <h4 className="text-center text-muted">{error?.msg || "No Bookings Found"}</h4>
                                        </div>
                                        :
                                        <TableContainer
                                            columns={columns}
                                            data={BillData || []}
                                            isGlobalFilter={true}
                                            isPagination={true}
                                            isCustomPageSize={true}
                                            isDownloadExcle={true}
                                            onDownloadExcle={DownloadBookingDetails}
                                            SearchPlaceholder="Search From Table"
                                            pagination="pagination"
                                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                        />
                                }
                                </>

                        }
                    </div>
                    {/*  showing the downloading message and loader */}
                    {
                        isGenerating && <Loader message="Generating the Pdf....." />
                    }
                    {/* pdf which is already hidden */}
                    {
                        PdfData && <FranchiseInvoiceGenerate ref={targetRef} invoiceData={PdfData} />
                    }

                </div>
            </div>
        </div>
    )
}

export default CustomerInvoice