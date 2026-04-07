import { Button, Col, FormGroup, FormText, Input, Label, Row, Spinner } from "reactstrap"
import SearchableDropdown from "../../components/Common/SearchableDropdown"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { CORPORATE_BILLING_BULK_UPDATE, CORPORATE_BILLING_INVOICE, CORPORATE_CUSTOMERS_LIST, GET_USER_API } from "../../api"
import DateRangeInput from "../../components/Common/DateRangeInput"
import { useEffect, useMemo, useState } from "react"
import { IoMdCloudDownload } from "react-icons/io"
import TableContainer from "../../components/Table/TableContainer"
import MainHeaderComp from "../../components/MainHeaderCom"
import useExcelParser from "../../hooks/useExcelParser"
import formatDateForPayload from "../../helpers/DateHelper"
import { downloadExcel } from "../../helpers/downloadExcel"
import usePostApiCall from "../../hooks/usePostApiCall"
import { usePDF } from "react-to-pdf"
import { Loader } from "rsuite"
import CorporateInvoiceGenerate from "../../PdfComponents/CorporateInvoiceGenerate"
import { GridLoader } from "react-spinners"
import ToasterProvider from "../../helpers/ToasterProvider"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"

const CorporateBilling = () => {

    const { toPDF, targetRef } = usePDF({
        filename: `Corporate_invoice.pdf`,
        page: {
            margin: 10,
            timeout: 30000,
        },
    });
    const { ErrorToaster } = ToasterProvider()
    // pdf data
    const [PdfData, setPdfData] = useState(null)

    const [isGenerating, setIsGenerating] = useState(false)
    const [AllCoporateData, setAllCorporateData] = useState(null)

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


    const columns = useMemo(
        () => [
            {
                header: 'Date',
                accessorKey: 'date',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'To Pincode',
                accessorKey: 'to_pincode',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'From Pincode',
                accessorKey: 'from_pincode',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Consignee',
                accessorKey: 'Consignee',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'AWB No',
                accessorKey: 'awbno',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Weight',
                accessorKey: 'weight',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Base Rate',
                accessorKey: 'base_rate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Freight Amount',
                accessorKey: 'freight_amount',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'FSC',
                accessorKey: 'fsc',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'COD',
                accessorKey: 'cod',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'FOV',
                accessorKey: 'fov',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Total Before GST',
                accessorKey: 'total_before_gst',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'GST Amount',
                accessorKey: 'gst_amount',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Total',
                accessorKey: 'total',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Product',
                accessorKey: 'product',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Org SC',
                accessorKey: 'orgsc',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'RTO',
                accessorKey: 'rto',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Appointment Charges',
                accessorKey: 'appointment_charges',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'ODA',
                accessorKey: 'oda',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || 'NA',
            }
        ],
        []
    );
    // GET_USER_API
    // defining the get user api
    const { apifunc: GetUserList, data: UserList, loading: GetuserLoading } = useGetApiCall()
    //  convering the execle to json hook
    const { parseExcel: ConvertExcleToJson, data: JsonData, error: JsonError, isLoading: JsonLoadingError } = useExcelParser()

    // defining the upload franchise invoice api
    const { apifunc: uploadCorporateInvoice, loading: UploadcorporateInvoiceLoading } = usePostApiCall(null, "Invoice Uploaded Successfully")
    //  definging the get the Corporate billing
    const { apifunc: GetCorporateBilling, data: CoprorateBilling, loading: CorporateBillingLoading, error } = usePostApiCall()
    // show upload button
    const [showUploadBtn, SetShowUploadButton] = useState(false)
    const [UploadedFile, setUploadedFile] = useState(null)
    const [Customes, setCustomers] = useState([])
    const [selectedRange, setSelectedRange] = useState({
        startDate: null,
        endDate: null,
    });

    const [SelectedCustomer, setSelectedCustomer] = useState(null)
    // payload to update the file
    const [SelectedFranchiseInvoicePayload, setSeletedFranchiseInvoicePayload] = useState(null)
    useEffect(() => {
        // calling the get user list api
        GetUserList(CORPORATE_CUSTOMERS_LIST)
    }, [])


    const handleLocationChange = (value) => {
        setSelectedCustomer(value);
    };
    const handleDateChange = (range) => {
        setSelectedRange(range);
    };


    useEffect(() => {
        if (UserList) {
            const typeOfUser = ["Corporate"];
            const UserUpdatedList = UserList?.user
                .filter((ele) => typeOfUser.includes(ele?.cust_type?.type_of_cust))
                .map((ele) => {
                    // const name = ele?.customer_name ? ele?.customer_name : ele?.username
                    const name = `${ele?.customer_name || ""} - ${ele?.username}`
                    return name ? { name: name, id: ele?.id, value: ele?.customer_name } : null;
                })
                .filter(Boolean); // Remove any null entries

            setCustomers(UserUpdatedList);

        }
    }, [UserList]);
    //  billing
    const [BillData, setBilling] = useState([])

    //  uploading the invoice file to excle and calling the api
    const UploadInvoiceChange = async (e) => {
        setUploadedFile(e.target.files[0])
        let file = e.target.files[0]
        let requiredFields = ["date", "to_pincode", "from_pincode", "Consignee", "awbno", "weight", "base_rate", "freight_amount", "fsc", "fov", "total_before_gst", "gst_amount", "total", "Invoice No", "orgsc", "cod", "rto", "appointment_charges", "pickup", "deliver", "oda", "status"]
        // let requiredFields=[]
        // const {
        //     titleCell = 'A1',
        //     dataStartRow = 2, // 0-indexed
        //     caseSensitiveHeaders = false
        // } = options;
        const options = {
            titleCell: 'A6',
            dataStartRow: 7, // 0-indexed
            caseSensitiveHeaders: false
        }
        let JsonData = await ConvertExcleToJson(file, requiredFields, options)
        if (JsonData?.data?.length > 0) {

            let titles = JsonData.title.split(",")
            let startData1 = await ConvertExcleToJson(file, [], {
                titleCell: 'A3',
                dataStartRow: 3,
            })

            let EndData1 = await ConvertExcleToJson(file, [], {
                titleCell: 'A4',
                dataStartRow: 4,
            })
            let TotalAmount = await ConvertExcleToJson(file, [], {
                titleCell: 'A6',
                dataStartRow: 6,
            })

            let state = await ConvertExcleToJson(file, [], {
                titleCell: 'A5',
                dataStartRow: 6,
            })

            let CustomerId = await ConvertExcleToJson(file, [], {
                titleCell: 'A2',
                dataStartRow: 2,
            })
            let CustomerName = await ConvertExcleToJson(file, [], {
                titleCell: 'A1',
                dataStartRow: 1,
            })
            console.log(titles, "titles")
            const start_date = startData1.title.replace("start_date - ", "").trim()
            const end_date = EndData1.title.replace("end_date -", "").trim();

            // Convert string to Date object
            // const startDateObj = new Date(
            //     start_date.split('-')[2], // year
            //     start_date.split('-')[1] - 1, // month (0-indexed)
            //     start_date.split('-')[0] // day
            // );

            const startDateObj = `${start_date.split('-')[2]}-${start_date.split('-')[1]}-${start_date.split('-')[0]}`
            const endDateObj = `${end_date.split('-')[2]}-${end_date.split('-')[1]}-${end_date.split('-')[0]}`

            // const endDateObj = new Date(
            //     end_date.split('-')[2], // year
            //     end_date.split('-')[1] - 1, // month (0-indexed)
            //     end_date.split('-')[0] // day
            // );

            console.log(startDateObj, start_date, "startDateObj")
            let createdById = JSON.parse(localStorage.getItem("authUser"))?.user?.id
            // console.log(CustomerName.title.split("-")[1].trim(),"name")
            let requiredPayload = {
                customer_name: CustomerName.title.split(" - ")[1].trim(),
                customer_id: CustomerId?.title.replace("customer_id -", "").trim(),
                created_by_id: createdById,
                start_date: startDateObj,
                end_date: endDateObj,
                state: state?.title.replace("state -", "").trim(),
                generated_on: new Date().toISOString().split("T")[0],
                total_amount: parseInt(TotalAmount?.title?.replace("total_amount -", "").trim()),
                bills: JsonData?.data.map((ele) => {
                    return {
                        "date": ele?.date || new Date(), // fallback to current date
                        "to_pincode": ele?.to_pincode || "",
                        "from_pincode": ele?.from_pincode || "",
                        "awbno": ele?.awbno || "",
                        "weight": ele?.weight || 0,
                        "base_rate": ele?.base_rate || 0,
                        "freight_amount": ele?.freight_amount || 0,
                        "fsc": ele?.fsc ?? 0,
                        "cod": ele?.cod ?? 0,
                        "fov": ele?.fov ?? 0,
                        "total_before_gst": ele?.total_before_gst ?? 0,
                        "gst_amount": ele?.gst_amount ?? 0,
                        "total": ele?.total ?? 0,
                        "Consignee": ele?.Consignee || "",
                        "zone": ele?.zone || "",
                        "Invoice No": ele?.["Invoice No"] || "",
                        "product": ele?.product || "",
                        "orgsc": ele?.orgsc || "",
                        "rto": ele?.rto ?? 0,
                        "appointment_charges": ele?.appointment_charges ?? 0,
                        "pickup": ele?.pickup ?? 0,
                        "deliver": ele?.deliver ?? 0,
                        "oda": ele?.oda ?? 0,
                        "status": ele?.status || ""
                    };
                })

            }
            console.log(requiredPayload, "requiredPayload")
            console.log(requiredPayload, "requiredPayload")
            SetShowUploadButton(true)
            //  loading the payload
            setSeletedFranchiseInvoicePayload(requiredPayload)
        }
        else {
            console.log(JsonData, "JsonData")
            SetShowUploadButton(false)
            alert(`Upload Valid Excel file${JsonData?.message ? '\n' + JsonData.message : ''}`);
        }
    }

    //  download excle
    const DownloadBookingDetails = async () => {
        // Transform your data with all required fields
        const exportData = BillData.map(item => ({
            "date": item?.date || "NAN",
            "to_pincode": item?.to_pincode || "--",
            "from_pincode": item?.from_pincode || "--",
            "awbno": item?.awbno || "--",
            "weight": item?.weight || 0,
            "base_rate": item?.base_rate || 0,
            "freight_amount": item?.freight_amount || 0,
            "fsc": item?.fsc || 0,
            "cod": item?.cod || 0,
            "fov": item?.fov || 0,
            "total_before_gst": item?.total_before_gst || 0,
            "gst_amount": item?.gst_amount || 0,
            "total": item?.total || 0,
            "Consignee": item?.Consignee || "NAN",
            "zone": item?.zone || "NAN",
            "Invoice No": item?.["Invoice No"] || "",
            "product": item?.product || "NAN",
            "orgsc": item?.orgsc || "NAN",
            "rto": item?.rto || 0,
            "appointment_charges": item?.appointment_charges || 0,
            "pickup": item?.pickup || 0,
            "deliver": item?.deliver || 0,
            "oda": item?.oda || 0,
            "status": item?.status || "NAN"
        }));

        let formatedDate = formatDateForPayload(selectedRange)
        let payload = {
            "customer_name": SelectedCustomer?.value,
            "customer_id": SelectedCustomer?.id,
            "start_date": formatedDate?.from_date,
            "end_date": formatedDate.to_date,
            "state": "",
            "total_amount": AllCoporateData?.total
        }

        const payloadString = Object.entries(payload)
            .map(([key, value]) => `${key.toLowerCase()} - ${value}`)
            .join(', ');

        await downloadExcel(
            exportData,
            'Coporate_invoice.xlsx',
            "sheet",
            payloadString
        );
    }

    // upload and generate pdf
    const UploadInvoice = async () => {
        if (SelectedFranchiseInvoicePayload) {
            let uploadedSuccess = await uploadCorporateInvoice(CORPORATE_BILLING_BULK_UPDATE, SelectedFranchiseInvoicePayload)
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
                ErrorToaster("PDF Invoice Not Available")
            }
        }
    }
    // CheckCustomerBillings

    const CheckCustomerBillings = async () => {
        setBilling([])
        if (!SelectedCustomer) {
            alert("selcted the customer")
            return
        }
        if (!selectedRange.startDate || !selectedRange.endDate) {
            alert("select the data range")
        }
        let formatedDate = formatDateForPayload(selectedRange)
        console.log(SelectedCustomer, "SelectedCustomer")
        let payload = {
            "customer_id": SelectedCustomer?.id,
            "customer_name": SelectedCustomer?.name?.split(" - ")[0],
            "start_date": formatedDate?.from_date,
            "end_date": formatedDate.to_date
        }


        //  calling get franchise billing api 
        let CorporateBillings = await GetCorporateBilling(CORPORATE_BILLING_INVOICE, payload)
        if (CorporateBillings) {
            setAllCorporateData(CorporateBillings)
            setBilling(CorporateBillings?.bills || [])
            // window.location.reload();
        }
        else {
            setError(CorporateBillings)
            setBilling(CorporateBillings?.bills || [])
        }
    }
    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Generate Corporate Bills"
                />
            </div>
            <div className="container-fluid px-3">
                <div className="mt-3">
                    <Row className="pb-0 align-items-end border-bottom">
                        <Col md={4}>
                            <FormGroup className="mb-0">
                                <Label for="gstUpload">Upload Invoice</Label>
                                <Input type="file" id="gstUpload" onChange={UploadInvoiceChange} />
                                {
                                    JsonLoadingError && <Spinner size="sm" className="ms-2">
                                        Loading...
                                    </Spinner>
                                }
                                <FormText color="muted" className="mb-0">Upload Invoice file if available</FormText>
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <Button color="primary" disabled={!showUploadBtn || !UploadedFile} onClick={UploadInvoice} className="w-100" style={{ height: "38px", marginBottom: "35px" }} >
                                {
                                    UploadcorporateInvoiceLoading ? <Spinner size="sm">
                                        Loading...
                                    </Spinner> : "Upload"
                                }
                            </Button>
                        </Col>
                    </Row>
                    <Row className="pt-3 pb-3 align-items-end border-bottom">
                        <Col md={4}>
                            <FormGroup className="mb-0">
                                <Label>Select Customer</Label>
                                <SearchableDropdown
                                    onChange={handleLocationChange}
                                    locations={Customes}
                                    placeholder={GetuserLoading ? "loading..." : "Select Customer"}
                                    className="w-100"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup className="mb-0">
                                <Label>Select Date Range</Label>
                                <DateRangeInput
                                    onChange={handleDateChange}
                                    value={selectedRange}
                                    isBorder={true}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={2}>
                            <Button color="primary" onClick={CheckCustomerBillings} className="w-100" style={{ height: "38px", marginBottom: "15px" }} >
                                {
                                    CorporateBillingLoading ? "Checking.." : "Check"
                                }
                            </Button>
                        </Col>
                    </Row>
                </div>
                {/*  */}

                <div className=" mt-1">
                    <div className='mt-2'>
                        {
                            CorporateBillingLoading ? <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Corpotate Billing ...</p>
                            </div>
                                :
                                <>{
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

                    {/* download pdf and it will be hidden */}
                    {
                        PdfData && <CorporateInvoiceGenerate targetRef={targetRef} invoiceData={PdfData} />
                    }


                </div>
            </div>
        </div>
    )
}
export default CorporateBilling
