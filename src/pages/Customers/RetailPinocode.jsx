import { Button, Input, Label, Spinner } from "@/components/ui"
import TableContainer from "../../components/Table/TableContainer"
import { FaFileExcel } from "react-icons/fa"
import useExcelParser from "../../hooks/useExcelParser"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useExcelExport } from "../../hooks/useExcelExport"
import { useGetApiCall } from "../../hooks/useGetApiCall"
import Loader from "@/Loaders/Loader";
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
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderCom
                title="Retail Pincode"
                extraFields={
                    <div className="flex items-center">
                        <h6 className="text-ink font-bold mb-0 mr-2" style={{ fontSize: "14px" }}>Template</h6>
                        <Button
                            // disabled={data.length < 1}
                            onClick={converToExcel}
                            className="table-action-btn table-action-btn-solid"
                        >
                            {ConvertingEmptyExcelLoading ? <span>Exporting...</span> : <span>Download</span>}
                            <FaFileExcel size={14} aria-hidden="true" />
                        </Button>
                    </div>
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">
                            Upload File
                        </Label>
                        <Input type="file" onChange={UploadChange} />
                    </div>

                    {RetailPincodeExcelData?.length >= 1 && (
                        <Button onClick={UploadPincode} className="table-action-btn table-action-btn-primary">
                            {UploadPincodeLoading ? "Uploading..." : "Upload"}
                        </Button>
                    )}

                    {JsonLoading && <Spinner size="sm">loading...</Spinner>}
                </div>

                <div className="page-fit-body mt-4">
                    {
                        PincodeDataLoading ? <Loader message="Loading Pincodes ..." fullscreen={false} />
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
                                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                                theadClass="sticky top-0 z-10"
                                isStickyHeader={true}
                                stickyTop={0}
                                isCustomPageSize={true}
                                fillHeight
                                tableHeight="65vh"
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
                                <div className="flex flex-wrap gap-2">
                                    {visiblePincodes.map(item => (
                                        <span
                                            key={item.id}
                                            className="badge bg-canvas text-ink border px-2 py-1"
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


                            <p className="font-semibold text-danger-500">
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