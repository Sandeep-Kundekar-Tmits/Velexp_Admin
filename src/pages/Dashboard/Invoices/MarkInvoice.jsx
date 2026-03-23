import { Button, FormFeedback, FormGroup, Input, Label, Table } from "reactstrap"
import TableContainer from "../../../components/Table/TableContainer"
import { useRef, useState } from "react"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { UPLOAD_ALL_MARKED_INVOICES } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"
import ExcleDownloadBtn from "../../../components/Common/ExcleDownloadBtn"
import { useExcelExport } from "../../../hooks/useExcelExport"
import ExcleUploadFiled from "../../../components/Common/ExcleUploadFiled"
import useExcelParser from "../../../hooks/useExcelParser"
import MainHeaderComp from "../../../components/MainHeaderCom"

const MarkInvoice = () => {
    const fileInputRef = useRef(null)
    //  states
    const [MarksInvoiceData, setMarkInvoiceData] = useState({
        invoice_no: "",
        awb_list: []
    })
    const [showtable, setShowtable] = useState(false)
    const [tableData, setTableData] = useState([])
    const [SelectedFile, setSelectedFile] = useState(null)
    // store invoice data after converting in to excle
    const [InvoiceJsonData, setInvoiceJsonData] = useState([])
    const { ErrorToaster, SucceesToaster } = ToasterProvider()


    //  defing the post invoice number
    const { apifunc: AddInvoices, data: AllInvoicesdata, loading: addInvoiceLoaing } = usePostApiCall()
    // defining the download excle
    const { exportToExcel, isExporting } = useExcelExport()
    // defining the get excle to json
    const { parseExcel: ConvertExcleToJson, data, isLoading } = useExcelParser()

    const Coloumn = [
        {
            header: 'Unupdated_Awbno',
            accessorKey: 'unupdated_awbno',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue() || 'NAN',
        },
    ]
    const OnUpload = async () => {

        //  api call
        let InvoiceUploadedData = await AddInvoices(UPLOAD_ALL_MARKED_INVOICES, MarksInvoiceData)
        if (InvoiceUploadedData?.status === "success") {
            SucceesToaster(InvoiceUploadedData?.msg)
            // clearing all status
            setMarkInvoiceData({
                invoice_no: "",
                awb_list: []
            })
            setShowtable(false)
        }
        else {
            ErrorToaster(InvoiceUploadedData?.msg)
            if (InvoiceUploadedData?.unupdated_awbno?.length > 0) {
                let Unupdated_AwbNo = InvoiceUploadedData?.unupdated_awbno?.map((ele => {
                    return {
                        unupdated_awbno: ele
                    }
                }))
                setTableData(Unupdated_AwbNo)
                setShowtable(true)
            }
        }
    }

    // on download template
    const onDonwloadTemplate = () => {
        exportToExcel(["Invoice_No", "AWB Nos"], "Marked_Invoice", (item) => ({
            "Invoice_No": "",
            "AWB_Nos": "",
        }),);
    }

    // convert the excle to json
    const OnFileInputChange = async (e) => {
        setSelectedFile(e.target.files[0])
        let file = e.target.files[0]
        let requiredFields = [
            'Invoice_No',
            'AWB_Nos'
        ]
        // let requiredFields=[]
        let option = {
            titleCell: 'A1',
            dataStartRow: 1, // 0-indexed
            caseSensitiveHeaders: false
        }
        let JsonData = await ConvertExcleToJson(file, requiredFields, option)
        if (JsonData?.message) {
            ErrorToaster(JsonData?.message)
            return
        }
        else {
            let data = JsonData.data
            let Invoices = data?.filter(ele => ele?.Invoice_No !== "" && ele?.Invoice_No != null);

            console.log(Invoices, "Invoices")
            if (Invoices.length > 1) {
                ErrorToaster("Multiple Invoices Numbers Not Allowed")
                return
            }
            let payload = {
                invoice_no: Invoices[0]?.Invoice_No,
                awb_list: data?.map(ele => ele?.AWB_Nos)
            }
            setMarkInvoiceData(payload)
            setInvoiceJsonData(JsonData?.data)
        }
    }

    // on clear table
    const OnClearClick = () => {
        setShowtable(false)
        tableData([])
        setSelectedFile(null)
        fileInputRef.current.value = "";
    }
    return (
        <div className='page-content py-0 px-0' style={{ overflowX: 'hidden' }}>
            <div className="bg-white sticky-top" style={{ top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Mark Invoice Numbers"
                    extraFields={
                        <ExcleDownloadBtn
                            label={"Download Template"}
                            onDownloadExcle={onDonwloadTemplate}
                            ExcleLoading={isExporting}
                        />
                    }
                />
            </div>
            <div className="container-fluid px-3 mt-2">


                {/* input filed */}
                <ExcleUploadFiled
                    Title="Upload Invoice"
                    OnInputChange={OnFileInputChange}
                    loading={isLoading}
                    isBtnDisabled={!SelectedFile || InvoiceJsonData?.length < 1}
                    onUpload={OnUpload}
                    isUploading={addInvoiceLoaing}
                    inputRef={fileInputRef}
                />


                {/* un updated awb table on error */}
                {
                    showtable && <TableContainer
                        columns={Coloumn}
                        data={tableData || []}
                        isGlobalFilter={true}
                        isPagination={true}
                        isCustomPageSize={true}
                        ShowClearBtn={true}
                        OnClearClick={OnClearClick}
                        SearchPlaceholder="Search From Table"
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                }

            </div>
        </div>
    )
}
export default MarkInvoice