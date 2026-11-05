// Logs tab: audit trail of one AWB. Arriving from "View logs of this batch" shows that batch instead,
// as a removable tag next to the AWB box.
import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Button, Input, Label, Spinner } from "@/components/ui"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { rawRequest } from "@/lib/http"
import { SHIPMENT_TRANSFER_LOGS } from "../../../api"
import { errText } from "../invoiceConfigHelpers"
import ResultPanel from "./ResultPanel"

const LogsTab = ({ batchFilter, onBatchFilterUsed }) => {
    const { ErrorToaster } = ToasterProvider()
    const [awb, setAwb] = useState("")
    const [batchId, setBatchId] = useState("") // only set by the "View logs of this batch" link
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState(null)
    const [searched, setSearched] = useState(false)

    const load = useCallback(async (filters) => {
        const params = new URLSearchParams()
        if (filters.awb) params.set("awb", filters.awb)
        if (filters.batchId) params.set("batch_id", filters.batchId)
        if (!params.toString()) { ErrorToaster("Enter an AWB to search"); return }
        setLoading(true)
        try {
            const { ok, data: body } = await rawRequest(`${SHIPMENT_TRANSFER_LOGS}?${params.toString()}`, { method: "GET" })
            if (!ok) {
                ErrorToaster(errText(body, "Failed to load logs"))
                setData(null)
                return
            }
            setData(body)
            setSearched(true)
        } catch {
            ErrorToaster("Failed to load logs")
        } finally {
            setLoading(false)
        }
    }, [])

    const search = () => load({ awb: awb.trim(), batchId })

    // Arriving from "View logs of this batch" on the other tabs: search that batch straight away.
    useEffect(() => {
        if (!batchFilter) return
        setBatchId(batchFilter)
        setAwb("")
        load({ awb: "", batchId: batchFilter })
        onBatchFilterUsed?.()
    }, [batchFilter, load, onBatchFilterUsed])

    return (
        <div>
            <div className="rounded-md border border-white/8 p-2.5">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex w-full flex-col gap-1 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">AWB</Label>
                        <Input value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="VIN0012345" onKeyDown={(e) => e.key === "Enter" && search()} />
                    </div>
                    <Button color="primary" onClick={search} disabled={loading} style={{ height: "2.25rem" }}>
                        {loading ? <><Spinner size="sm" /> Loading...</> : "Search"}
                    </Button>
                    {batchId && (
                        <span className="flex h-9 items-center gap-2 rounded-full border border-brand-500 px-3 text-xs font-bold text-brand-500">
                            Batch: {batchId}
                            <button
                                type="button"
                                aria-label="Remove batch filter"
                                title="Remove batch filter"
                                onClick={() => { setBatchId(""); setData(null); setSearched(false) }}
                                style={{ border: 0, background: "transparent", color: "inherit", fontSize: 16, lineHeight: 1, cursor: "pointer" }}
                            >
                                &times;
                            </button>
                        </span>
                    )}
                </div>
            </div>

            {searched && <ResultPanel title="Transfer logs" data={data} />}
            {!searched && <p className="mt-3 text-ink-muted">Enter an AWB to see its transfer history.</p>}
        </div>
    )
}

LogsTab.propTypes = {
    batchFilter: PropTypes.string,
    onBatchFilterUsed: PropTypes.func,
}

export default LogsTab
