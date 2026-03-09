import { Button, FormFeedback, FormGroup, Input, Label, Offcanvas, OffcanvasBody, OffcanvasHeader, Spinner } from "reactstrap";
import { Card, CardBody, Row, Col } from 'reactstrap';
import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { VERIFY_AWB } from "../../../api";

const AddPodModal = ({ toggle, formData, onChange, onImageRemove, errors, onSubmit, loading, onClear }) => {
    const [showUploadFile, setShowUploadFile] = useState(false);

    const { apifunc: VerifyAwb, loading: verificationLoading, data: varificationApiData } = usePostApiCall();
    const [error, setError] = useState("");

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
                {/* AWB Verification Section */}
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

                {/* Upload File Section */}
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

                            {/* File Preview */}
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
