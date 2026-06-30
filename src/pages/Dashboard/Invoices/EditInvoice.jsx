import { Button, Col, FormGroup, Label, Row, Input } from "reactstrap"
import SearchableDropdown from "../../../components/Common/SearchableDropdown"
import { useEffect, useMemo, useState } from "react"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { FILTER_EDIT_ENVOICE, GET_USER_API, UPDATE_EDIT_ENVOICE } from "../../../api"
import TableContainer from "../../../components/Table/TableContainer"
import { GridLoader } from "react-spinners";
import { IoEye } from "react-icons/io5";
import { FaEdit } from "react-icons/fa"
// import downloadExcel from "../../helpers/downloadExcel"
import InvoiceEditModal from "../../../components/Invoices/InvoiceEditModal"
import { usePutApiCall } from "../../../hooks/usePutApuCall"
import ViewInvoice from "../../../components/Invoices/ViewInVoice"
import { downloadExcel } from "../../../helpers/downloadExcel"
import MainHeaderComp from "../../../components/MainHeaderCom"

const CUSTOMER_TYPES = ["Franchise", "Corporate", "Retail-Franchise"]

const EditInvoice = () => {
    //  for returning the components
    const [SeletedTitles, SetSelectedTitles] = useState("")
    const Toggle = () => {
        SetSelectedTitles("")
    }
    const columns = useMemo(
        () => [
            // Invoice Info
            // Actions (View, Update, PDF)
            {
                header: 'Actions',
                accessorKey: 'actions',
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleUpdate(row.original)}
                            title="Edit"
                            aria-label="Edit"
                        >
                            <FaEdit style={{ width: "16px", height: "16px" }} />
                        </button>
                        <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleView(row.original)}
                            title="view"
                            aria-label="view"
                        >
                            <IoEye style={{ width: "16px", height: "16px" }} />
                        </button>
                    </div>
                ),
            },
            {
                header: 'Invoice No',
                accessorKey: 'invoice_no',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() || '--',
            },
            {
                header: 'Invoice Date',
                accessorKey: 'invoice_date',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => new Date(getValue()).toLocaleDateString() || '--',
            },

            // Customer Info
            {
                header: 'Customer',
                accessorKey: 'to_name',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue();
                    return value === null || value === undefined || value === "null" ? 'NA' : value;
                }
            },
            // {
            //     header: 'Customer Type',
            //     accessorKey: 'customer.cust_type.type_of_cust',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || '--',
            // },
            // {
            //     header: 'GST No',
            //     accessorKey: 'customer.gst_no',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || 0,
            // },

            // Item Details
            // {
            //     header: 'Item ID',
            //     accessorKey: 'items[0].id',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || 'NA',
            // },
            // {
            //     header: 'Description',
            //     accessorKey: 'items[0].description',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || 'NA',
            // },
            // {
            //     header: 'Quantity',
            //     accessorKey: 'items[0].quantity',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() ?? 0,
            // },

            // Financials
            // {
            //     header: 'Freight (₹)',
            //     accessorKey: 'items[0].freight',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => `₹${getValue()?.toFixed(2) || '0.00'}`,
            // },
            // {
            //     header: 'CGST (₹)',
            //     accessorKey: 'items[0].cgst',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => `₹${getValue()?.toFixed(2) || '0.00'}`,
            // },
            // {
            //     header: 'SGST (₹)',
            //     accessorKey: 'items[0].sgst',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => `₹${getValue()?.toFixed(2) || '0.00'}`,
            // },
            // {
            //     header: 'IGST (₹)',
            //     accessorKey: 'items[0].igst',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => `₹${getValue()?.toFixed(2) || '0.00'}`,
            // },
            {
                header: 'Total (₹)',
                accessorKey: 'total_amount',
                enableColumnFilter: false,
                cell: ({ getValue }) => `${getValue()?.toFixed(2) || '0.00'}`,
            },
            // {
            //     header: 'From State',
            //     accessorKey: 'from_state_code',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || '--',
            // },
            // {
            //     header: 'To State',
            //     accessorKey: 'to_state_code',
            //     enableColumnFilter: false,
            //     cell: ({ getValue }) => getValue() || '--',
            // },


        ],
        []
    );

    const { apifunc: GetUserList, data: userListData } = useGetApiCall()
    //  defining the get filtered Edit envoice

    const { apifunc: GetFilterEditEnvoice, loading: TableDataLoading } = useGetApiCall()
    // defining the update Edit Info api
    const { apifunc: UpdatedEditEnvoice, loading: EditEnvoiceLoading } = usePutApiCall("Invoice Updated Successfully", Toggle)
    // states
    const [Customes, setCustomers] = useState([])
    const [SelectedCustomer, setSelectedCustomer] = useState(null)
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [TableData, setTableData] = useState([])
    const [SelectedInfo, setSelectedInfo] = useState(null)
    const [ExcleLoading, setExcleLoading] = useState(false)


    const handleView = (item) => {
        setSelectedInfo(item)
        SetSelectedTitles("view_invoice")
    };

    const handleUpdate = (item) => {
        setSelectedInfo(item)
        SetSelectedTitles("edit_invoice")
    };


    const HandleUpdateEditEnvoice = async (dataToUpdate) => {
        const invoiceUpdated = await UpdatedEditEnvoice(`${UPDATE_EDIT_ENVOICE}${SelectedInfo?.id}/`, dataToUpdate)
        if (invoiceUpdated) {
            setTableData(prev => prev.map(ele => ele?.id === dataToUpdate?.id ? { ...invoiceUpdated } : { ...ele }))
        }
    }


    //  component array
    const ComponentArray = [
        {
            title: "edit_invoice",
            component: <InvoiceEditModal
                invoice={SelectedInfo}
                isOpen={true}
                toggle={() => {
                    SetSelectedTitles("")
                }}
                onSave={HandleUpdateEditEnvoice}
                loading={EditEnvoiceLoading} />
        },
        {
            title: "view_invoice",
            component: <ViewInvoice
                isOpen={true}
                toggle={Toggle}
                invoiceData={SelectedInfo} />
        }
    ]

    //  return components
    const ReturnComponents = (title) => {
        let Displaycomp = ComponentArray.find((ele => ele.title === title))
        if (Displaycomp) {
            return Displaycomp.component
        }
        return <></>
    }

    const GetFilteredEditInvoiceFunc = async () => {
        if (!startDate || !endDate) {
            alert("Please select both start and end dates")
            return
        }
        setTableData([])
        const url = `${FILTER_EDIT_ENVOICE}?from_date=${startDate}&to_date=${endDate}&customer_name=${SelectedCustomer?.name || ''}`
        const filterdData = await GetFilterEditEnvoice(url)
        if (filterdData) setTableData(filterdData)
    }

    const DownloadEditInvoiceData = async () => {
        setExcleLoading(true)
        try {
            const exportData = TableData.map(item => ({
                // Invoice Info
                'Invoice No': item.invoice_no || '--',
                'Invoice Date': item.invoice_date ? new Date(item.invoice_date).toLocaleDateString() : '--',

                // Customer Info
                'Customer': item.customer?.customer_name || '--',
                'Invoice_To': item?.to_name || '--',
                'Customer Type': item.customer?.cust_type?.type_of_cust || '--',
                'GST No': item?.to_gst_no || '--',
                'Address': item?.to_address || '--',
                // Item Details
                'Item ID': item.items?.[0]?.id || '--',
                'Description': item.items?.[0]?.description || '--',
                'Quantity': item.items?.[0]?.quantity ?? 0,

                // Financials
                'Freight (₹)': item?.total_freight ? `₹${item?.total_freight.toFixed(2)}` : '₹0.00',
                'CGST (₹)': item?.total_cgst ? `₹${item?.total_cgst.toFixed(2)}` : '₹0.00',
                'SGST (₹)': item?.total_sgst ? `₹${item?.total_sgst.toFixed(2)}` : '₹0.00',
                'IGST (₹)': item?.total_igst ? `₹${item?.total_igst.toFixed(2)}` : '₹0.00',
                'Total (₹)': item.total_amount ? `₹${item?.total_amount.toFixed(2)}` : '₹0.00',

                // Location Info
                'From State': item.from_state_code || '--',
                'To State': item.to_state_code || '--'
            }));

            await downloadExcel(exportData, 'Invoice_data.xlsx');
        } catch (error) {
            console.error("Excel download failed:", error);
        } finally {
            setExcleLoading(false)
        }
    };


    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
    }, [])

    useEffect(() => {
        if (!Array.isArray(userListData)) return
        setCustomers(
            userListData
                .filter(ele => CUSTOMER_TYPES.includes(ele?.cust_type?.type_of_cust))
                .map(ele => {
                    const name = ele?.customer_name || ele?.username
                    return name ? { name, id: ele?.id } : null
                })
                .filter(Boolean)
        )
    }, [userListData])

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="Edit Invoice" />
            </div>
            <div className="container-fluid px-3">
                <Row className="mt-3 align-items-end">
                    <Col md={4} lg={3}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">Select Customer</Label>
                            <SearchableDropdown
                                onChange={setSelectedCustomer}
                                locations={Customes}
                                placeholder="Select Customer"
                                height="38px"
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4} lg={2}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                max={endDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ height: "38px" }}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4} lg={2}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                min={startDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ height: "38px" }}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2}>
                        <Button
                            color="primary"
                            className="w-100"
                            style={{ height: "38px", marginBottom: "15px" }}
                            onClick={GetFilteredEditInvoiceFunc}
                        >
                            Check
                        </Button>
                    </Col>
                </Row>

                <div className=" mt-2">
                    <h3>Details</h3>
                    <div className='mt-3'>
                        {
                            TableDataLoading ?
                                <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                    <GridLoader size={20} />
                                    <p className="mt-5 h5">Loading Edit Invoice Billing ...</p>
                                </div>
                                :
                                <>
                                    <TableContainer
                                        columns={columns}
                                        data={TableData || []}
                                        isGlobalFilter={true}
                                        isPagination={true}
                                        isDownloadExcle={true}
                                        onDownloadExcle={DownloadEditInvoiceData}
                                        ExcleLoading={ExcleLoading}
                                        SearchPlaceholder="Search From Table"
                                        pagination="pagination"
                                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                    />
                                </>

                        }
                    </div>
                </div>
                {/* components */}
                {
                    ReturnComponents(SeletedTitles)
                }
            </div>
        </div>
    )
}
export default EditInvoice