import { Button, FormFeedback, FormGroup, Input, Label, Offcanvas, OffcanvasBody, OffcanvasHeader, Spinner } from "reactstrap";
import { Card, CardBody, Row, Col } from 'reactstrap';
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
        <Offcanvas isOpen={true} toggle={toggle} direction="end" style={{ width: '500px' }}>
            <OffcanvasHeader toggle={toggle}>Add POD</OffcanvasHeader>
            <OffcanvasBody>
                {/* 
                  * AWB Verification Section
                  * Users must enter and verify an AWB number here first.
                  */}
                <div>
                    <FormGroup className="w-75 m-auto pb-4" >
                        <Label for="awbInput">Enter AWB No.</Label>
                        <div className="d-flex align-items-start ">
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
                                <MdOutlineCancel
                                    onClick={() => { onClear(); setShowUploadFile(false); }}
                                    className="ms-2 mt-2 text-danger"
                                    style={{ cursor: "pointer", fontSize: '1.5rem' }}
                                />
                            ) : (
                                <Button
                                    color="primary"
                                    className="ms-2"
                                    onClick={VerifyAwdNumber}
                                    disabled={verificationLoading}
                                >
                                    {verificationLoading ? <Spinner size="sm" /> : "Check"}
                                </Button>
                            )}
                        </div>
                        <FormFeedback>{error}</FormFeedback>
                    </FormGroup>
                    <hr className="" style={{ borderBottom: "solid gray 1px" }} />

                </div>

                {/* 
                  * Upload File Section
                  * This section appears only after the AWB number has been successfully verified.
                  */}
                {showUploadFile && (
                    <Card className="mb-3 shadow-none border-2 p-0">
                        <CardBody>
                            {/* AWB Response */}
                            {showUploadFile && varificationApiData && <ResponseDisplay data={varificationApiData} />}
                            <FormGroup>
                                <Label for="gstUpload">Upload File</Label>
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
                                <div className="position-relative border rounded mt-3" style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                                    <MdOutlineCancel
                                        className="position-absolute text-danger end-0 top-0 m-2"
                                        style={{ fontSize: '1.3rem', cursor: 'pointer' }}
                                        onClick={onImageRemove}
                                    />
                                    <img
                                        src={URL.createObjectURL(formData?.pod_file)}
                                        alt="POD Preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            {/* Action Buttons */}
                            <div className="d-flex justify-content-between mt-3 shadow-none">
                                {showUploadFile && (
                                    <Button color="success" onClick={onSubmit} disabled={loading}>
                                        {loading ? <Spinner size="sm" /> : "Add POD"}
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}


            </OffcanvasBody>
        </Offcanvas>
    );
};

export default AddPodModal;

/**
 * ResponseDisplay Component
 * A small helper component to display details returned from the AWB verification API.
 * @param {Object} props.data - The verification API response data.
 */
const ResponseDisplay = ({ data }) => (
    <Card className="mt-0 shadow-none">
        <CardBody>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label className="fw-bold">Drop Name</Label>
                        <p className="mb-0">{data.drop_name || '-'}</p>
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label className="fw-bold">Drop Pincode</Label>
                        <p className="mb-0">{data.drop_pincode || '-'}</p>
                    </FormGroup>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <FormGroup>
                        <Label className="fw-bold">Pick Name</Label>
                        <p className="mb-0">{data.pick_name || '-'}</p>
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label className="fw-bold">Pick Pincode</Label>
                        <p className="mb-0">{data.pick_pincode || '-'}</p>
                    </FormGroup>
                </Col>
            </Row>
        </CardBody>
    </Card>
);
