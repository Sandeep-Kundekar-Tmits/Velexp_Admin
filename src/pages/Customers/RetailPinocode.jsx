import { Button, Input, Spinner } from "reactstrap"
import TableContainer from "../../components/Table/TableContainer"
import { FaFileExcel } from "react-icons/fa"
import useExcelParser from "../../hooks/useExcelParser"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useExcelExport } from "../../hooks/useExcelExport"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import { GridLoader } from "react-spinners"
import { DELETE_RETAIL_PINCODE, GET_ALL_PICKUP_PINCODES, UPLOAD_PINCODES } from "../../api"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"
import SimpleModal from "../../components/SimpleModal"
import MainHeaderCom from "../../components/MainHeaderCom"

const RetailPincode = () => {
    const [RetailPincodeExcelData, setRetailPincodeExcelData] = useState([])
    const { ErrorToaster } = ToasterProvider()
    const [SelectedPincodes, setSelectedPincodes] = useState([])
    const [Pincodes, setPincodes] = useState([])
    const [ShowModel, setShowModel] = useState(false)
    const PINCODE_PREVIEW_LIMIT = 20;
    const [showAllPincodes, setShowAllPincodes] = useState(false);
    // donload pincode excel
    const {
        exportToExcel: ExportAllPincodes,
        isExporting: AllPincodeLoading,
        exportProgress
    } = useExcelExport();
    //  convering the exel to json hook
    const { parseExcel: ConvertExcleToJson, isLoading: JsonLoading, } = useExcelParser()
    // donwload excle file
    const { exportToExcel: ConvertoEmptyExcel, isExporting: ConvertingEmptyExcelLoading } = useExcelExport()
    // defining the get all pincode listing api
    const { apifunc: GetAllPincodes, data: PincodeData, loading: PincodeDataLoading } = useGetApiCall()
    // defining the api to upload the pincode
    const { apifunc: UploadPincodeFile, loading: UploadPincodeLoading } = usePostApiCall(null, "Pincode Uploaded Successfully")
    // defining the api to delete the default pincode
    const { apifunc: DeleteDefaultPincode, data, loading: DeleteDefaultPincodeLoading } = usePostApiCall()
    // calling the get all pincode apis
    useEffect(() => {
        GetAllPincodes(GET_ALL_PICKUP_PINCODES)
    }, [])

    useEffect(() => {
        if (PincodeData) {
            setPincodes(PincodeData?.pincodes)
        }

    }, [PincodeData])
    //  upload file
    const UploadChange = async (e) => {
        let file = e.target.files[0]
        let requiredFields = [
            "pincode",
            "area",
            "region",
            "district",
            "state",
            "zone",
            "document",
            "secured_document",
            "parcels",
            "pickup_only",
            "oda",
            "cod",
            "service_provider",
            "is_metro",
            "is_active"
        ]
        let dataOption = {
            titleCell: 'A1',
            dataStartRow: 1, // 0-indexed
            caseSensitiveHeaders: false
        }

        let JsonData = await ConvertExcleToJson(file, requiredFields, dataOption)
        if (JsonData.message) {
            alert(JsonData.message)
            return
        }
        // updated data
        setRetailPincodeExcelData(JsonData?.data)
        console.log(JsonData, "updatedData")

    }

    //  API CALL
    const UploadPincode = async () => {
        let isUploaded = await UploadPincodeFile(UPLOAD_PINCODES, { pincode_data: RetailPincodeExcelData })
        if (isUploaded?.status === 1) {
            setRetailPincodeExcelData([])
        }
        else {
            ErrorToaster("something went wrong")
        }
    }

    // convert to excel
    const converToExcel = () => {
        const emptyData = [
            {
                pincode: "",
                area: "",
                region: "",
                district: "",
                state: "",
                zone: "",
                document: "",
                secured_document: "",
                service_provider: "",
                ecommerce: "",
                parcels: "",
                pickup_only: "",
                oda: "",
                cod: "",
                is_metro: "",
                is_active: "",
            },
        ];

        ConvertoEmptyExcel(emptyData, "Retail_pincode_template");
    }
    const columns = useMemo(
        () => [
            {
                id: 'select',
                header: () => (
                    <input
                        type="checkbox"
                        style={{ cursor: "pointer" }}
                        onChange={OnAllSelect}

                    // checked={
                    //     CorporatePincode.length > 0 &&
                    //     CorporatePincode.every(item => item.isChecked)
                    // }
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        style={{ cursor: "pointer" }}
                        checked={row?.original?.isChecked}
                        onChange={(e) => {
                            onSingleCheckBoxClick(row.original, e)
                        }}
                    />
                ),
                enableSorting: false,
                enableColumnFilter: false,
                size: 40,
            },
            {
                header: 'Pincode',
                accessorKey: 'pincode',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Area',
                accessorKey: 'area',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Region',
                accessorKey: 'region',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'District',
                accessorKey: 'district',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'State',
                accessorKey: 'state',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Zone',
                accessorKey: 'zone',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Service Provider',
                accessorKey: 'service_provider',
                enableColumnFilter: false,
                enableSorting: true,
            },

            // ✅ Boolean columns start here
            ...[
                { key: 'document', header: 'Document' },
                { key: 'secured_document', header: 'Secured Document' },
                { key: 'ecommerce', header: 'E-commerce' },
                { key: 'parcels', header: 'Parcels' },
                { key: 'pickup_only', header: 'Pickup Only' },
                { key: 'oda', header: 'ODA' },
                { key: 'cod', header: 'COD' },
                { key: 'is_metro', header: 'Is Metro' },
                { key: 'is_active', header: 'Is Active' },
            ].map(({ key, header }) => ({
                header,
                accessorKey: key,
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => (getValue() === true ? '✔️' : '❌'),
            })),
        ],
        []
    );

    // on checkbox click
    const onSingleCheckBoxClick = useCallback((data, e) => {
        const checked = e.target.checked;

        setPincodes(prev =>
            prev.map(item =>
                item.id === data.id
                    ? { ...item, isChecked: checked }
                    : item
            )
        );

        setSelectedPincodes(prev =>
            checked
                ? [...prev, data]
                : prev.filter(item => item.id !== data.id)
        );
    }, []);

    //  on all select
    const OnAllSelect = useCallback((e) => {
        const checked = e.target.checked;
        setPincodes(prev => {
            const updated = prev.map(item => ({
                ...item,
                isChecked: checked
            }));
            setSelectedPincodes(checked ? updated : []);
            return updated;
        });
    }, [])

    const handlePincodeDelete = () => {
        // enabling the popup model
        setShowModel(true)
    }
    const visiblePincodes = useMemo(
        () =>
            showAllPincodes
                ? SelectedPincodes
                : SelectedPincodes.slice(0, PINCODE_PREVIEW_LIMIT),
        [showAllPincodes, SelectedPincodes]
    );
    const onDeletePincodeClick = async () => {
        let selectedPincodesAtrr = [...SelectedPincodes.map(ele => ele?.pincode)]

        //  if the customer is not selected
        let isDeleted = await DeleteDefaultPincode(DELETE_RETAIL_PINCODE, {
            "pincode_list": [...selectedPincodesAtrr]
        })
        if (isDeleted?.status === "success") {
            SucceesToaster(isDeleted?.message)
            setShowModel(false)
            GetAllPincodes(GET_ALL_PICKUP_PINCODES)
            setSelectedPincodes([])
        }
        else {
            ErrorToaster(isDeleted?.message)
        }

    }

    const DownloadPincodes = () => {
        if (!Array.isArray(Pincodes) || Pincodes.length === 0) {
            alert("No data available");
            return;
        }

        const data = Pincodes?.map(ele => {
            let { id, ...other } = ele
            return other
        })
        ExportAllPincodes(data, "Retail_Pincode");
    };

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderCom
                    title="Retail Pincode"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <h6 className="text-black fw-bold mb-0 me-2" style={{ fontSize: "14px" }}>Template</h6>
                            <Button
                                // disabled={data.length < 1}
                                onClick={converToExcel}
                                className="d-flex align-items-center px-2 bg-transparent border-success text-success"
                                style={{
                                    borderRadius: "7px",
                                    fontWeight: "500",
                                    fontSize: "12px",
                                    height: "35px"
                                }}
                            >
                                {
                                    ConvertingEmptyExcelLoading ? <span className="me-2">Exporting...</span> : <span className="me-2">Download</span>
                                }
                                <FaFileExcel size={14} className="me-1" />
                            </Button>
                        </div>
                    }
                />
            </div>
            <div className="container-fluid mt-3">
                <div className="d-flex pb-3 border-bottom justify-content-between align-items-center">
                    <div className="d-flex align-items-center me-auto">
                        {/* <h2 className="">Retail Pincode</h2> */}
                        <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center me-2">
                                {/*  upload file */}
                                <Input type="file" onChange={UploadChange} style={{ width: "250px" }} />
                                {
                                    RetailPincodeExcelData?.length >= 1 && <Button onClick={UploadPincode} className="bg-primary text-white ms-2 d-flex align-items-center">{
                                        UploadPincodeLoading ? <span className="me-2">Uploading...</span> : <span className="me-2">Upload</span>
                                    }</Button>
                                }
                            </div>
                            <div>
                                {
                                    JsonLoading && <Spinner size="sm">loading...</Spinner>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className=' px-2'>

                <div className='mt-1'>
                    {
                        PincodeDataLoading ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading Pincodes ...</p>
                        </div>
                            :
                            <TableContainer
                                columns={columns}
                                onDownloadExcle={DownloadPincodes}
                                isDownloadExcle={true}
                                ExcleLoading={AllPincodeLoading}
                                data={Pincodes || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                extraFiled={(Pincodes?.length > 0 && SelectedPincodes?.length > 0) && <button
                                    type="button"
                                    onClick={() => handlePincodeDelete(SelectedPincodes)}
                                    className="btn btn-danger"
                                >
                                    ({SelectedPincodes?.length}) Delete
                                </button>}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                                isCustomPageSize={true}
                            // isDownloadExcle={true}
                            // onDownloadExcle={DownloadPerformanceDetails}
                            // ExcleLoading={isExporting}
                            />
                    }
                </div>
                {
                    <SimpleModal
                        isOpen={ShowModel}
                        setIsOpen={setShowModel}
                        onCancel={() => {
                            setShowModel(false);
                            setShowAllPincodes(false); // reset
                        }}
                        successButtonName="Delete"
                        onSuccess={onDeletePincodeClick}
                    >
                        <div>

                            {/* Scrollable flex container */}
                            <div
                                style={{
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "6px",
                                    padding: "8px"
                                }}
                            >
                                <div className="d-flex flex-wrap gap-2">
                                    {visiblePincodes.map(item => (
                                        <span
                                            key={item.id}
                                            className="badge bg-light text-dark border px-2 py-1"
                                            style={{ fontSize: "0.85rem" }}
                                        >
                                            {item.pincode}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* View More / Less */}
                            {SelectedPincodes.length > PINCODE_PREVIEW_LIMIT && (
                                <div className="text-center mt-2">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => setShowAllPincodes(prev => !prev)}
                                    >
                                        {showAllPincodes
                                            ? "View less"
                                            : `View all (${SelectedPincodes.length})`}
                                    </button>
                                </div>
                            )}


                            <p className="fw-semibold text-danger">
                                Are you sure you want to delete pincodes

                            </p>

                        </div>

                    </SimpleModal>
                }
            </div>
        </div>
    )
}
export default RetailPincode