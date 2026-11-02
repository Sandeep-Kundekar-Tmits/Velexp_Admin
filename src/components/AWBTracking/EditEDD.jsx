import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormFeedback,
  FormGroup,
  Label
} from "@/components/ui";
import { UPDATE_BOOKING_EDD } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";

const EditEDD = ({ isOpen, toggle, shipmentDetails, onSuccess, currentEdd = "" }) => {
  const [newEdd, setNewEdd] = useState("");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState({});

  const safeShipmentDetails = shipmentDetails || {};

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
      awbno: safeShipmentDetails.awbno,
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
    <Modal isOpen={isOpen} toggle={toggle} centered size="sm">
      <ModalHeader toggle={toggle}>
        {safeShipmentDetails.awbno ? `Edit EDD for AWB: ${safeShipmentDetails.awbno}` : "Edit Estimated Delivery Date"}
      </ModalHeader>

      <ModalBody>
        <div className="flex flex-col gap-3">
          {currentEdd && (
            <div className="flex items-center justify-between rounded-lg border border-[rgb(var(--overlay-rgb)/0.12)] bg-[rgb(var(--overlay-rgb)/0.04)] px-3 py-2 text-[13px]">
              <span className="text-ink-muted">Current EDD</span>
              <span className="font-semibold text-ink">{currentEdd}</span>
            </div>
          )}

          <FormGroup className="mb-0">
            <Label className="mb-1 text-[12px] font-semibold">New EDD <span className="text-danger-500">*</span></Label>
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

          <FormGroup className="mb-0">
            <Label className="mb-1 text-[12px] font-semibold">Remark <span className="text-danger-500">*</span></Label>
            <Input
              type="textarea"
              rows={3}
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setErrors({ ...errors, remark: "" });
              }}
              invalid={!!errors.remark}
              placeholder="Reason for changing the delivery date"
            />
            {errors.remark && <FormFeedback>{errors.remark}</FormFeedback>}
          </FormGroup>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button color="secondary" onClick={toggle} disabled={loading}>
          Cancel
        </Button>
        <Button color="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditEDD;
