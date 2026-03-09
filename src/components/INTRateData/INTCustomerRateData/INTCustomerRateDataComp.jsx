import { memo, useEffect, useMemo, useState } from "react"
import TableContainer from "../../Table/TableContainer"
import { Button, FormGroup, FormText, Input, Label, Spinner } from "reactstrap"
import { checkCustomerPermissions } from "../../../helpers/checkCustomerPermissions"
import { IoMdCloudDownload } from "react-icons/io"
import useExcelParser from "../../../hooks/useExcelParser"
import { DELETE_INT_CUTOMER_RATE_DATA, INT_CUSTOMER_RATE_DATA, INT_CUTSOMER_RATE_DATA_UPLOAD, UPDATE_INT_CUSTOMER_RATE_DATA } from "../../../api"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { FaTrash } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { GridLoader } from "react-spinners"
import { downloadExcel } from "../../../helpers/downloadExcel"
import DeleteModal from "../../Common/DeleteModal"
import { useDeleteApiCall } from "../../../hooks/useDeleteApiCall"
import UpdateINTCustomerRateData from "./UpdateINTCustomerRateData"
import { usePutApiCall } from "../../../hooks/usePutApuCall"
import { usePatchApiCall } from "../../../hooks/usePatchApiCall"

const INTCustomerRateDataComp = () => {
    const [SelectedTitle, setSelectedTitle] = useState("")
    const [isAdmin, setIsAdmin] = useState(false)
    const [RateData, setRateData] = useState([])
    const [UploadData, setUploadData] = useState([])
    const [updateData, setUpdateData] = useState(null)

    //  importing all the roles
    const { canAddPod, canCreateReport, canCreateUser } = checkCustomerPermissions()
    //  convering the execle to json hook
    const { parseExcel: ConvertExcleToJson, data: JsonData, error: JsonError, isLoading: JsonLoading } = useExcelParser()

    // defining the IntCustomer bulk upload api
    const { apifunc: BulkINTCUstomerUploadFunc, loading: BulkINTCustomerUploadLoading } = usePostApiCall(null, "Uploaded Successfully")
    // defining the int customer rate data get api
    const { apifunc: GetIntCustomerData, loading: IntCustomerDataLoading, data: IntCustomerRateData, } = useGetApiCall()
    // defing the update customer rate data
    const { apifunc: UpdateCustomerRatedata, loading: UpdateCustomerRatadataLoading } = usePatchApiCall("Updated Successfully", () => setSelectedTitle(""))

    // defining the delete api
    const { apifunc: DeleteInt_CustomerRateData, loading: DeleteLoading } = useDeleteApiCall()


    useEffect(() => {
        // checking the admin auth
        if (canAddPod && canCreateReport && canCreateUser) {
            setIsAdmin(true)
        }
        else {
            setIsAdmin(false)
        }

        //  calling the int customer  rate data api
        GetIntCustomerData(INT_CUSTOMER_RATE_DATA)
    }, [])

    useEffect(() => {
        if (IntCustomerRateData) {
            setRateData(IntCustomerRateData)
            console.log(IntCustomerRateData, "IntCustomerRateData")
        }
    }, [IntCustomerRateData])

    //  onchange function on the upload file
    const UploadINTCustomerOnChange = async (e) => {
        let file = e.target.files[0]
        let requiredFields = [
            'id',
            'customer_name',
            'country_code',
            'service_code',
            'vendor',
            'weight_min',
            'weight_max',
            'rate',
            'FSC',
            'FOV_flat',
            'FOV_percentage',
            'country_id'
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
        const ensureDecimal = (value) => {
            // Handle null/undefined cases
            if (value === null || value === undefined) return 0.0;

            // Convert to number if it's a string
            const num = typeof value === 'string' ? parseFloat(value) : Number(value);

            // Return 0.0 for zero, otherwise the parsed number
            return num === 0 ? 0.0 : num;
        };

        let updatedData = JsonData.data.map((ele) => ({
            ...ele,
            weight_min: ensureDecimal(ele?.weight_min),
            weight_max: ensureDecimal(ele?.weight_max),
            // rate: ensureDecimal(ele?.rate),
            FSC: ensureDecimal(ele?.FSC),
            FOV_flat: ensureDecimal(ele?.FOV_flat),
            FOV_percentage: ensureDecimal(ele?.FOV_percentage),
            gst: ensureDecimal(ele?.gst)
        }));

        console.log(updatedData)
        setUploadData(updatedData)

    }



    // upload function
    const INT_BulkUpload = async () => {
        // calling the asus bulk upload api
        const uploaded = await BulkINTCUstomerUploadFunc(INT_CUTSOMER_RATE_DATA_UPLOAD, UploadData)
        if (uploaded.status === "updated") {
            setUploadData([])
        }
    }


    // calling the delete Int customer rata data api
    const onDelete = async () => {
        let isDeleted = await DeleteInt_CustomerRateData(`${DELETE_INT_CUTOMER_RATE_DATA}${updateData?.id}`)
        if (isDeleted) {
            // filter
            setSelectedTitle("")
            setRateData((arr) => {
                return arr.filter((ele) => {
                    return ele?.id !== updateData?.id
                })
            })
        }
    }

    // update CustomerRate data function and calling the update api
    const updateCustomerRatedata = async (datatoUpdate) => {
        console.log(datatoUpdate, "datatoUpdate")
        let UpdateRateData = await UpdateCustomerRatedata(UPDATE_INT_CUSTOMER_RATE_DATA, datatoUpdate)
    }


    //  all popup components
    const DisplayComponents = [
        {
            title: "updateInt_Ratedata",
            component: <UpdateINTCustomerRateData
                onSave={updateCustomerRatedata}
                Int_rateData={updateData} toggle={() => setSelectedTitle("")}

            />
        },
        {
            title: "delete",
            component: <DeleteModal
                show={true}
                onCloseClick={() => setSelectedTitle("")}
                onDeleteClick={onDelete}
                loading={DeleteLoading}
            />
        }
    ]

    // returning the components
    const ReturnComponent = (title) => {
        let Comp = DisplayComponents.find((ele => ele?.title === title))
        if (Comp) {
            return Comp.component
        }
        return <></>
    }

    // handleUpdate

    const handleUpdate = (data) => {
        console.log("update data", data)
        setUpdateData(data)
        setSelectedTitle("updateInt_Ratedata")
    }

    // handleDelete
    const handleDelete = (data) => {
        console.log("delete data", data)
        setUpdateData(data)
        setSelectedTitle("delete")
    }

    const DownloadIntCutomerData = () => {
        // Transform your data with all required fields
        const exportData = RateData.map(item => ({
            'ID': item.id,
            'Customer Name': item.customer_name,
            'Country Code': item.country_code,
            'Service Code': item.service_code,
            'Vendor': item.vendor,
            'Weight Min': item.weight_min,
            'Weight Max': item.weight_max,
            'Rate': item.rate,
            'FSC': item.FSC,
            'FOV Flat': item.FOV_flat,
            'FOV Percentage': item.FOV_percentage,
            'GST': item.gst,
            'Country': item.country
        }));

        downloadExcel(exportData, 'INT_CutsomerRataData.xlsx');
    }


    const columns = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Customer Name',
                accessorKey: 'customer_name',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Country Code',
                accessorKey: 'country_code',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Service Code',
                accessorKey: 'service_code',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Vendor',
                accessorKey: 'vendor',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Weight Min',
                accessorKey: 'weight_min',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Weight Max',
                accessorKey: 'weight_max',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Rate',
                accessorKey: 'rate',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'FSC',
                accessorKey: 'FSC',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'FOV Flat',
                accessorKey: 'FOV_flat',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'FOV Percentage',
                accessorKey: 'FOV_percentage',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'GST',
                accessorKey: 'gst',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },
            {
                header: 'Country',
                accessorKey: 'country',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
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
    return (
        <div className="p-0">
            <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                <h4>
                    International Customer Rate Data
                </h4>
                {
                    isAdmin && <Button
                        color="primary"
                        className='d-flex justify-content-center align-items-center'
                        disabled={RateData.length < 1}
                        onClick={DownloadIntCutomerData}
                        title='Download'
                    >
                        Download
                        <IoMdCloudDownload className="ms-2" style={{ width: "25px", height: "25px" }} />
                    </Button>
                }

            </div>

            <div>
                {
                    (isAdmin && RateData?.length >= 1) &&

                    <div className="d-flex align-items-center">
                        <FormGroup style={{ marginTop: "10px" }}>
                            <Label for="gstUpload">Upload </Label>
                            <Input type="file" id="gstUpload" onChange={UploadINTCustomerOnChange} />
                            {
                                JsonLoading && <Spinner size="sm" className="">
                                    Loading...
                                </Spinner>
                            }

                            <FormText color="muted">Upload  file if available</FormText>
                        </FormGroup>
                        {
                            UploadData.length >= 1 && <Button color="primary" onClick={INT_BulkUpload} className="ms-5 d-flex justify-content-center align-items-center" style={{ height: "2.2rem", width: "5rem" }} >
                                {
                                    BulkINTCustomerUploadLoading ? <Spinner size="sm" className="">
                                        Loading...
                                    </Spinner> : "Upload"
                                }
                            </Button>
                        }


                    </div>
                }
            </div>
            <div className=''>
                {/* <h2>Bookings</h2> */}
                <div className='mt-1'>
                    {
                        IntCustomerDataLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading INT Customer Data Rate ...</p>
                        </div>
                            :
                            <TableContainer
                                columns={columns}
                                data={RateData || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                    }

                </div>
                {/* retuned components */}
                {ReturnComponent(SelectedTitle)}
            </div>
        </div>
    )
}

export default INTCustomerRateDataComp