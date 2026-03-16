import { useEffect, useMemo, useState } from "react"
import Select from "react-select";
import { Button, Col, FormGroup, Input, Label, Row, Spinner } from "reactstrap";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { GET_ALL_RETAIL_RATE_DATA, UPLOAD_REATIL_RATE_DATA } from "../../../api";
import TableContainer from "../../../components/Table/TableContainer";
import { FaFileExcel } from "react-icons/fa";
import useExcelParser from "../../../hooks/useExcelParser";
import { useExcelExport } from "../../../hooks/useExcelExport";
import ToasterProvider from "../../../helpers/ToasterProvider";
import usePostApiCall from "../../../hooks/usePostApiCall";

const RetailRateData = () => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const [AllRetailRateDatas, SetAllRetailRateDatas] = useState([])
    const [selecetedExcelData, setSelectedExcelData] = useState([])
    const [file, setFile] = useState(null);

    // convert the excel to json hook
    const { parseExcel: ConvertExcleToJson, isLoading: JsonLoading } = useExcelParser();
    //downlaod the excel file hook
    const { exportToExcel: ConvertoEmptyExcel, isExporting: ConvertingEmptyExcelLoading } = useExcelExport();
    // defining the api to get all the retail all rate datas
    const { apifunc: GetAllRetailRateData, data: AllApiRetailRateData, loading: AllRateDataLoading } = useGetApiCall()
    // defining the api to upload the retail rate data
    const { apifunc: UploadReatilRateData, data: UploadedReatilRateData, loading: UploadReatilRateDataLoading } = usePostApiCall()
    useEffect(() => {
        // calling the get all retail rate data api
        GetAllRetailRateData(GET_ALL_RETAIL_RATE_DATA)
    }, [])

    useEffect(() => {
        if (AllApiRetailRateData) {
            SetAllRetailRateDatas(AllApiRetailRateData)
        }
    }, [AllApiRetailRateData])

    const UploadChange = async (e) => {
        setFile(e.target.files[0]);
        let file = e.target.files[0];
        let Fields = [
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

    // download excel file
    const converToExcel = (type) => {
        const RequiredList = [{
            "weight_min": null,
            "weight_max": null,
            "rate": null,
            "base_weight_slab": null,
            "base_weight": null,
            "base_amount": null,
            "zone": "",
            "service_level": "",
            "product": "",
            "payment_mode": "",
            "FSC": null,
            "FOV_flat": null,
            "FOV_percentage": null,
            "gst": null,
            "expected_delivery_time_in_days": null,
            "oda_amount": null,
            "pickup_charges": null
        }];

        ConvertoEmptyExcel(RequiredList, "Retail_Rate_data_template",);
    };

    const UploadRateData = async () => {
        let isUploaded = await UploadReatilRateData(UPLOAD_REATIL_RATE_DATA, selecetedExcelData);
        console.log(isUploaded, "isUploaded")
        if (isUploaded?.status === 1) {
            setSelectedExcelData([])
            SucceesToaster(isUploaded?.msg)
        }
        else {
            ErrorToaster(isUploaded?.msg || "Upload Failed")
        }

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
                header: "ODA Amount",
                accessorKey: "oda_amount",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "NA",
            },

            {
                header: "Pickup Charges",
                accessorKey: "pickup_charges",
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
        <div className='page-content py-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Retail Rate Data"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <h6 className="text-black fw-bold mb-0 me-2" style={{ fontSize: "14px" }}>Template</h6>
                            {["Default"]?.map((ele) => (
                                <div className="ms-2" key={ele}>
                                    <Button
                                        onClick={converToExcel}
                                        className="d-flex align-items-center justify-content-center p-2 m-auto bg-transparent border-success text-success"
                                        style={{ borderRadius: "7px", width: "100px", fontWeight: "500", fontSize: "12px" }}
                                    >
                                        {ConvertingEmptyExcelLoading
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
            <div className="container-fluid">

                {/* filters */}
                <Row className="  d-flex align-align-items-center my-3">
                    <Col md={4}>
                        <div className="d-flex align-items-center w-100" >
                            <Input type="file" style={{ width: "100%" }} onChange={UploadChange}
                            />
                        </div>
                    </Col>
                    <Col md={4}>
                        <Button
                            style={{ width: "50%" }}
                            disabled={JsonLoading || !file || selecetedExcelData?.length === 0}
                            className="bg-primary text-white d-flex align-items-center justify-content-center"
                            onClick={UploadRateData}
                        >
                            {UploadReatilRateDataLoading ? "Uploading..." : "Upload"}
                        </Button>
                        {JsonLoading && <Spinner size="sm">loading...</Spinner>}
                    </Col>
                </Row>


                {/* main page */}
                <div className="mainpage mt-3">
                    {AllRateDataLoading
                        ? <div style={{ height: "40vh" }} className="container-fluid d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading Retail Rate Data ...</p>
                        </div>
                        : <TableContainer
                            columns={columns}
                            data={AllRetailRateDatas || []}
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
export default RetailRateData