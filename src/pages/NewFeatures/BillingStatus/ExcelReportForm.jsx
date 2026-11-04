// One form for both Billing Status tabs: pick start and end date, then download the
// backend-generated Excel for that range. Only the endpoint and file name differ per tab.
import { useState } from "react"
import PropTypes from "prop-types"
import { Button, Card, CardBody, Col, Label, Row, Spinner } from "@/components/ui"
import { MdFileDownload } from "react-icons/md"
import DateRangeInput from "../../../components/Common/DateRangeInput"
import YMD_DateFormate from "../../../helpers/YMD_DateFormate"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { authFetch } from "@/lib/http"

const ExcelReportForm = ({ endpoint, filePrefix, reportName }) => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()

    // one range picker (a single popup for start and end), starting on the current month
    const [range, setRange] = useState(() => {
        const now = new Date()
        return { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: now }
    })
    const [downloading, setDownloading] = useState(false)

    const handleGenerate = async () => {
        if (!range.startDate || !range.endDate) {
            ErrorToaster("Please select a start and end date")
            return
        }
        const { from_date: startDate, to_date: endDate } = YMD_DateFormate(range)

        setDownloading(true)
        try {
            const res = await authFetch(endpoint, {
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
                    msg = err?.error || err?.msg || err?.message || err?.detail || msg
                } catch { /* non-JSON error body */ }
                throw new Error(msg)
            }

            const blob = await res.blob()

            // An .xlsx is a zip, so it starts with "PK". Anything else (a JSON or HTML body sent with
            // a 200) would only open in Excel as a corrupt file; show what the server said instead.
            const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
            if (!(head[0] === 0x50 && head[1] === 0x4b)) {
                const text = (await blob.text()).trim()
                try {
                    // a JSON reply such as {"error": "No billed shipments found ..."}: show its message as is
                    const parsed = JSON.parse(text)
                    const msg = parsed?.error || parsed?.msg || parsed?.message || parsed?.detail
                    if (msg) throw new Error(msg)
                } catch (e) {
                    if (!(e instanceof SyntaxError)) throw e
                }
                throw new Error(`Server did not return an Excel file: ${text.slice(0, 300) || `empty response (${res.status})`}`)
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${filePrefix}_${startDate}_to_${endDate}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            SuccessToaster(`${reportName} Excel downloaded successfully`)
        } catch (err) {
            ErrorToaster(err.message || `Failed to generate ${reportName.toLowerCase()} Excel`)
        } finally {
            setDownloading(false)
        }
    }

    return (
        <Card>
            <CardBody className="p-4">
                <Row className="items-end gap-4">
                    <Col xs="auto" style={{ minWidth: 280 }}>
                        <Label className="font-bold">Date Range</Label>
                        <DateRangeInput value={range} onChange={setRange} isBorder />
                    </Col>
                    <Col xs="auto">
                        <Button
                            color="primary"
                            onClick={handleGenerate}
                            disabled={downloading}
                            className="flex items-center justify-center gap-2"
                            style={{ height: "38px", whiteSpace: "nowrap" }}
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
    )
}

ExcelReportForm.propTypes = {
    endpoint: PropTypes.string.isRequired,
    filePrefix: PropTypes.string.isRequired,
    reportName: PropTypes.string.isRequired,
}

export default ExcelReportForm
