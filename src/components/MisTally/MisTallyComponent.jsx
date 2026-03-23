import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Col, FormGroup, FormText, Input, Label, Row, Spinner } from "reactstrap"
import TableContainer from "../Table/TableContainer";
import usePostApiCall from "../../hooks/usePostApiCall";
import useExcelParser from "../../hooks/useExcelParser";
import { GET_MIS_OPS_DATA, GET_MIS_TALLY, GET_MIS_TALLY_FILTER_DATA, GET_MIS_TALLY_MAIN, UPLOAD_MIS_TALLY } from "../../api";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GridLoader } from "react-spinners";
import { FaRegEye } from "react-icons/fa";
import MisTallyViewModel from "./MisTallyViewModel";
import MisTallyFilter from "./MisTallyFilter";
import StatsCard from "../StatsCard";
import MainHeaderComp from "../MainHeaderCom";

function excelSerialToDate(serial) {
    // Excel's date system starts from January 1, 1900 (with a bug treating 1900 as a leap year)
    const excelEpoch = new Date(1899, 11, 31); // Dec 31, 1899 (since months are 0-indexed)
    const daysToAdd = serial - 1; // Subtract 1 to adjust for Excel's leap year bug (Feb 29, 1900)

    const resultDate = new Date(excelEpoch);
    resultDate.setDate(resultDate.getDate() + daysToAdd);

    return resultDate;
}
const MisTallyComponent = () => {
    // for showing popups
    const [SelectedTitle, setSelectedTitle] = useState("")
    const [ShowMisData, setShowMisData] = useState(false)
    // selectd Info of the cost service center
    const [SelectedInfo, setSelectedInfo] = useState(null)
    // state to check data filtered or not
    const [IsFilterd, setIsFiltered] = useState(false)
    const [MISData, setMisData] = useState([
        { key: "total_v_code_count", value: 0, label: "V Code Count", groupId: 1, mainKey: "Count", commanKey: "V Code" },
        { key: "total_v_code_delivered", value: 0, label: "V Code Delivered", groupId: 1, mainKey: "Delivered", commanKey: "V Code" },

        { key: "total_dsa_count", value: 0, label: "DSA Count", groupId: 2, mainKey: "Count", commanKey: "DSA" },
        { key: "total_dsa_delivered", value: 0, label: "DSA Delivered", groupId: 2, mainKey: "Delivered", commanKey: "DSA" },

        { key: "total_dv_count", value: 0, label: "DV Count", groupId: 3, mainKey: "Count", commanKey: "DV" },
        { key: "total_dv_delivered", value: 0, label: "DV Delivered", groupId: 3, mainKey: "Delivered", commanKey: "DV" },

        { key: "total_c_code_count", value: 0, label: "C Code Count", groupId: 4, mainKey: "Count", commanKey: "C Code" },
        { key: "total_c_code_delivered", value: 0, label: "C Code Delivered", groupId: 4, mainKey: "Delivered", commanKey: "C Code" },

        { key: "total_intl_pickup_count", value: 0, label: "Total Intl Pickup Count" },
        { key: "total_pincode_servicing", value: 0, label: "Pincode Servicing" },
        { key: "total_shipped_pincode_count", value: 0, label: "Shipped Pincode Count" },
    ]);


    const columns = useMemo(() => [
        {
            header: 'Title',
            accessorKey: 'title',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ row, getValue }) => {
                const title = getValue();
                return (
                    <div className="">
                        <span
                            className=""
                            style={{ cursor: "pointer", color: "blue" }}
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default if using React Router
                                handleTitleClick(row.original); // Custom click handler
                            }}
                        >
                            {title || "--"}
                        </span>

                    </div>
                );
            },
        },
        {
            header: 'Total Debit',
            accessorKey: 'total_debit',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => {
                const value = getValue();
                return typeof value === 'number' ? value.toFixed(2) : "NA";
            },
        },
        {
            header: 'Total Credit',
            accessorKey: 'total_credit',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue(),
        },
    ], []);

    const handleTitleClick = (rowData) => {
        const { title, region, cost_service_center } = rowData
        const data = new Date()
        let payload = {
            "title": title,
            "month": data.getMonth(),
            "year": data?.getFullYear(),
            "region": region,
            "cost_service_center": cost_service_center
        }
        setSelectedInfo((prev) => {
            return {
                ...prev,
                title: title
            }
        })

        // else {
        //     console.log("not filtered", IsFilterd)
        //     setSelectedInfo(payload)
        // }
        setSelectedTitle("View_MisTally")


    };


    // definging the get Mis grouped data api
    const { apifunc: GetMISGroupedDataFunc, data: MISGroupedInfo, loading: MISGroupedDataLoading } = usePostApiCall()
    // defining the get all mis data
    const { apifunc: GetMISData, data: MisData } = usePostApiCall()
    // definging the get MIS get api
    const { apifunc: GetMISDataFunc, data: MISInfo, loading: MISDataLoading } = useGetApiCall()
    //  convering the exel to json hook
    const { parseExcel: ConvertExcleToJson, isLoading: JsonLoading } = useExcelParser()
    // defining the asus bulk upload api
    const { apifunc: BulkMISUploadFunc, loading: MISBulkUpoadLoading } = usePostApiCall(null, "Uploaded Successfully")
    // downloaded json data
    const [MISJsondata, setMISJsonData] = useState([])
    // Mis Display data
    const [MISDisplayData, setMISDisplayData] = useState([])
    const [RecallInfo, setReacallInfo] = useState(null)
    // onchange
    const UploadMISOnChange = async (e) => {
        let file = e.target.files[0]
        let requiredFields = [
            "Date",
            "Particulars",
            "Customer name",
            "Vch Type",
            "Vch No.",
            "Debit",
            "Credit",
            "Region",
            "Cost Centre"
        ]
        //  first getting the  a4 title field
        let option = {
            titleCell: 'A4',
            dataStartRow: 4, // 0-indexed
            caseSensitiveHeaders: false
        }
        let JsonDataTitle = await ConvertExcleToJson(file, [], option)
        // getting the  title
        let title = JsonDataTitle.title

        let dataOption = {
            titleCell: 'A8',
            dataStartRow: 8, // 0-indexed
            caseSensitiveHeaders: false
        }

        let JsonData = await ConvertExcleToJson(file, requiredFields, dataOption)
        if (JsonData.message) {
            alert(JsonData.message)
            return
        }
        // updated data
        let updatedData = JsonData.data.filter((ele) => {
            if (Object.keys(ele).length > 3) {
                //  remove the obejct whose key are less then 3
                return ele
            }
        }).map((ele) => {
            const date = excelSerialToDate(ele?.Date);
            const formattedDate = date.toLocaleDateString('en-CA'); // YYYY-MM-DD (no timezone shift)

            return {
                ...ele,
                Date: formattedDate, // Correct date (no timezone offset)
                Credit: ele?.Credit ? ele?.Credit : 0,
                title: title
            };
        })
        console.log(updatedData, "updatedData")
        setMISJsonData(updatedData)

    }


    // upload function
    const MISBulkUpoad = async () => {
        // calling the asus bulk upload api
        const uploaded = await BulkMISUploadFunc(UPLOAD_MIS_TALLY, MISJsondata)
        if (uploaded.status === "Data saved or updated") {
            setMISJsonData([])
            //  calling the get MIS Data
            GetMISDataFunc(GET_MIS_TALLY_MAIN)
            // bellow state is upading just of the component rerander
            setReacallInfo("upload")
        }
    }

    useEffect(() => {
        //  calling the get MIS Data
        GetMISDataFunc(GET_MIS_TALLY_MAIN)
    }, [])

    // setting the mis data in to state
    useEffect(() => {
        if (MISInfo) {
            setMISDisplayData(MISInfo)
        }

    }, [MISInfo])
    // component array
    const AllComponents = [
        {
            title: "View_MisTally",
            comp: <MisTallyViewModel
                data={SelectedInfo}
                show={true}
                onCloseClick={() => {
                    setSelectedTitle("")
                    // clear the filter here

                }} />
        }
    ]
    // clear filter functio

    const ReturnComponet = (title) => {
        let comp = AllComponents.find((ele => ele.title === title))
        if (comp) {
            return comp.comp
        }
        return <></>
    }

    // filter data 
    const FilterData = async (filterData) => {
        setSelectedInfo(filterData)
        let isDataGot = await GetMISGroupedDataFunc(GET_MIS_TALLY_FILTER_DATA, filterData)
        const upldatedPayload = {
            ...filterData,
            cost_service_center: filterData?.cost_service_center?.split(" ")[0]
        }
        let isMisdata = await GetMISData(GET_MIS_OPS_DATA, upldatedPayload)
        if (isDataGot) {
            setIsFiltered(true)
        }
        if (isMisdata?.mis_data) {
            const apiData = isMisdata.mis_data;

            // update MISData values by matching "key"
            const updatedData = MISData.map(item => ({
                ...item,
                value: apiData[item.key] ?? 0   // use key from state to read value from API
            }));

            setMisData(updatedData);
            setShowMisData(true)
        }
    }
    return (
        <>
            <div className="bg-white sticky-top" style={{ top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp
                    title="Tally MIS Report"
                    extraFields={
                        <div className="d-flex align-items-center">
                            <FormGroup className="mb-0">
                                <Input type="file" id="gstUpload" onChange={UploadMISOnChange} />
                            </FormGroup>
                            {
                                JsonLoading && <Spinner size="sm" className="ms-2">
                                    Loading...
                                </Spinner>
                            }
                            {
                                MISJsondata.length >= 1 &&
                                <Button color="primary" className="ms-3 d-flex justify-content-center align-items-center" onClick={MISBulkUpoad} style={{ height: "2.2rem", width: "5rem" }} >
                                    {
                                        MISBulkUpoadLoading ? <Spinner size="sm" className="">
                                            Loading...
                                        </Spinner> : "Upload"
                                    }
                                </Button>
                            }
                        </div>
                    }
                />
            </div>
            <div className="container-fluid px-3 mt-3">

                {/* displaying the filters */}
                <MisTallyFilter RecallInfo={RecallInfo} FilterData={FilterData} Removefilter={() => {
                    setIsFiltered(false)
                    setShowMisData(false)
                    //  calling the get MIS Data
                    GetMISDataFunc(GET_MIS_TALLY_MAIN)
                }} />

                <div className="mt-3 border-top">
                    {/* <div className="d-flex justify-content-between align-items-center">
                    <h5>MIS Tally</h5>
                </div> */}
                    {/* {MISData.map((item, index) => (
                    <Card key={index} className="border-2 shadow-none rounded-3 text-center">
                        <CardBody>
                            <h5 className="fw-bold mb-1">{item.value}</h5>
                            <p className="mb-0 text-muted small" style={{ fontSize: "13px" }}>{item.label}</p>
                        </CardBody>
                    </Card>
                ))} */}
                    {
                        ShowMisData && (
                            <>
                                <Row className="gx-0 gy-0 mt-4">
                                    <Col md={2} className="rounded-3 text-center">

                                        <Card className="shadow-none border ">
                                            <CardBody className="p-0">
                                                {/* Common Key (Bottom) */}

                                                <p
                                                    className="mt-2 pt-0 py-2 text-white mb-0 fw-semibold text-dark "
                                                    style={{ fontSize: "14px" }}
                                                >
                                                    inviisble
                                                </p>

                                                <div className="d-flex justify-content-between border-bottom border-top py-2 px-3" >
                                                    <p
                                                        className="mb-0 text-muted small fw-bold"
                                                        style={{ fontSize: "13px" }}
                                                    >
                                                        Count
                                                    </p>
                                                </div>
                                                <div className="d-flex justify-content-between border-bottom py-2 px-3"
                                                >
                                                    <p
                                                        className="mb-0 text-muted small fw-bold"
                                                        style={{ fontSize: "13px" }}
                                                    >
                                                        Delivared
                                                    </p>

                                                </div>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    {
                                        Object.values(
                                            MISData.filter(item => item.groupId)
                                                .reduce((acc, curr) => {
                                                    if (!acc[curr.groupId]) acc[curr.groupId] = [];
                                                    acc[curr.groupId].push(curr);
                                                    return acc;
                                                }, {})
                                        ).map((group, groupIndex) => (
                                            <Col md={2} key={groupIndex} className="rounded-3 text-center">

                                                <Card className="shadow-none border border-start-0 ">
                                                    <CardBody className="p-0">
                                                        {/* Common Key (Bottom) */}
                                                        {group[0]?.commanKey && (
                                                            <p
                                                                className="mt-2 pt-0 py-2 mb-0 fw-semibold text-dark"
                                                                style={{ fontSize: "14px" }}
                                                            >
                                                                {group[0].commanKey}
                                                            </p>
                                                        )}
                                                        {/* Count + Delivered rows one below another */}
                                                        {group.map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="d-flex justify-content-center text-center border-top py-2 px-3"
                                                            >
                                                                <p
                                                                    className="mb-0  fw-bold text-center"
                                                                    style={{ fontSize: "13px" }}
                                                                >
                                                                    {item.value}
                                                                </p>
                                                                {/* <h6 className="fw-bold mb-0">{item.value}</h6> */}
                                                            </div>
                                                        ))}


                                                    </CardBody>
                                                </Card>
                                            </Col>

                                        ))
                                    }

                                    {/* Standalone (no groupId) */}
                                    <Col md={8}>
                                        <Row>
                                            {
                                                MISData.filter(item => !item.groupId).map((item, index) => (
                                                    <Col md={4} key={index}>
                                                        <StatsCard label={item.label} value={item.value} />
                                                    </Col>
                                                ))
                                            }
                                        </Row>
                                    </Col>
                                </Row>


                            </>
                        )
                    }


                    {
                        (MISDataLoading || MISGroupedDataLoading) ? <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                            <GridLoader size={20} />
                            <p className="mt-5 h5">Loading MIS Tally ...</p>
                        </div>
                            : <TableContainer
                                columns={columns}
                                data={!IsFilterd ? MISDisplayData : MISGroupedInfo || []}
                                isGlobalFilter={true}
                                isPagination={true}
                                isDownloadExcle={false}
                                isCustomPageSize={true}
                                SearchPlaceholder="Search From Table"
                                pagination="pagination"
                                buttonClass="btn-success"
                                paginationWrapper='dataTables_paginate paging_simple_numbers'
                            // tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            />
                    }
                    {
                        ReturnComponet(SelectedTitle)
                    }

                </div>
            </div>
        </>
    )
}

export default MisTallyComponent