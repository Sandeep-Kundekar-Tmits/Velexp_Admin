import React, { useState } from "react";
import {
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  Button,
  Input,
  FormFeedback,
  FormGroup,
  Label
} from "reactstrap";
import { UPDATE_BOOKING_EDD } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";

const Detail = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "col-12 mb-2" : "col-4 mb-2"}>
    <div className="fw-semibold small text-dark text-break">
      {value || "-"}
    </div>
    <div className=" small">
      {label}
    </div>
  </div>
);


const EditEDD = ({ isOpen, toggle, shipmentDetails = {}, onSuccess }) => {
  const [newEdd, setNewEdd] = useState("");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState({});

  const { apifunc: updateEdd, loading } = usePostApiCall();
  const { ErrorToaster, SucceesToaster } = ToasterProvider();

  const validate = () => {
    let tempErrors = {};
    let isValid = true;

    if (!remark.trim()) {
      tempErrors.remark = "Remark is compulsory";
      isValid = false;
    }

    if (!newEdd) {
      tempErrors.new_edd = "New EDD is required";
      isValid = false;
    } else {
      const selectedDate = new Date(newEdd);
      const today = new Date();
      // Reset today's time to midnight for accurate comparison
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        tempErrors.new_edd = "Edit date should be greater than today's date";
        isValid = false;
      }
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const changed_by = JSON.parse(localStorage.getItem("authUser"))?.user?.id;

    const payload = {
      awbno: shipmentDetails.awbno,
      new_edd: newEdd,
      changed_by: changed_by,
      remark: remark
    };

    const res = await updateEdd(UPDATE_BOOKING_EDD, payload);
    if (res) {
      if (res.success || res.status !== "error") {
        if (res.message === "EDD already same") {
          ErrorToaster(res.message);
        } else {
          SucceesToaster(res.message || "EDD updated successfully");
          if (onSuccess && res.new_edd) {
            onSuccess(res.new_edd);
          }
          toggle();
          // Reset form fields on success
          setNewEdd("");
          setRemark("");
          setErrors({});
        }
      } else {
        ErrorToaster(res.message || "Failed to update EDD");
      }
    } else {
      ErrorToaster("Failed to update EDD");
    }
  };

  // Get tomorrow's date in YYYY-MM-DD format for the input's min attribute
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Offcanvas
      isOpen={isOpen}
      toggle={toggle}
      direction="end"
      style={{ width: "500px" }}
    >
      <OffcanvasHeader toggle={toggle} className="border-bottom">
        {shipmentDetails.awbno ? `Edit EDD for AWB: ${shipmentDetails.awbno}` : "Edit Estimated Delivery Date"}
      </OffcanvasHeader>

      <OffcanvasBody>

        <div className="" style={{ height: "75vh" }}>
          <div className="mb-4 w-100 d-flex flex-column justify-content-center align-items-center">
            <h6 className="fw-bold pb-2 mb-1 mt-3">
              Select New Estimated Delivery Date
            </h6>
            <div className="row w-75 mt-3" >
              <FormGroup>
                <Label>New EDD <span className="text-danger">*</span></Label>
                <Input
                  type="date"
                  value={newEdd}
                  min={getTomorrowDateString()}
                  onChange={(e) => {
                    setNewEdd(e.target.value);
                    setErrors({ ...errors, new_edd: "" });
                  }}
                  invalid={!!errors.new_edd}
                />
                {errors.new_edd && <FormFeedback>{errors.new_edd}</FormFeedback>}
              </FormGroup>

              <FormGroup className="mt-0">
                <Label>Remark <span className="text-danger">*</span></Label>
                <Input
                  type="textarea"
                  value={remark}
                  onChange={(e) => {
                    setRemark(e.target.value);
                    setErrors({ ...errors, remark: "" });
                  }}
                  invalid={!!errors.remark}
                  placeholder="Enter remark here"
                />
                {errors.remark && <FormFeedback>{errors.remark}</FormFeedback>}
              </FormGroup>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button color="secondary" onClick={toggle} disabled={loading}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

      </OffcanvasBody>

    </Offcanvas>
  );
};

export default EditEDD;
