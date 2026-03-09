import { useEffect, useMemo, useState } from "react"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { DELETE_CORPORATE_DATA_RATE, GET_COPORATE_RATE_DATA, UPDATE_CORPORATE_DATA_RATE, UPLOAD_BULK_CORPORATE_DATA_RATE } from "../../../api"
import TableContainer from "../../Table/TableContainer"
import { GridLoader } from "react-spinners"
import { Button, Col, FormGroup, FormText, Input, Label, Row, Spinner } from "reactstrap"
import { IoMdCloudDownload } from "react-icons/io"
import { checkCustomerPermissions } from "../../../helpers/checkCustomerPermissions"
import { FaEdit, FaTrash } from "react-icons/fa"
import { usePutApiCall } from "../../../hooks/usePutApuCall"
import DeleteModal from "../../Common/DeleteModal"
import { useDeleteApiCall } from "../../../hooks/useDeleteApiCall"
import UpdateCorporateDataRate from "./UpdateCorporateDataRate"
import ToasterProvider from "../../../helpers/ToasterProvider"
import usePostApiCall from "../../../hooks/usePostApiCall"
import useExcelParser from "../../../hooks/useExcelParser"
import { downloadExcel } from "../../../helpers/downloadExcel"
// import downloadExcel from "../../../helpers/downloadExcel"
// here in this component we are giving all access to the only to admin and giving  
// only view access to sales 
const CorporateDataRate = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [isAdmin, setIsAdmin] = useState(false)
    const [SelectedTitle, setSelectedTitle] = useState("")
    const [selectedInfo, setSelectedInfo] = useState(null)
    const [RateData, setRateData] = useState([])

    const [UploadData, setUploadData] = useState([])
    // definging the get service center api
    const { apifunc: GetCorporateRateData, data: CorporateRateDataInfo, loading: CorporateRateDataLoading } = useGetApiCall()
    // defining the put (update) asus api
    const { apifunc: UpdateCorporateRateDataFunc, loading: UpdateLoading } = usePutApiCall("Updated Sucussessfully", () => setSelectedTitle(""))
    // defining the delete asus list
    const { apifunc: DeleteCorporateInfo, loading: DeleteLoading } = useDeleteApiCall()
    //  importing all the roles
    const { canAddPod, canCreateReport, canCreateUser } = checkCustomerPermissions()
    //  convering the execle to json hook
    const { parseExcel: ConvertExcleToJson, data: JsonData, error: JsonError, isLoading: JsonLoading } = useExcelParser()
    // defining the asus bulk upload api
    const { apifunc: BulkCorporateUploadFunc, loading: CorporateBulkUploadLoading } = usePostApiCall(null, "Uploaded Successfully")


    useEffect(() => {
        // checking the admin auth
        if (canAddPod && canCreateReport && canCreateUser) {
            setIsAdmin(true)
        }
        else {
            setIsAdmin(false)
        }
    }, [])

    const columns = useMemo(
        () => [
            {
                header: 'Customer',
                accessorKey: 'customer',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Min Weight',
                accessorKey: 'weight_min',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Max Weight',
                accessorKey: 'weight_max',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Rate',
                accessorKey: 'rate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Base Weight Slab',
                accessorKey: 'base_weight_slab',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Base Weight',
                accessorKey: 'base_weight',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Base Amount',
                accessorKey: 'base_amount',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Payment Mode',
                accessorKey: 'payment_mode',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'FSC',
                accessorKey: 'FSC',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'FOV Flat',
                accessorKey: 'FOV_flat',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'FOV Percentage',
                accessorKey: 'FOV_percentage',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'GST',
                accessorKey: 'gst',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Expected Delivery Days',
                accessorKey: 'expected_delivery_time_in_days',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'COD Flat',
                accessorKey: 'cod_flat',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'COD Percentage',
                accessorKey: 'cod_percentage',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'RTO Flat',
                accessorKey: 'rto_flat',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'RTO Percentage',
                accessorKey: 'rto_percentage',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Appointment Charges',
                accessorKey: 'appointment_charges',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Volume Divisor',
                accessorKey: 'volume_divisor',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'ODA Amount',
                accessorKey: 'oda_amount',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Created',
                accessorKey: 'created',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Updated',
                accessorKey: 'updated',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--",
            },
            {
                header: 'Zone',
                accessorKey: 'zone',
                enableColumnFilter: false,
                enableSorting: true,
                    cell: ({ getValue }) => {
                    const value = getValue();
                    const displayValue =
                        typeof value === 'string' ? value :
                            value?.name ?? "--";
                    return <>{displayValue}</>; // Fragments ensure valid React child
                }
            },
            {
                header: 'Product',
                accessorKey: 'product',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue();
                    const displayValue =
                        typeof value === 'string' ? value :
                            value?.name ?? "--";
                    return <>{displayValue}</>; // Fragments ensure valid React child
                }
            },
            {
                header: 'Service Level',
                accessorKey: 'service_level',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue();
                    const displayValue =
                        typeof value === 'string' ? value :
                            value?.name ?? "--";
                    return <>{displayValue}</>; // Fragments ensure valid React child
                }
            },
            ...(isAdmin ? [
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
                                <FaEdit />
                            </button>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(row.original)}
                                title="Delete"
                                aria-label="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ),
                }
            ] : [])
        ],
        [isAdmin]
    );



    //  on update Asus list
    const onSave = async (data) => {
        //  calling the update asus api

        let UpdatedData = await UpdateCorporateRateDataFunc(`${UPDATE_CORPORATE_DATA_RATE}${selectedInfo?.id}/`, data)
        if (UpdatedData) {
            setRateData((prev) => {
                return prev.map((ele) => {
                    if (ele?.id === selectedInfo?.id) {
                        return {
                            ...UpdatedData
                        }
                    }
                    else {
                        return {
                            ...ele
                        }
                    }
                })
            })
        }
    }
    // on Delete Asus list
    const onDelete = async () => {

        //  calling the delete Asus api 
        let isDeleted = await DeleteCorporateInfo(`${DELETE_CORPORATE_DATA_RATE}${selectedInfo?.id}/`)
        if (isDeleted) {
            setSelectedTitle("")
            setRateData((prev) = (prev.filter((ele) => {
                return ele?.id !== selectedInfo?.id
            })))
            SucceesToaster("Deleted Successfully")
        }
        else {
            ErrorToaster("Something went wrong")
        }

    }
    const Components = [
        {
            title: "update",
            comp: <UpdateCorporateDataRate
                initialData={selectedInfo}
                isOpen={true}
                toggle={() => setSelectedTitle("")}
                onSave={onSave}
                loading={UpdateLoading}
            />
        },
        {
            title: "delete",
            comp: <DeleteModal
                show={true}
                onCloseClick={() => setSelectedTitle("")}
                onDeleteClick={onDelete}
                loading={DeleteLoading} />
        }
    ]

    // return the popups
    const ReturnComponent = (title) => {
        let component = Components.find((ele => ele?.title === title))
        if (component) {
            return component.comp
        }
        return <></>
    }
    const handleUpdate = (rowData) => {
        setSelectedInfo(rowData || {})
        setSelectedTitle("update")
    };

    const handleDelete = (rowData) => {
        setSelectedInfo(rowData || {})
        setSelectedTitle("delete")

    };

    useEffect(() => {
        GetCorporateRateData(GET_COPORATE_RATE_DATA)
    }, [])

    useEffect(() => {
        if (CorporateRateDataInfo) {
            setRateData(CorporateRateDataInfo)
        }

    }, [CorporateRateDataInfo])

    // donwload the corporate data
    const DownloadCorporateData = () => {
        // Transform your data with all required fields
        const exportData = RateData.map(item => ({
            'ID': item.id,
            'Customer': item.customer,
            'Weight Min': item.weight_min,
            'Weight Max': item.weight_max,
            'Rate': item.rate,
            'Base Weight Slab': item.base_weight_slab,
            'Base Weight': item.base_weight,
            'Base Amount': item.base_amount,
            'Payment Mode': item.payment_mode,
            'FSC': item.FSC,
            'FOV Flat': item.FOV_flat,
            'FOV Percentage': item.FOV_percentage,
            'GST': item.gst,
            'Expected Delivery Time (Days)': item.expected_delivery_time_in_days,
            'COD Flat': item.cod_flat,
            'COD Percentage': item.cod_percentage,
            'RTO Flat': item.rto_flat,
            'RTO Percentage': item.rto_percentage,
            'Appointment Charges': item.appointment_charges,
            'Volume Divisor': item.volume_divisor,
            'ODA Amount': item.oda_amount,
            'Created Date': item.created,
            'Updated Date': item.updated,
            'Zone': item.zone,
            'Product': item.product,
            'Service Level': item.service_level
        }));

        downloadExcel(exportData, 'Corporate_Rate_data.xlsx');
    };

    //  onchange function on the upload file
    const UploadCorporateRateDataOnChange = async (e) => {
        let file = e.target.files[0]
        let requiredFields = [
            'ID',
            'Customer',
            'Weight Min',
            'Weight Max',
            'Rate',
            'Base Weight Slab',
            'Base Weight',
            'Base Amount',
            'Payment Mode',
            'FSC',
            'FOV Flat',
            'FOV Percentage',
            'GST',
            'Expected Delivery Time (Days)',
            'COD Flat',
            'COD Percentage',
            'RTO Flat',
            'RTO Percentage',
            'Appointment Charges',
            'Volume Divisor',
            'ODA Amount',
            'Created Date',
            'Updated Date',
            'Zone',
            'Product',
            'Service Level'
        ]
        // let requiredFields=[]
        let option = {
            titleCell: 'A1',
            dataStartRow: 1, // 0-indexed
            caseSensitiveHeaders: false
        }
        let JsonData = await ConvertExcleToJson(file, requiredFields, option)
        if (JsonData?.message) {
            // retun the error
            alert(JsonData.message)
            return
        }
        setUploadData(JsonData.data)

    }

    // upload function
    const CorporateBulkUpload = async () => {
        // calling the asus bulk upload api
        const uploaded = await BulkCorporateUploadFunc(UPLOAD_BULK_CORPORATE_DATA_RATE, UploadData)
        if (uploaded.status === "updated") {
            setUploadData([])
        }
    }
    return (

        <div className="p-0">
            <div className="d-flex align-items-center justify-content-between gap-2  border-bottom p-0">
                <h4>
                    Rate Data For Corporate
                </h4>
                {/* {
                    isAdmin && <Button
                        color="primary"
                        className='d-flex justify-content-center align-items-center'
                        disabled={RateData.length < 1}
                        onClick={DownloadCorporateData}
                        title='Download'
                    >
                        Download
                        <IoMdCloudDownload className="ms-2" style={{ width: "25px", height: "25px" }} />
                    </Button>
                } */}

            </div>
            <div>
                {
                    (isAdmin && RateData?.length >= 1) && <div className="d-flex align-items-center">
                        <FormGroup style={{ marginTop: "10px" }}>
                            <Label for="gstUpload">Upload </Label>
                            <Input type="file" id="gstUpload" onChange={UploadCorporateRateDataOnChange} />
                            {
                                JsonLoading && <Spinner size="sm" className="">
                                    Loading...
                                </Spinner>
                            }

                            <FormText color="muted">Upload  file if available</FormText>
                        </FormGroup>
                        {
                            UploadData.length >= 1 && <Button color="primary" onClick={CorporateBulkUpload} className="ms-5 d-flex justify-content-center align-items-center" style={{ height: "2.2rem", width: "5rem" }} >
                                {
                                    CorporateBulkUploadLoading ? <Spinner size="sm" className="">
                                        Loading...
                                    </Spinner> : "Upload"
                                }
                            </Button>
                        }


                    </div>
                }
            </div>


            <div className=''>
                {/* <UpdateShippingRateModal/> */}
                {ReturnComponent(SelectedTitle)}
                {/* <h2>Bookings</h2> */}
                <div className='mt-3'>
                    {
                        CorporateRateDataLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading Corporate Data Rate ...</p>
                        </div>
                            :
                            <TableContainer
                                columns={columns}
                                data={RateData || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                isCustomPageSize={true}
                                isDownloadExcle={isAdmin}
                                onDownloadExcle={DownloadCorporateData}
                                // ExcleLoading={}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                    }
                </div>
            </div>
        </div>
    )
}
export default CorporateDataRate