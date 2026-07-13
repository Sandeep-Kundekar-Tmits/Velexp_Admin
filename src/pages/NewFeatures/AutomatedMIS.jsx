// Automated MIS — pick a date range and download the backend-generated billed-shipments Excel.
import React, { useState } from "react"
import { Button, Card, CardBody, Col, Input, Label, Row, Spinner } from "reactstrap"
import { MdFileDownload } from "react-icons/md"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BILLED_SHIPMENTS_EXCEL } from "../../api"

const AutomatedMIS = () => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()

    const today = new Date().toISOString().split("T")[0]
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [downloading, setDownloading] = useState(false)

    const handleGenerate = async () => {
        if (!startDate || !endDate) {
            ErrorToaster("Please select both start and end dates")
            return
        }
        if (startDate > endDate) {
            ErrorToaster("Start date cannot be after end date")
            return
        }

        setDownloading(true)
        try {
            const res = await fetch(BILLED_SHIPMENTS_EXCEL, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ start_date: startDate, end_date: endDate }),
            })

            if (!res.ok) {
                // Backend may return a JSON error instead of a file
                let msg = `Error ${res.status}`
                try {
                    const err = await res.json()
                    msg = err?.msg || err?.message || err?.detail || msg
                } catch { /* non-JSON error body */ }
                throw new Error(msg)
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `billed_shipments_${startDate}_to_${endDate}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            SuccessToaster("MIS Excel downloaded successfully")
        } catch (err) {
            ErrorToaster(err.message || "Failed to generate MIS Excel")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Automated MIS" subTitle="Generate the billed-shipments MIS report for a date range" />
                </div>

                <div className="container-fluid px-3 py-3">
                    <Card className="shadow-sm border-0">
                        <CardBody className="p-4">
                            <h5 className="mb-4 fw-bold">Select Date Range</h5>
                            <Row className="align-items-end g-3">
                                <Col md={4}>
                                    <Label className="fw-bold">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        max={endDate || today}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="fw-bold">End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        max={today}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Button
                                        color="primary"
                                        block
                                        onClick={handleGenerate}
                                        disabled={downloading}
                                        className="d-flex align-items-center justify-content-center gap-2"
                                    >
                                        {downloading
                                            ? <><Spinner size="sm" /> Generating...</>
                                            : <><MdFileDownload size={18} /> Submit &amp; Download Excel</>
                                        }
                                    </Button>
                                </Col>
                            </Row>
                            <p className="text-muted small mb-0 mt-3">
                                <i className="mdi mdi-information-outline me-1"></i>
                                The report is generated on the server and downloaded as an Excel file.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </React.Fragment>
    )
}

export default AutomatedMIS
