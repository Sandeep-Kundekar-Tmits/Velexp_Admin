// Automated MIS — pick a date range and download the backend-generated billed-shipments Excel.
import React, { useState } from "react"
import { Button, Card, CardBody, Col, Input, Label, Row, Spinner } from "@/components/ui"
import { MdFileDownload } from "react-icons/md"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { BILLED_SHIPMENTS_EXCEL } from "../../api"

import { authFetch } from "@/lib/http";
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
            const res = await authFetch(BILLED_SHIPMENTS_EXCEL, {
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
            {/* No page-fit: a single form panel, shorter than the
                viewport, so there is no leftover height to hand out. */}
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                {/* No sticky wrapper: MainHeaderComp draws nothing inline
                    now, it hands the title to the layout's PageHeader. */}
                <MainHeaderComp title="Automated MIS" subTitle="Generate the billed-shipments MIS report for a date range" />

                <div className="container-fluid relative z-10 px-4 pb-4">
                    <Card>
                        <CardBody className="p-6">
                            <h5 className="mb-6 font-bold">Select Date Range</h5>
                            <Row className="items-end gap-4">
                                <Col md={4}>
                                    <Label className="font-bold">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        max={endDate || today}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="font-bold">End Date</Label>
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
                                        className="flex items-center justify-center gap-2"
                                    >
                                        {downloading
                                            ? <><Spinner size="sm" /> Generating...</>
                                            : <><MdFileDownload size={18} /> Submit &amp; Download Excel</>
                                        }
                                    </Button>
                                </Col>
                            </Row>
                            <p className="text-ink-muted text-xs mb-0 mt-4">
                                <i className="mdi mdi-information-outline mr-1"></i>
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
