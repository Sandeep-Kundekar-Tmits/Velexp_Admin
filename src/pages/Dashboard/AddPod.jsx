// src/components/filter.
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
//import components
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Table } from "reactstrap";
import DateRangePicker from "@paprika/date-range-picker";
import TableContainer from "../../components/Table/TableContainer";
import AddPodModal from "../../components/UserManagement/AddPOD/AddPodModal";
import usePostApiCall from "../../hooks/usePostApiCall";
import { ADD_POD, GET_ALL_POD_DETAILS } from "../../api";
import formatDateForPayload from "../../helpers/DateHelper";
import PodImageViewer from "../../components/UserManagement/AddPOD/PodImageViewer";

import MissingPod from "../../components/UserManagement/AddPOD/MissingPod";
import useExcelParser from "../../hooks/useExcelParser";
import { downloadExcel } from "../../helpers/downloadExcel";
import CollapsibleSideBar from "../../components/CollapsibleSideBar";

const AddPod = () => {

  const [SelectedSrc, setSelectedSrc] = useState(null)
  const columns = useMemo(
    () => [
      {
        header: 'Sl.No',
        accessorKey: 'id',
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: 'AWB No',
        accessorKey: 'awbno',
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: 'POD',
        accessorKey: 'pod',
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => {
          const podValue = row.original.pod; // Get the POD value from the row data
          return (
            <span className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
              <p
                className="m-0 text-truncate flex-grow-1"
                style={{
                  maxWidth: '200px',
                  color: '#495057',
                  fontSize: '0.875rem'
                }}
                title={podValue}  // Show full text on hover
              >
                {podValue.length > 50 ? `${podValue.substring(0, 50)}...` : podValue}
              </p>
              <Button
                variant="link"
                size="sm"
                className="flex-shrink-0"
                onClick={() => {
                  setSelectedSrc(podValue)
                  setSelectedTitle("view_pod")
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #0d6efd',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}

              >
                View POD
              </Button>
            </span>
          );
        },
      },
      {
        header: 'User',
        accessorKey: 'user',
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: 'Created Date',
        accessorKey: 'createddate',
        enableColumnFilter: false,
        enableSorting: true,
      },
    ],
    []
  );


  // selected data range
  const [selectedRange, setSelectedRange] = useState({
    startDate: "",
    endDate: "",
  });

  // handle change range
  const handleChange = (range) => {
    setSelectedRange(range);
  };

  // pod info
  const [PodInfo, setPodInfo] = useState({
    awbno: "",
    pod_file: null
  })

  // title for the select component
  const [selectedTitle, setSelectedTitle] = useState("")
  // toggle component
  const toggle = () => {
    setSelectedTitle("")
    setPodInfo({
      ...PodInfo,
      awbno: ""
    })
  }

  //  api call functions
  const { apifunc: AddPodFunc, loading: AddPodLoading } = usePostApiCall(toggle, "POD Added Successfully")


  const [Errors, setErrors] = useState({})
  //  submitForm
  const SubmitPod = async () => {
    const errors = {}
    if (!PodInfo.awbno) errors.awbno = "awb no is required"
    if (!PodInfo?.pod_file) errors.pod_file = "pod_file is required"
    setErrors(errors)

    if (PodInfo.awbno && PodInfo?.pod_file) {
      const formData = new FormData();

      // Append the awbno
      formData.append('awbno', PodInfo.awbno);

      // Append the file if it exists
      if (PodInfo.pod_file) {
        formData.append('pod_file', PodInfo.pod_file);
      }

      formData.append("user_id", JSON.parse(localStorage.getItem("authUser"))?.user?.id)
      //  call api
      let addedPod = await AddPodFunc(ADD_POD, formData, true)
      if (addedPod) {
        setPodInfo({
          awbno: "",
          pod_file: null,
        })
      }
    }
  }

  // input change
  const onPodChange = (e) => {
    const { value, type, files } = e.target
    if (type === "file") {
      setPodInfo({
        ...PodInfo,
        pod_file: files[0]
      })
    }
    else {
      setPodInfo({
        ...PodInfo,
        awbno: value
      })
    }
  }

  const components = [
    {
      title: "add_pod",
      comp: <AddPodModal
        toggle={toggle}
        loading={AddPodLoading}
        formData={PodInfo}
        onChange={onPodChange}
        onImageRemove={() => setPodInfo({
          ...PodInfo,
          pod_file: null
        })}
        errors={Errors}
        onSubmit={SubmitPod}
        onClear={() => {
          setPodInfo({
            ...PodInfo,
            awbno: ""
          })
        }}
      />
    },
    {
      title: "view_pod",
      comp: <PodImageViewer toggleModal={() => {
        setSelectedTitle("")
        setSelectedSrc(null)
      }} podValue={SelectedSrc} />
    },
    {
      title: "Missing_pod",
      comp: <MissingPod onClose={() => { setSelectedTitle("") }} />
    }
  ]

  const ReturnComponent = (title) => {
    let component = components.find(ele => ele.title === title)
    if (!component) {
      return <></>
    }
    return component.comp
  }

  //  calling the get Pod Data
  const [PodDetails, setPodDetails] = useState([])
  const { apifunc: GetAllPodData, data: POD_Data, loading: PodDataLoading } = usePostApiCall()

  useEffect(() => {
    //  calling the all pod details
    let payload = formatDateForPayload(selectedRange)
    GetAllPodData(GET_ALL_POD_DETAILS, payload)
  }, [])

  useEffect(() => {
    setPodDetails(POD_Data?.results)
  }, [POD_Data])


  // check click function

  const RangeCheckPodDetails = () => {
    if (selectedRange.startDate === "" || selectedRange.endDate === "") {
      alert("Please select both start and end dates")
      return
    }
    let payload = formatDateForPayload(selectedRange)
    GetAllPodData(GET_ALL_POD_DETAILS, payload)
  }

  const DownloadPod = () => {
    // Transform your data if needed
    const exportData = PodDetails.map(item => ({
      'AWB No': item.awbno,
      'POD': item.pod,
      'User': item.user,
      'Created Date': item.createddate
    }));

    downloadExcel(exportData, 'pod_Detils.xlsx');
  }

  //meta title
  document.title = "Add POD";
  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* <Breadcrumbs title="Tables" breadcrumbItem="Data Tables" /> */}

        {/* add pod section */}
        <div className="mt-2 mb-3">
          <Button color="primary" onClick={() => setSelectedTitle("add_pod")}>
            Add POD
          </Button>
          <Button color="primary" className="ms-4" onClick={() => { setSelectedTitle("Missing_pod") }} >
            Find Missing POD
          </Button>
          {ReturnComponent(selectedTitle)}

        </div>
       

        <h2>POD Reports</h2>
        <p>Select POD Date Range</p>
        <div className="d-flex justify-content-between ">
          {/* select date  */}
          <div className="ml-3">
            {/* range selector */}
            <DateRangePicker
              startDate={selectedRange.startDate}
              endDate={selectedRange.endDate}
              onChange={handleChange}

            />
          </div>

          <div className="d-flex justify-content-between">
            <Button color="primary" onClick={RangeCheckPodDetails}>
              Check
            </Button>
            {" "}
            <Button color="primary" style={{ marginLeft: "12px" }} onClick={DownloadPod}>
              Download
            </Button>
          </div>

        </div>


        <div className="mt-4">
          {
            PodDataLoading ? <div className="d-flex justify-content-center align-content-between">
              <Spinner>
                Loading...
              </Spinner>
            </div> :
              <TableContainer
                columns={columns}
                data={PodDetails || []}
                isGlobalFilter={true}
                isPagination={true}
                SearchPlaceholder="Search From Table"
                pagination="pagination"
                paginationWrapper='dataTables_paginate paging_simple_numbers'
                tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
              />
          }
        </div>




      </div>
    </div>
  );
}
AddPod.propTypes = {
  preGlobalFilteredRows: PropTypes.any,

};


export default AddPod;