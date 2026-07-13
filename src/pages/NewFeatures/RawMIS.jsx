// Raw MIS — pick a month + year and download the backend-generated full shipment report Excel.
import React, { useState } from "react"
import { Button, Card, CardBody, Col, Input, Label, Row } from "reactstrap"
import { MdFileDownload } from "react-icons/md"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { FULL_SHIPMENT_REPORT } from "../../api"

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
]

const RawMIS = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()

    const now = new Date()
    const currentYear = now.getFullYear()
    const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i)

    const [month, setMonth] = useState(String(now.getMonth() + 1))
    const [year, setYear] = useState(String(currentYear))

    const handleGenerate = () => {
        if (!month || !year) {
            ErrorToaster("Please select both month and year")
            return
        }

        // Trigger a native browser download in a new tab.
        // We deliberately do NOT use fetch() here: this file endpoint is not reachable
        // via a credentialed cross-origin fetch (it fails with "Failed to fetch"), while
        // a normal first-party browser navigation downloads the file correctly.
        // window.open must be called synchronously inside the click handler so the
        // browser treats it as a user gesture and does not block it as a popup.
        const url = `${FULL_SHIPMENT_REPORT}?month=${month}&year=${year}`
        window.open(url, "_blank", "noopener")
        SuccessToaster("Report generation started — the file will download automatically once ready.")
    }

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Raw MIS" subTitle="Download the full shipment report for a selected month" />
                </div>

                <div className="container-fluid px-3 py-3">
                    <Card className="shadow-sm border-0">
                        <CardBody className="p-4">
                            <h5 className="mb-4 fw-bold">Select Month &amp; Year</h5>
                            <Row className="align-items-end g-3">
                                <Col md={4}>
                                    <Label className="fw-bold">Month</Label>
                                    <Input
                                        type="select"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                    >
                                        {MONTHS.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Label className="fw-bold">Year</Label>
                                    <Input
                                        type="select"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                    >
                                        {YEARS.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Button
                                        color="primary"
                                        block
                                        onClick={handleGenerate}
                                        className="d-flex align-items-center justify-content-center gap-2"
                                    >
                                        <MdFileDownload size={18} /> Submit &amp; Download Excel
                                    </Button>
                                </Col>
                            </Row>

                            <p className="text-muted small mb-0 mt-3">
                                <i className="mdi mdi-information-outline me-1"></i>
                                The report is generated on the server and downloaded as an Excel file.
                                Large months may take a few minutes to generate.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </React.Fragment>
    )
}

export default RawMIS
