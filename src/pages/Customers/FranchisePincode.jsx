import { FaFileExcel } from "react-icons/fa"
import { Button, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap"
import Select from "react-select";
import { useCallback, useEffect, useMemo, useState } from "react";
import { customStyles } from "../../helpers/CustomStyle";
import { useExcelExport } from "../../hooks/useExcelExport";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { DELETE_CUSTOMER_FRANCHISE_PINCODE, DELETE_DEFAULT_FRANCHISE_PINCODE, GET_ALL_FRANCHISE_PINCODE, GET_USER_API, GET_VIEW_FRANCHISE_PINCODES, UPLOAD_FRANCHISE_PINCODE } from "../../api";
import useExcelParser from "../../hooks/useExcelParser";
import TableContainer from "../../components/Table/TableContainer";
import { GridLoader } from "react-spinners";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";
import SimpleModal from "../../components/SimpleModal";
import MainHeaderCom from "../../components/MainHeaderCom";
const FranchisePincode = () => {
    // selected pincode
    const [selectedPincodeOption, setSelectedPincodeOption] = useState(null);
    const [file, setFile] = useState(null)
    // customer name
    const [username, setUsername] = useState(null)
    const [selectedTemplate, setSelectedtemplate] = useState("")
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    const options = [
        { value: "default", label: "Default Pincode" },
        { value: "customer", label: "customer Pincode" },
    ];
    // uploaded data
    const [UploadedFranchisePincode, setUploadedFranchisePincode] = useState([])
    // table display
    const [FranchisePincode, setFranchisePincode] = useState([])
    const [SelectedPincodes, setSelectedPincodes] = useState([])
    const [ShowModel, setShowModel] = useState(false)
    const PINCODE_PREVIEW_LIMIT = 20;
    const [showAllPincodes, setShowAllPincodes] = useState(false);

    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    // donload pincode excel
    const {
        exportToExcel: ExportAllPincodes,
        isExporting: AllPincodeLoading,
        exportProgress
    } = useExcelExport();
    //  convering the exel to json hook
    const { parseExcel: ConvertExcleToJson, isLoading: JsonLoading, } = useExcelParser()
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
    // donwload excle file
    const { exportToExcel: ConvertoEmptyExcel, isExporting: ConvertingEmptyExcelLoading } = useExcelExport()
    // defining the get all pincode listing api
    const { apifunc: GetAllFranchisePincodes, data: FranchisePincodeData, loading: FranchisePincodeDataLoading } = useGetApiCall()
    // upload franchise pincode api
    const { apifunc: UploadFranchisePincode, loading: uploadFranchisePincodeLoading } = usePostApiCall(null)
    // defining the view  franchise pincode
    const { apifunc: GetViewFranchisePincode, data: ViewFranchisePincode, loading: ViewFranchisePincodeloading } = useGetApiCall()
    // defining the api to delete the default pincode
    const { apifunc: DeleteDefaultPincode, data, loading: DeleteDefaultPincodeLoading } = usePostApiCall()
    // defining the api to delete the customer pincode
    const { apifunc: DeleteCustomerPincode, data: DeletedPincodes, loading: DeleteCustomerPincodeLoading } = usePostApiCall()
    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        // calling the get franchise pincode api
        GetAllFranchisePincodes(GET_ALL_FRANCHISE_PINCODE)
    }, [])

    useEffect(() => {
        if (UserList?.length > 0) {
            console.log(UserList, "UserList");

            const updatedOptions = UserList
                .filter((ele) => {
                    const name = ele?.customer_name?.trim?.(); // safe check before trimming
                    return (
                        !!name &&                          // ensures name is truthy after trim
                        name.toLowerCase() !== "null" &&   // filters out "null" string
                        name.toLowerCase() !== "undefined" && // filters out "undefined" string
                        ele?.cust_type?.type_of_cust === "Franchise"
                    );
                })
                .map((ele) => ({
                    id: ele?.id,
                    value: ele.customer_name,
                    label: ele.customer_name,
                }));

            setUserListOption(updatedOptions);
        }


        if (FranchisePincodeData) {
            setFranchisePincode(FranchisePincodeData?.default_pincodes)
        }
    }, [UserList, FranchisePincodeData]);

    const UploadChange = async (e) => {
        setFile(e.target.files[0])
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
        setUploadedFranchisePincode(JsonData?.data)
        console.log(JsonData, "updatedData")

    }

    //upload pincode
    const UploadPincode = async () => {
        let payload = {
            "pincode_type": selectedPincodeOption?.value,  // or "customer"
            "customer_name": username?.value || null,  //None or "" if not selected
            "customer_id": username?.id || null,  //0 is not selected
            "pincode_data": UploadedFranchisePincode
        }
        console.log(payload, "payload")
        let isUploaded = await UploadFranchisePincode(UPLOAD_FRANCHISE_PINCODE, payload)
        if (isUploaded?.status === 1) {
            setUploadedFranchisePincode([])
            setUsername(null)
            setSelectedPincodeOption(null)
            SucceesToaster("Franchise Pincode uploaded Successfully")
        }
        else {
            ErrorToaster("something went wrong")
        }
    }

    // on view customer
    const onViewCustomer = async () => {
        let ViewFrachisePinCode = await GetViewFranchisePincode(`${GET_VIEW_FRANCHISE_PINCODES}?customer_name=${username?.value}`)
        if (ViewFrachisePinCode) {
            setFranchisePincode(ViewFrachisePinCode)
        }
    }

    // convert to excel
    const converToExcel = (type) => {
        console.log(type, "type")
        const emptyData = [
            {
                ...(type === "customer" && { customer: "" }),
                pincode: "",
                area: "",
                region: "",
                district: "",
                state: "",
                zone: "",
                document: "",
                secured_document: "",
                ecommerce: "",
                parcels: "",
                pickup_only: "",
                oda: "",
                cod: "",
                is_metro: "",
                is_active: "",
            },
        ];

        ConvertoEmptyExcel(emptyData, "Franchise_pincode_template");
    };
    // on checkbox click
    const onSingleCheckBoxClick = useCallback((data, e) => {
        const checked = e.target.checked;

        setFranchisePincode(prev =>
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
        setFranchisePincode(prev => {
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
        let isCustomerSelected = username !== null
        let selectedPincodesAtrr = [...SelectedPincodes.map(ele => ele?.pincode)]
        if (isCustomerSelected) {
            let isDeleted = await DeleteCustomerPincode(DELETE_CUSTOMER_FRANCHISE_PINCODE, {
                "customer_id": username?.id,
                "pincode_list": [...selectedPincodesAtrr]
            })
            if (isDeleted?.status === "success") {
                SucceesToaster(isDeleted?.message)
                setShowModel(false)
                GetAllCorporatePincodes(GET_ALL_CORPORATE_PINCODE);
                setUsername(null)
                setSelectedPincodes([])
            }
            else {
                ErrorToaster(isDeleted?.message)
            }

            // console.log({
            //     "customer_id": username?.id,
            //     "pincode_list": [...selectedPincodesAtrr]
            // })

            console.log(isDeleted, "is Deleted")
        }
        else {
            //  if the customer is not selected
            let isDeleted = await DeleteDefaultPincode(DELETE_DEFAULT_FRANCHISE_PINCODE, {
                "pincode_list": [...selectedPincodesAtrr]
            })
            if (isDeleted?.status === "success") {
                SucceesToaster(isDeleted?.message)
                setShowModel(false)
                GetAllCorporatePincodes(GET_ALL_CORPORATE_PINCODE);
                setUsername(null)
                setSelectedPincodes([])
            }
            else {
                ErrorToaster(isDeleted?.message)
            }

        }
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
                { key: 'document', header: 'Doc' },
                { key: 'secured_document', header: 'Sec. Doc' },
                { key: 'ecommerce', header: 'Ecomm' },
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



    const DownloadPincodes = () => {
        if (!Array.isArray(FranchisePincode) || FranchisePincode.length === 0) {
            alert("No data available");
            return;
        }

        const data = FranchisePincode?.map(ele => {
            let { id, ...other } = ele
            return other
        })
        ExportAllPincodes(data, "Franchise_Pincode");
    };
    return (
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderCom
                    title="Franchise Pincode"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <h6 className="text-black fw-bold mb-0 me-2" style={{ fontSize: "14px" }}>Template</h6>
                            {
                                ["Deafult", "Customer"]?.map((ele, index) => {
                                    return (
                                        <div className="ms-2" key={index}>
                                            <Button
                                                onClick={() => {
                                                    setSelectedtemplate(ele)
                                                    converToExcel(ele === "Customer" ? "customer" : "")
                                                }}
                                                className="d-flex align-items-center justify-content-center p-2 m-auto bg-transparent border-success text-success"
                                                style={{
                                                    borderRadius: "7px",
                                                    width: "100px",
                                                    fontWeight: "500",
                                                    fontSize: "12px"
                                                }}
                                            >
                                                {
                                                    (ConvertingEmptyExcelLoading && selectedTemplate === ele) ?
                                                        <span className="me-0">Exporting...</span> :
                                                        <span className="me-0">{ele}</span>
                                                }
                                                <FaFileExcel size={14} className="ms-1" />
                                            </Button>

                                        </div>
                                    )
                                })
                            }
                        </div>
                    }
                />
            </div>
            <div className="container-fluid mt-3">
                {/* end heading */}
                {/* filter */}
                <Row className=" mt-3">
                    <Col md={4}>
                        <FormGroup className="mb-2">
                            <Label for="Customer">Select Customer</Label>
                            <Select options={UserListOptions}
                                isDisabled={selectedPincodeOption?.value === "default"}
                                placeholder="Search Customer"
                                value={username}
                                onChange={setUsername}
                                isClearable={true}
                                styles={customStyles} />
                        </FormGroup>
                    </Col>
                    <Col md={4} style={{ marginTop: "28px" }}>
                        <Button className="bg-primary" style={{ width: "50%" }} disabled={!username} onClick={onViewCustomer}>View</Button>
                    </Col>
                </Row>
                <Row>
                    <Col md={4} >
                        <FormGroup className="mb-2">
                            <Label>Select Pincode Type</Label>
                            <Select
                                options={options}
                                value={selectedPincodeOption}
                                onChange={(selected) => setSelectedPincodeOption(selected)}
                                placeholder="Select Pincode Type"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>

                    <Col md={4}>
                        <div className="d-flex align-items-center w-100" style={{ marginTop: "28px" }}>
                            {/*  upload file */}
                            <Input type="file" style={{ width: "100%" }} onChange={UploadChange} />
                        </div>
                        {/* <small className="text-muted">Select Pincode Type And Customer</small> */}
                    </Col>
                    <Col md={4}>
                        {
                            <Button
                                style={{ marginTop: "28px", width: "50%" }}
                                disabled={
                                    // Disable if NO pincodes uploaded
                                    (UploadedFranchisePincode?.length ?? 0) < 1 ||
                                    (!file) ||
                                    // Disable if selected option is "customer" but username is missing
                                    (selectedPincodeOption?.value !== "default" && !username)
                                } className="bg-primary text-white d-flex align-items-center text-center justify-content-center" onClick={UploadPincode} >{
                                    uploadFranchisePincodeLoading ?
                                        <span className="me-2">Uploading...</span> :
                                        <span className="me-2">Upload</span>
                                }</Button>
                        }
                        {
                            JsonLoading &&
                            <Spinner size="sm">loading...</Spinner>
                        }
                    </Col>
                </Row>

                <div className=''>

                    <div className='mt-1'>
                        {
                            (FranchisePincodeDataLoading || ViewFranchisePincodeloading) ? <div style={{ height: "40vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                                <GridLoader size={20} />
                                <p className="mt-5 h5">Loading Franchise Pincode ...</p>
                            </div>
                                :
                                <TableContainer
                                    columns={columns}
                                    isDownloadExcle={true}
                                    onDownloadExcle={DownloadPincodes}
                                    ExcleLoading={AllPincodeLoading}
                                    data={FranchisePincode || []}
                                    isGlobalFilter={true}
                                    isPagination={true}
                                    extraFiled={(FranchisePincode?.length > 0 && SelectedPincodes?.length > 0) && <button
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
                                <p className="fw-bold mb-2">
                                    {username !== null
                                        ? `For customer "${username.label}", the following pincodes will be deleted:`
                                        : "The following default pincodes will be deleted:"}
                                </p>

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
                                    {username ? ` for "${username.value}"` : ""}?
                                </p>

                            </div>

                        </SimpleModal>
                    }
                </div>
            </div>
        </div>
    )
}
export default FranchisePincode