import { useEffect, useMemo, useState } from "react"
import { checkCustomerPermissions } from "../../../helpers/checkCustomerPermissions"
import useExcelParser from "../../../hooks/useExcelParser"
import usePostApiCall from "../../../hooks/usePostApiCall"
import { useGetApiCall } from "../../../hooks/useGetApiCall"
import { useDeleteApiCall } from "../../../hooks/useDeleteApiCall"
import { DEFAULT_RATE_DATA, DEFAULT_RATE_DATA_BUILK_UPLOAD } from "../../../api"
import { Button, FormGroup, FormText, Input, Label, Spinner } from "reactstrap"
import { IoMdCloudDownload } from "react-icons/io"
import { GridLoader } from "react-spinners"
import TableContainer from "../../Table/TableContainer"

const INTDefaultRateData = () => {
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
    const { apifunc: BulkINTDefaultRateDataUploadFunc, loading: BulkINTDefaultRateDataUploadLoading } = usePostApiCall(null, "Uploaded Successfully")
    // defining the int customer rate data get api
    const { apifunc: GetIntDefaultRateData, loading: IntDefaultRateDataLoading, data: IntDefaultRateData, } = useGetApiCall()
    // defining the delete api
    const { apifunc: DeleteInt_DefaultRateData, loading: DeleteLoading } = useDeleteApiCall()

    useEffect(() => {
        // checking the admin auth
        if (canAddPod && canCreateReport && canCreateUser) {
            setIsAdmin(true)
        }
        else {
            setIsAdmin(false)
        }

        //  calling the int Default get rate data api
        GetIntDefaultRateData(DEFAULT_RATE_DATA)
    }, [])

    useEffect(() => {
        if (IntDefaultRateData) {
            setRateData(IntDefaultRateData)
        }
    }, [IntDefaultRateData])

    //  onchange function on the upload file
    const UploadINTCustomerOnChange = async (e) => {
        let file = e.target.files[0]
        let requiredFields = [
            'ID',
            'Customer Name',
            'Country Code',
            'Service Code',
            'Vendor',
            'Weight Min',
            'Weight Max',
            'Rate',
            'FSC',
            'FOV Flat',
            'FOV Percentage',
            'GST',
            'Country'
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
            "id": ele?.ID,
            "customer": ele["Customer Name"],
            "country_code": ele["Country Code"],
            "service_code": ele["Service Code"],
            "vendor": ele?.Vendor,
            "weight_min": ele["Weight Min"],
            "weight_max": ele["Weight Max"],
            "rate": ele?.Rate,
            "FSC": ele?.FSC,
            "FOV_flat": ele["FOV Flat"],
            "FOV_percentage": ele["FOV Percentage"],
            "gst": ele["GST"],
            "country_id": ele?.Country
        }));

        console.log(updatedData, "data")
        setUploadData(updatedData)

    }


    // upload function
    const INT_BulkUpload = async () => {
        // calling the asus bulk upload api
        const uploaded = await BulkINTDefaultRateDataUploadFunc(DEFAULT_RATE_DATA_BUILK_UPLOAD, UploadData)
        if (uploaded.status === "updated") {
            setUploadData([])
        }
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
                    International Defalut Rate Data
                </h4>
                {
                    isAdmin && <Button
                        color="primary"
                        className='d-flex justify-content-center align-items-center'
                        disabled={RateData.length < 1}
                        // onClick={DownloadIntCutomerData}
                        title='Download'
                    >
                        Download
                        <IoMdCloudDownload className="ms-2" style={{ width: "25px", height: "25px" }} />
                    </Button>
                }

            </div>

            <div>
                {
                    // (isAdmin && RateData?.length >= 1) &&

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
                                    BulkINTDefaultRateDataUploadLoading ? <Spinner size="sm" className="">
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
                        IntDefaultRateDataLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading INT Default Data Rate ...</p>
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
                {/* {ReturnComponent(SelectedTitle)} */}
            </div>
        </div>
    )
}


export default INTDefaultRateData