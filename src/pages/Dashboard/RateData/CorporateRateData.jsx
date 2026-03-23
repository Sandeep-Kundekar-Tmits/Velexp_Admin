import { useEffect, useMemo, useState } from "react"
import { customStyles } from "../../../helpers/CustomStyle"
import Select from "react-select";
import { Button, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../../components/MainHeaderCom";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_ALL_CORPORATE_RATE_DATE, GET_ALL_CUSTOMER_CORPORATE_RATE_DATE, GET_USER_API, UPLOAD_CORPORATE_RATE_DATA } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import { FaFileExcel } from "react-icons/fa";
import { useExcelExport } from "../../../hooks/useExcelExport";
import useExcelParser from "../../../hooks/useExcelParser";
import ToasterProvider from "../../../helpers/ToasterProvider";

const CorporateRateData = () => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [CustomerName, setCustomerName] = useState(null)
    const [AllCorporateRateDatas, setAllCorporateRateDatas] = useState([])
    const [SelectedTypeOfExcel, setSelectedTyOfExcel] = useState(null)
    const [selecetedExcelData, setSelectedExcelData] = useState([])
    const [file, setFile] = useState(null);

    // convert the excel to json hook
    const { parseExcel: ConvertExcleToJson, isLoading: JsonLoading } = useExcelParser();
    //downlaod the excel file hook
    const { exportToExcel: ConvertoEmptyExcel, isExporting: ConvertingEmptyExcelLoading } = useExcelExport();
    //  defining the api to get all customer list
    const { apifunc: GetAllCustomerList, data: CustomerListFromApi, error: getCustomerErr, loading: GetCustomerLoading } = useGetApiCall()
    //  defining the api to get the all corporate rate datas
    const { apifunc: GetAllCorporateRateData, data: AllCorporateRateDataApi, loading: AllCorporateRateDataLoading } = useGetApiCall()
    // defining the get corporate rate Date for the perticular customer
    const { apifunc: GetCustomerCorporateInfo, data: CustomerCorporateInfo, loading: CorporateRateInfoLoading } = usePostApiCall()
    // defining the api to upload the corporate rate data
    const { apifunc: UploadCorporateRateData, data: UploadedCorporateRateData, loading: UploadCorporateRateDataLoading } = usePostApiCall()
    useEffect(() => {
        // calling the get all customer api
        GetAllCustomerList(`${GET_USER_API}/`)
    }, [])

    useEffect(() => {
        //  calling the api to get the all corporate rate data
        if (!CustomerName) {
            GetAllCorporateRateData(GET_ALL_CORPORATE_RATE_DATE)
        }

    }, [CustomerName])



    useEffect(() => {
        if (AllCorporateRateDataApi) {
            setAllCorporateRateDatas(AllCorporateRateDataApi)
        }
        if (CustomerCorporateInfo) {
            setAllCorporateRateDatas(CustomerCorporateInfo)
        }
    }, [AllCorporateRateDataApi, CustomerCorporateInfo])

    //  dropdown cutsomer list
    let CustomerList = useMemo(() => {
        return CustomerListFromApi?.filter(ele => {
            return ele?.cust_type?.type_of_cust === "Corporate"
        })?.map(ele => {
            let name = ele?.customer_name
            return {
                id: ele?.id,
                value: name,
                label: name
            }
        })

    }, CustomerListFromApi)

    const onViewCustomer = () => {
        GetCustomerCorporateInfo(GET_ALL_CUSTOMER_CORPORATE_RATE_DATE, {
            "customer_name": CustomerName?.value
        })
    }

    const UploadChange = async (e) => {
        setFile(e.target.files[0]);
        let file = e.target.files[0];
        console.log(CustomerName?.value, "CustomerName?.value?")
        let Fields = CustomerName?.value?.includes("ASUS") ? [
            "product",
            "shipping_hub",
            "destination_city",
            "destination_state",
            "zone",
            "rate",
            "FSC",
            "gst",
            "docket_charges",
            "expected_delivery_time_in_days",
        ] : [
            "weight_min",
            "weight_max",
            "rate",
            "base_weight_slab",
            "base_weight",
            "base_amount",
            "zone",
            "service_level",
            "product",
            "payment_mode",
            "FSC",
            "FOV_flat",
            "FOV_percentage",
            "gst",
            "expected_delivery_time_in_days",
            "cod_flat",
            "cod_percentage",
            "rto_flat",
            "rto_percentage",
            "appointment_charges",
            "volume_divisor",
            "oda_amount",
            "pickup_charges"
        ]

        let requiredFields = [...Fields]
        let dataOption = {
            titleCell: 'A1',
            dataStartRow: 1,
            caseSensitiveHeaders: false
        };

        let JsonData = await ConvertExcleToJson(file, requiredFields, dataOption);
        if (JsonData.message) {
            alert(JsonData.message);
            return;
        }
        // setUploadedCorporatePincode(JsonData?.data);
        setSelectedExcelData(JsonData?.data)
        console.log(JsonData?.data, "JsonData?.data")
    };


    const UploadRateData = async () => {
        let payload = {
            "customer_name": CustomerName?.value,
            "customer_id": CustomerName?.id || null,
            "rate_data": selecetedExcelData?.map(ele => {
                if (ele?.product === "Surface") {
                    return {
                        ...ele,
                        product: "VELOFREIGHT"
                    }
                }
                else if (ele?.product === "Air") {
                    return {
                        ...ele,
                        product: "VELOSKY"
                    }
                }
                else {
                    return {
                        ...ele
                    }
                }
            })
        };
        let isUploaded = await UploadCorporateRateData(UPLOAD_CORPORATE_RATE_DATA, payload);
        console.log(isUploaded, "isUploaded")
        if (isUploaded?.status === 1) {
            setCustomerName(null)
            setSelectedExcelData([])
            SucceesToaster(isUploaded?.msg)
        }
        else {
            ErrorToaster(isUploaded?.msg || "Upload Failed")
        }

    };

    // download excel file
    const converToExcel = (type) => {
        setSelectedTyOfExcel(type)
        const emptyRow = type?.includes("ASUS")
            ? {
                product: "",
                shipping_hub: "",
                destination_city: "",
                destination_state: "",
                zone: "",
                rate: null,
                FSC: null,
                gst: null,
                docket_charges: null,
                expected_delivery_time_in_days: null,
            }
            : {
                weight_min: null,
                weight_max: null,
                rate: 0,
                base_weight_slab: null,
                base_weight: null,
                base_amount: null,
                zone: "",
                service_level: "",
                product: "",
                payment_mode: "",
                FSC: null,
                FOV_flat: null,
                FOV_percentage: null,
                gst: null,
                expected_delivery_time_in_days: null,
                cod_flat: null,
                cod_percentage: null,
                rto_flat: null,
                rto_percentage: null,
                appointment_charges: null,
                volume_divisor: null,
                oda_amount: null,
                pickup_charges: null,
            };

        const emptyData = [emptyRow];

        ConvertoEmptyExcel(emptyData, `${type?.includes("ASUS") ? "Asus_Rate_data_template" : "Corporate_Rate_data_template"}`,);
    };



    const columns = useMemo(
        () => [
            {
                header: "ID",
                accessorKey: "id",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Customer",
                accessorKey: "customer",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Zone",
                accessorKey: "zone.name",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => row.original?.zone?.name ?? "NA",
            },

            {
                header: "Product",
                accessorKey: "product.name",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => row.original?.product?.name ?? "NA",
            },

            {
                header: "Service Level",
                accessorKey: "service_level.name",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => row.original?.service_level?.name ?? "NA",
            },

            {
                header: "Weight Min",
                accessorKey: "weight_min",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Weight Max",
                accessorKey: "weight_max",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Rate",
                accessorKey: "rate",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Base Weight Slab",
                accessorKey: "base_weight_slab",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Base Weight",
                accessorKey: "base_weight",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Base Amount",
                accessorKey: "base_amount",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "FSC",
                accessorKey: "FSC",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "FOV Flat",
                accessorKey: "FOV_flat",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "FOV %",
                accessorKey: "FOV_percentage",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "GST %",
                accessorKey: "gst",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "COD Flat",
                accessorKey: "cod_flat",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "COD %",
                accessorKey: "cod_percentage",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "RTO Flat",
                accessorKey: "rto_flat",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "RTO %",
                accessorKey: "rto_percentage",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "EDD (Days)",
                accessorKey: "expected_delivery_time_in_days",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },


        ],
        []
    );

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Corporate Rate Data"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <h6 className="text-black fw-bold mb-0 me-2" style={{ fontSize: "14px" }}>Template</h6>
                            {["Default", "ASUS"]?.map((ele) => (
                                <div className="ms-2" key={ele}>
                                    <Button
                                        onClick={() => converToExcel(ele)}
                                        className="d-flex align-items-center justify-content-center p-2 m-auto bg-transparent border-success text-success"
                                        style={{ borderRadius: "7px", width: "100px", fontWeight: "500", fontSize: "12px" }}
                                    >
                                        {(ConvertingEmptyExcelLoading && SelectedTypeOfExcel === ele)
                                            ? <span>Exporting...</span>
                                            : <span>{ele}</span>}
                                        <FaFileExcel size={14} className="ms-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    }
                />
            </div>
            <div className="container-fluid px-3">

                {/* filters */}
                <div className="mainfilter">
                    <Row className=" mt-3 border-bottom">
                        <Col md={4}>
                            <FormGroup className="">
                                <Label>Select Customer</Label>
                                <Select
                                    options={CustomerList}
                                    // isDisabled={selectedPincodeOption?.value === "default"}
                                    placeholder={GetCustomerLoading ? "loading..." : `Search Customer`}
                                    value={CustomerName}
                                    onChange={setCustomerName}
                                    isClearable={true}
                                    styles={customStyles}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4} style={{ marginTop: "28px" }}>
                            <Button
                                className="bg-primary"
                                style={{ width: "50%" }}
                                disabled={!CustomerName}
                                onClick={onViewCustomer}
                            >
                                View
                            </Button>
                        </Col>
                    </Row>
                    {/* <hr /> */}
                    <Row className="  d-flex align-align-items-center my-3">
                        <Col md={4}>
                            <div className="d-flex align-items-center w-100" >
                                <Input type="file" style={{ width: "100%" }} disabled={!CustomerName} onChange={UploadChange} />
                            </div>
                        </Col>
                        <Col md={4}>
                            <Button
                                style={{ width: "50%" }}
                                disabled={!CustomerName || JsonLoading || !file || selecetedExcelData?.length === 0}
                                className="bg-primary text-white d-flex align-items-center justify-content-center"
                                onClick={UploadRateData}
                            >
                                {UploadCorporateRateDataLoading ? "Uploading..." : "Upload"}
                            </Button>
                            {JsonLoading && <Spinner size="sm">loading...</Spinner>}
                        </Col>
                    </Row>
                </div>

                {/* main page */}
                <div className="mainpage mt-1">
                    {(AllCorporateRateDataLoading || CorporateRateInfoLoading)
                        ? <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading Corporate Rate Data ...</p>
                        </div>
                        : <TableContainer
                            columns={columns}
                            data={AllCorporateRateDatas || []}
                            isGlobalFilter={true}
                            isPagination={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            isCustomPageSize={true}
                        />}
                </div>
            </div>
        </div>
    )
}
export default CorporateRateData