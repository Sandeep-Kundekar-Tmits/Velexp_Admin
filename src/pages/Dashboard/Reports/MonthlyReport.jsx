// Monthly operational reports -- SPD, PUD, LDP, SPL-LOST. Each is a pure
// GET ?user_id=&month=YYYY-MM download, no JSON listing endpoint behind any
// of them -- so unlike the rest of this app's reports, there's no table
// here, just a month picker and one download button per report.
import { useEffect, useState } from "react"
import { Button, Card, CardBody, Input, Label } from "@/components/ui"
import { Download, FileSpreadsheet } from "lucide-react"
import { authFetch } from "@/lib/http"
import MainHeaderComp from "../../../components/MainHeaderCom"
import ToasterProvider from "../../../helpers/ToasterProvider"
import {
    MONTHLY_REPORT_SPD,
    MONTHLY_REPORT_PUD,
    MONTHLY_REPORT_LDP,
    MONTHLY_REPORT_SPL_LOST,
} from "../../../api"

const currentMonth = () => new Date().toISOString().slice(0, 7) // "YYYY-MM"

// Filenames mirror the API doc's own curl examples exactly, per report --
// LDP keeps the dash (LDP-2026-08.xlsx) where the others don't
// (SPD-REPORT-202608.xlsx), so this isn't normalised to one shared pattern.
const REPORTS = [
    {
        key: "spd",
        label: "SPD Report",
        description: "Shipments pending delivery for the selected month.",
        url: MONTHLY_REPORT_SPD,
        filename: (ym) => `SPD-REPORT-${ym.replace("-", "")}.xlsx`,
    },
    {
        key: "pud",
        label: "PUD Report",
        description: "Pending undelivered shipments for the selected month.",
        url: MONTHLY_REPORT_PUD,
        filename: (ym) => `PUD-REPORT-${ym.replace("-", "")}.xlsx`,
    },
    {
        key: "ldp",
        label: "LDP Report",
        description: "Lost/damaged parcels for the selected month.",
        url: MONTHLY_REPORT_LDP,
        filename: (ym) => `LDP-${ym}.xlsx`,
    },
    {
        key: "spl-lost",
        label: "SPL-LOST Report",
        description: "Special/lost shipments for the selected month.",
        url: MONTHLY_REPORT_SPL_LOST,
        filename: (ym) => `SPL-LOST-${ym.replace("-", "")}.xlsx`,
    },
]

const MonthlyReport = () => {
    useEffect(() => { document.title = "Monthly Report" }, [])

    const { ErrorToaster } = ToasterProvider()
    const [month, setMonth] = useState(currentMonth())
    const [downloading, setDownloading] = useState({}) // { [reportKey]: true }

    const handleDownload = async (report) => {
        if (!month) {
            ErrorToaster("Please select a month")
            return
        }
        setDownloading((prev) => ({ ...prev, [report.key]: true }))
        try {
            const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
            const userId = authUser?.user?.id
            const qs = new URLSearchParams({ user_id: userId, month }).toString()
            const res = await authFetch(`${report.url}?${qs}`, { method: "GET" })
            if (!res.ok) throw new Error(`Server error: ${res.status}`)
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = report.filename(month)
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(`${report.label} download error:`, err)
            ErrorToaster(`Failed to download ${report.label}`)
        } finally {
            setDownloading((prev) => ({ ...prev, [report.key]: false }))
        }
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Monthly Report"
                subTitle="Pick a month, then download whichever operational report you need."
            />

            <div className="container-fluid page-fit-body relative z-10 pb-4">
                <div className="flex w-full flex-col gap-1.5 sm:w-48 mb-4">
                    <Label className="form-label m-0 font-bold text-ink-muted">Month</Label>
                    <Input
                        type="month"
                        value={month}
                        max={currentMonth()}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {REPORTS.map((report) => (
                        <Card key={report.key} className="h-full">
                            <CardBody className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet aria-hidden="true" size={18} className="shrink-0 text-success-500" />
                                    <h6 className="m-0 font-semibold text-ink">{report.label}</h6>
                                </div>
                                <p className="m-0 text-[12.5px] text-ink-muted">{report.description}</p>
                                <Button
                                    color="success"
                                    className="mt-auto flex items-center justify-center gap-2"
                                    onClick={() => handleDownload(report)}
                                    disabled={!month || downloading[report.key]}
                                >
                                    <Download aria-hidden="true" size={15} />
                                    {downloading[report.key] ? "Downloading..." : "Download"}
                                </Button>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MonthlyReport
