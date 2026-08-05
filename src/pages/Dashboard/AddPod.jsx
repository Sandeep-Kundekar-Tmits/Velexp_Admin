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
import { Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Table } from "@/components/ui";
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
import Loader from "@/Loaders/Loader";
import { Eye, FileSearch, Plus } from "lucide-react";
const AddPod = () => {

  // In an effect, not in the render body: it was reassigning document.title on
  // every render, including every keystroke in the table's search box.
  useEffect(() => {
    document.title = "Add POD";
  }, []);

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
            <span className="flex items-center gap-2">
              {/* The colour was #495057 -- a dark grey chosen for the old white
                  table, which on the dark row was all but unreadable. */}
              <p
                className="m-0 grow truncate text-[13px] text-slate-300"
                style={{ maxWidth: '200px' }}
                title={podValue}  // Show full text on hover
              >
                {podValue.length > 50 ? `${podValue.substring(0, 50)}...` : podValue}
              </p>
              {/* Same treatment as the row actions on the customer list, so a
                  button in a grid looks the same wherever you meet one. */}
              <Button
                size="sm"
                className="shrink-0 gap-1.5 whitespace-nowrap rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-[#93C5FD] transition-all duration-200 hover:bg-[#3B82F6]/25 hover:text-white hover:shadow-[0_0_18px_-4px_rgba(59,130,246,0.9)]"
                onClick={() => {
                  setSelectedSrc(podValue)
                  setSelectedTitle("view_pod")
                }}
              >
                <Eye aria-hidden="true" className="size-3.5" />
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

  return (
    /* Same shell as the customer list: no background of its own (the layout
       owns the canvas and the backdrop) and page-fit so the grid, not the
       page, is what scrolls. */
    <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
      {/* No sticky wrapper: MainHeaderComp draws nothing here now -- it hands
          the title and these buttons to the layout's PageHeader, which is
          already fixed above the scroll box. The wrapper was left holding
          nothing but its own background. */}
      <MainHeaderComp
        title="POD Reports"
        subTitle="Proof-of-delivery records by date range."
        extraFields={
          /* The shared header-action classes rather than each screen's own
             sizing, so these line up with the export button TableContainer
             puts in the same bar. Primary on the create action, ghost on the
             lookup: one button per header should read as the one to press. */
          <div className="flex items-center gap-2">
            <Button
              className="table-action-btn table-action-btn-primary"
              onClick={() => setSelectedTitle("add_pod")}
            >
              <Plus aria-hidden="true" size={15} />
              Add POD
            </Button>
            <Button
              className="table-action-btn table-action-btn-ghost"
              onClick={() => { setSelectedTitle("Missing_pod") }}
            >
              <FileSearch aria-hidden="true" size={15} />
              Find Missing POD
            </Button>
          </div>
        }
      />
      {/* page-fit-body, not container-fluid: this is the link in the height
          chain between the page root and the grid. */}
      <div className="page-fit-body relative z-10 pb-4">
        {ReturnComponent(selectedTitle)}
        {/* Filters.
            Label above its control, the way a labelled field normally reads,
            with the action beside the pair. items-end, so the button sits on
            the input's baseline rather than being centred against the whole
            two-line stack. */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {/* Fixed basis, not a grid column: the control renders two
              dd/MM/yyyy dates and a calendar icon, so its content width is
              known and does not need a quarter of the page. */}
          <div className="flex w-full flex-col gap-1.5 sm:w-65">
            <Label className="form-label m-0 font-bold">
              Select Date Range
            </Label>
            <DateRangeInput
              value={selectedRange}
              onChange={handleChange}
              isBorder={true}
            />
          </div>
          <Button
            color="primary"
            onClick={RangeCheckPodDetails}
            className="shrink-0 px-5"
            style={{ height: "38px" }}
          >
            Check
          </Button>
        </div>

        <div className="page-fit-body mt-4">
          {
            PodDataLoading ?
              /* The same panel the grid draws, so swapping one for the other
                 does not resize the page around it. */
              <Loader message="Loading POD details..." fullscreen={false} /> :
              <TableContainer
                columns={columns}
                data={PodDetails || []}
                /* Was `10`: the prop is a boolean flag for whether to show the
                   page-size select at all -- the sizes it offers are fixed. */
                isCustomPageSize={true}
                isGlobalFilter={true}
                isPagination={true}
                isDownloadExcle={true}
                onDownloadExcle={DownloadPod}
                SearchPlaceholder="Search From Table"
                pagination="pagination"
                paginationWrapper='dataTables_paginate paging_simple_numbers'
                /* table-bordered dropped: .grid-shell draws the row rules now,
                   so it only ever fought them. nowrap stays -- these five
                   columns fit, and no cellLines here because the POD column
                   holds a button, which a line clamp would cut in half. */
                tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                theadClass="sticky top-0 z-10"
                isStickyHeader={true}
                stickyTop={0}
                /* Rows absorb the leftover height, so the grid is the only
                   thing on the screen that scrolls. */
                fillHeight
                /* The sub-992px cap only; fillHeight drops it above that. */
                tableHeight="72vh"
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