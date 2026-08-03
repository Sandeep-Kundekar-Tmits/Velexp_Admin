/**
 * AddPod Component
 * This component provides a dashboard for managing and reporting Proof of Delivery (POD) details.
 * It allows users to view a list of PODs, add new ones (via file upload), check for missing PODs,
 * and export data to Excel.
 */
// src/components/filter.
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
//import components
import Breadcrumbs from '../../components/Common/Breadcrumb';
import { Button, Col, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner, Table } from "reactstrap";
import DateRangeInput from "../../components/Common/DateRangeInput";
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
import MainHeaderComp from "../../components/MainHeaderCom";
import { GridLoader } from "react-spinners";

const AddPod = () => {

  // State to hold the source/URL of the selected POD image for viewing
  const [SelectedSrc, setSelectedSrc] = useState(null)

  /**
   * Column configuration for the TableContainer component.
   * Defines headers, data keys, and custom rendering for various POD fields.
   */
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


  // State for date range filtering
  const [selectedRange, setSelectedRange] = useState({
    startDate: "",
    endDate: "",
  });

  /**
   * Updates the selected date range state.
   * @param {Object} range - { startDate, endDate }
   */
  const handleChange = (range) => {
    setSelectedRange(range);
  };

  // State to store form data for adding a new POD
  const [PodInfo, setPodInfo] = useState({
    awbno: "",
    pod_file: null
  })

  // State to control which modal/component is currently active/visible
  const [selectedTitle, setSelectedTitle] = useState("")

  /**
   * Resets the modal state and clears the current POD info form.
   */
  const toggle = () => {
    setSelectedTitle("")
    setPodInfo({
      ...PodInfo,
      awbno: ""
    })
  }

  // Custom hook to handle API calls for adding a POD (with success notification)
  const { apifunc: AddPodFunc, loading: AddPodLoading } = usePostApiCall(toggle, "POD Added Successfully")

  // State for form validation errors
  const [Errors, setErrors] = useState({})

  /**
   * Validates and submits the POD addition form.
   * Appends AWB number and file to FormData and sends a POST request.
   */
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

  /**
   * Handles input changes for the Add POD form.
   * Manages both text (AWB number) and file (POD image) inputs.
   */
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

  /**
   * List of sub-components that can be rendered conditionally (Modals/Views).
   * Maps a unique title to a React component.
   */
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

  /**
   * Helper function to return the component corresponding to the selectedTitle.
   * @param {string} title - The title of the component to render.
   * @returns {JSX.Element} - The matching component or an empty fragment.
   */
  const ReturnComponent = (title) => {
    let component = components.find(ele => ele.title === title)
    if (!component) {
      return <></>
    }
    return component.comp
  }

  // State for storing fetched POD data
  const [PodDetails, setPodDetails] = useState([])

  // API call function for fetching all POD data
  const { apifunc: GetAllPodData, data: POD_Data, loading: PodDataLoading } = usePostApiCall()

  // Initial data fetch on component mount
  useEffect(() => {
    let payload = formatDateForPayload(selectedRange)
    GetAllPodData(GET_ALL_POD_DETAILS, payload)
  }, [])

  // Sync PodDetails state with API response data
  useEffect(() => {
    setPodDetails(POD_Data?.results)
  }, [POD_Data])


  /**
   * Validates selected range and fetches POD data based on the user-selected date range.
   */
  const RangeCheckPodDetails = () => {
    if (selectedRange.startDate === "" || selectedRange.endDate === "") {
      alert("Please select both start and end dates")
      return
    }
    let payload = formatDateForPayload(selectedRange)
    GetAllPodData(GET_ALL_POD_DETAILS, payload)
  }

  /**
   * Transforms the current POD details and triggers an Excel file download.
   */
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

  // Set the browser tab title
  document.title = "Add POD";
  return (
    <div className="page-content py-0 px-0">
      <div className="bg-white " style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
        <MainHeaderComp
          title="POD Reports"
          extraFields={
            <div className="d-flex gap-2">
              <Button color="primary" onClick={() => setSelectedTitle("add_pod")}>
                Add POD
              </Button>
              <Button color="primary" onClick={() => { setSelectedTitle("Missing_pod") }} >
                Find Missing POD
              </Button>
            </div>
          }
        />
      </div>
      <div className="container-fluid">
        {/* <Breadcrumbs title="Tables" breadcrumbItem="Data Tables" /> */}

        {ReturnComponent(selectedTitle)}
        {/* Filters Section */}
        <Row className="mt-3 align-items-end mx-0">
          <Col md={4} lg={3}>
            <FormGroup className="mb-0">
              <Label className="form-label fw-bold">Select Date Range</Label>
              <DateRangeInput
                value={selectedRange}
                onChange={handleChange}
                isBorder={true}
              />
            </FormGroup>
          </Col>
          <Col md={2}>
            <Button
              color="primary"
              className="w-100"
              onClick={RangeCheckPodDetails}
              style={{ height: "38px", marginBottom: "15px" }}
            >
              Check
            </Button>
          </Col>
        </Row>

        <div className="mt-2">
          {
            PodDataLoading ?
              <div style={{ height: "75vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                <GridLoader size={20} />
                <p className="mt-5 h5">Loading POD Details ...</p>
              </div> :
              <TableContainer
                columns={columns}
                data={PodDetails || []}
                isCustomPageSize={10}
                isGlobalFilter={true}
                isPagination={true}
                isDownloadExcle={true}
                onDownloadExcle={DownloadPod}
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