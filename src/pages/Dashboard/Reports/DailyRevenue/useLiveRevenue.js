// Fetches the live daily-revenue payload and auto-refreshes every 5 minutes.
// Keeps the previously loaded data visible while re-fetching (no full-page blank).
import { useCallback, useEffect, useRef, useState } from "react"
import { REVENUE_LIVE } from "../../../../api"

const REFRESH_MS = 5 * 60 * 1000 // 5 minutes

const useLiveRevenue = (date) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const intervalRef = useRef(null)

    const refresh = useCallback(async () => {
        if (!date) return
        setLoading(true)
        try {
            const res = await fetch(`${REVENUE_LIVE}?date=${date}`, {
                method: "GET",
                credentials: "include",
            })
            const json = await res.json()
            if (res.ok) setData(json)
            return json
        } catch (err) {
            console.log(err, "revenue_live error")
            return null
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => {
        // immediate fetch on mount / date change, then re-arm the interval
        refresh()
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(refresh, REFRESH_MS)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [refresh])

    return { data, loading, refresh }
}

export default useLiveRevenue
