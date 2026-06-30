// Encapsulates: fire a batch trigger -> store batch_id -> poll billing/batch/<id>/
// until status is COMPLETED/FAILED. Handles cleanup on unmount and graceful
// handling of the 403 "disabled" response from the direct-invoice endpoint.
import { useCallback, useEffect, useRef, useState } from "react"
import { BILLING_BATCH_BASE } from "../../../api"
import ToasterProvider from "../../../helpers/ToasterProvider"

const POLL_INTERVAL_MS = 4000
const TERMINAL = ["COMPLETED", "FAILED"]

const useBatchPolling = () => {
    const { ErrorToaster, SuccessToaster } = ToasterProvider()
    const [batch, setBatch] = useState(null)        // latest batch object from the API
    const [isPolling, setIsPolling] = useState(false)
    const [isTriggering, setIsTriggering] = useState(false)
    const intervalRef = useRef(null)

    const clearPoll = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const stopPolling = useCallback(() => {
        clearPoll()
        setIsPolling(false)
    }, [clearPoll])

    const fetchBatch = useCallback(async (batchId) => {
        try {
            const res = await fetch(`${BILLING_BATCH_BASE}${batchId}/`, {
                method: "GET",
                credentials: "include",
            })
            const json = await res.json()
            const b = json?.batch || json
            if (b) setBatch(b)
            const status = b?.status?.toUpperCase()
            if (status && TERMINAL.includes(status)) {
                clearPoll()
                setIsPolling(false)
            }
            return b
        } catch (err) {
            console.log(err, "batch poll error")
            return null
        }
    }, [clearPoll])

    const startPolling = useCallback((batchId) => {
        clearPoll()
        setIsPolling(true)
        fetchBatch(batchId)                 // immediate first poll
        intervalRef.current = setInterval(() => fetchBatch(batchId), POLL_INTERVAL_MS)
    }, [clearPoll, fetchBatch])

    // Trigger one of the three POST endpoints, then begin polling.
    const startBatch = useCallback(async (triggerUrl, body = {}) => {
        setIsTriggering(true)
        setBatch(null)
        try {
            const res = await fetch(triggerUrl, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const json = await res.json()

            // direct-invoice endpoint returns 403 { status:"disabled", msg }
            if (res.status === 403 || json?.status === "disabled") {
                ErrorToaster(json?.msg || "This action is currently disabled on the server.")
                return null
            }
            if (!res.ok) {
                ErrorToaster(json?.msg || json?.error || "Failed to start batch")
                return null
            }

            const batchId = json?.batch_id || json?.batch?.id
            if (json?.batch) setBatch(json.batch)
            if (batchId) {
                SuccessToaster("Batch started")
                startPolling(batchId)
            }
            return json
        } catch (err) {
            ErrorToaster(err?.message || "Network error starting batch")
            return null
        } finally {
            setIsTriggering(false)
        }
    }, [ErrorToaster, SuccessToaster, startPolling])

    // Re-open an existing batch (history) — fetch once, and keep polling if still running.
    const openBatch = useCallback(async (batchId) => {
        const b = await fetchBatch(batchId)
        const status = b?.status?.toUpperCase()
        if (status && !TERMINAL.includes(status)) {
            startPolling(batchId)
        }
        return b
    }, [fetchBatch, startPolling])

    const reset = useCallback(() => {
        stopPolling()
        setBatch(null)
    }, [stopPolling])

    useEffect(() => () => clearPoll(), [clearPoll])

    return { batch, isPolling, isTriggering, startBatch, openBatch, stopPolling, reset }
}

export default useBatchPolling
