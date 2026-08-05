import { Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Spinner } from "@/components/ui";
import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { VERIFY_AWB } from "../../../api";

/**
 * AddPodModal Component
 * An Offcanvas/Modal component for adding a POD to an existing AWB.
 * Workflow:
 * 1. User enters AWB No.
 * 2. User clicks 'Check' to verify the AWB.
 * 3. On successful verification, the file upload section is revealed.
 * 4. User uploads a file and submits to add the POD.
 *
 * @param {Object} props
 * @param {Function} props.toggle - Function to close the modal.
 * @param {Object} props.formData - Form values (awbno, pod_file).
 * @param {Function} props.onChange - Handler for input changes.
 * @param {Function} props.onImageRemove - Handler to clear the uploaded file.
 * @param {Object} props.errors - Validation errors from parent.
 * @param {Function} props.onSubmit - Handler for final form submission.
 * @param {boolean} props.loading - Loading state for the submission button.
 * @param {Function} props.onClear - Handler to reset the AWB input.
 */
const AddPodModal = ({ toggle, formData, onChange, onImageRemove, errors, onSubmit, loading, onClear }) => {
    // Local state to control the visibility of the upload section (shown after AWB verification)
    const [showUploadFile, setShowUploadFile] = useState(false);

    // Custom hook for AWB verification API call
    const { apifunc: VerifyAwb, loading: verificationLoading, data: varificationApiData } = usePostApiCall();

    // Local state for AWB input validation error
    const [error, setError] = useState("");

    /**
     * Verifies the AWB number before allowing file upload.
     * Sets error if empty, or calls the verification API.
     */
    const VerifyAwdNumber = async () => {
        if (!formData?.awbno) {
            setError("AWB number is required");
        } else {
            setError("");
            const VarificationData = await VerifyAwb(VERIFY_AWB, { awbno: formData?.awbno });
            if (VarificationData) setShowUploadFile(true);
        }
    };

    return (
        /* A centred dialog rather than a right-side drawer. This is a short,
           self-contained task -- verify an AWB, attach a file -- with nothing on
           the page behind it to refer to while you work, which is what a drawer
           is for. `md` is max-w-lg (512px), near the 500px the drawer had.
           `scrollable` caps it at 85vh so a tall preview cannot run off the
           bottom of a laptop screen. */
        <Modal isOpen={true} toggle={toggle} centered size="md" scrollable>
            <ModalHeader toggle={toggle}>Add POD</ModalHeader>
            <ModalBody>
                {/*
                  * AWB Verification Section
                  * Users must enter and verify an AWB number here first.
                  *
                  * Full width, not the old w-3/4 m-auto: a centred column
                  * inside a 500px panel left the field narrower than the
                  * preview below it and the two edges never lined up.
                  */}
                <FormGroup className="mb-0">
                    <Label for="awbInput" className="mb-1.5 block text-[13px] font-semibold text-slate-200">
                        Enter AWB No.
                    </Label>
                    <div className="flex items-start gap-2">
                        <Input
                            type="text"
                            name="awbno"
                            id="awbInput"
                            placeholder="Enter AWB No."
                            value={formData?.awbno}
                            onChange={onChange}
                            invalid={!!error || !!errors?.awbno}
                        />
                        {showUploadFile ? (
                            <button
                                type="button"
                                onClick={() => { onClear(); setShowUploadFile(false); }}
                                aria-label="Clear AWB number"
                                title="Clear AWB number"
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-danger-500/30 bg-danger-500/10 text-danger-500 transition-colors hover:bg-danger-500/20 hover:text-white"
                            >
                                <MdOutlineCancel style={{ fontSize: '1.15rem' }} />
                            </button>
                        ) : (
                            <Button
                                className="table-action-btn table-action-btn-primary shrink-0"
                                onClick={VerifyAwdNumber}
                                disabled={verificationLoading}
                            >
                                {verificationLoading ? <Spinner size="sm" /> : "Check"}
                            </Button>
                        )}
                    </div>
                    <FormFeedback>{error}</FormFeedback>
                </FormGroup>

                {/*
                  * Upload File Section
                  * This section appears only after the AWB number has been successfully verified.
                  *
                  * A hairline and spacing instead of the old <hr> plus nested
                  * Cards -- a card inside a panel inside a drawer was three
                  * frames deep for one form.
                  */}
                {showUploadFile && (
                    <div className="mt-5 border-t border-white/10 pt-5">
                        {/* AWB Response */}
                        {varificationApiData && <ResponseDisplay data={varificationApiData} />}

                        <FormGroup className="mt-4 mb-0">
                            <Label for="gstUpload" className="mb-1.5 block text-[13px] font-semibold text-slate-200">
                                Upload File
                            </Label>
                            <Input
                                type="file"
                                id="gstUpload"
                                name="pod_file"
                                onChange={onChange}
                                invalid={errors?.pod_file}
                            />
                            <FormFeedback>{errors?.pod_file}</FormFeedback>
                        </FormGroup>

                        {/*
                          * File Preview Section
                          * Shows a preview of the selected image file before submission.
                          */}
                        {formData?.pod_file && (
                            <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20" style={{ height: '200px' }}>
                                <button
                                    type="button"
                                    onClick={onImageRemove}
                                    aria-label="Remove image"
                                    title="Remove image"
                                    className="absolute inset-e-0 top-0 z-10 m-2 inline-flex size-7 items-center justify-center rounded-full border border-white/20 bg-black/60 text-danger-500 transition-colors hover:bg-danger-500 hover:text-white"
                                >
                                    <MdOutlineCancel style={{ fontSize: '1.05rem' }} />
                                </button>
                                {/* contain, not cover: a POD is a document, and
                                    cropping it to fill the box hides the very
                                    corners someone is checking. */}
                                <img
                                    src={URL.createObjectURL(formData?.pod_file)}
                                    alt="POD Preview"
                                    className="size-full object-contain"
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-5 flex justify-end">
                            <Button
                                className="table-action-btn table-action-btn-primary"
                                onClick={onSubmit}
                                disabled={loading}
                            >
                                {loading ? <Spinner size="sm" /> : "Add POD"}
                            </Button>
                        </div>
                    </div>
                )}
            </ModalBody>
        </Modal>
    );
};

export default AddPodModal;

/**
 * ResponseDisplay Component
 * A small helper component to display details returned from the AWB verification API.
 * @param {Object} props.data - The verification API response data.
 */
const ResponseDisplay = ({ data }) => {
    /* A definition grid, not four Row/Col FormGroups. These are read-only
       facts about the shipment, and wrapping each in a form group made them
       look like inputs someone had disabled. */
    const fields = [
        ["Drop Name", data.drop_name],
        ["Drop Pincode", data.drop_pincode],
        ["Pick Name", data.pick_name],
        ["Pick Pincode", data.pick_pincode],
    ];

    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-white/8 bg-white/3 p-4">
            {fields.map(([label, value]) => (
                <div key={label} className="min-w-0">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                        {label}
                    </dt>
                    <dd className="m-0 mt-0.5 truncate text-[13px] text-slate-200" title={value || undefined}>
                        {value || "-"}
                    </dd>
                </div>
            ))}
        </dl>
    );
};
