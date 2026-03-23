import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap";
import MainHeaderComp from "../MainHeaderCom";
import { useState } from "react";
import AWBPage from "./AWBPage";

const AWBPrintPage = () => {
    const [awbNo, setAwbNo] = useState("");
    const [showPage, setShowPage] = useState(false);

    const handlePrint = () => {
        if (!awbNo.trim()) {
            alert("Please enter AWB No");
            return;
        }
        setShowPage(true);
    };

    // When Print is clicked → Load AWBPage
    if (showPage) {
        return <AWBPage awbNo={awbNo} onBack={() => {
            setShowPage(false)
        }} />;
    }

    return (
        <div className='page-content py-0 px-0'>
            <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderComp title="AWB Label Print" />
            </div>
            <div className="container-fluid px-3">
                <Row className="mt-3 align-items-end">
                    <Col md={4}>
                        <FormGroup className="mb-0">
                            <Label className="form-label fw-bold">AWB</Label>
                            <Input
                                type="text"
                                placeholder="Enter AWB No."
                                value={awbNo}
                                onChange={(e) => setAwbNo(e.target.value)}
                                style={{ height: "38px" }}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={2}>
                        <Button
                            color="primary"
                            className="w-100"
                            style={{ height: "38px", marginBottom: "15px" }}
                            onClick={handlePrint}
                        >
                            Print
                        </Button>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default AWBPrintPage;
