import { authFetch } from "@/lib/http"

// POSTs `payload` to a backend report-export endpoint and saves the xlsx
// blob it returns, the same request/blob/anchor flow MobileAppReport.jsx's
// own downloadExcel already used -- pulled out here so each "<report>/
// export/" endpoint doesn't reimplement it, now that these reports are
// generated server-side instead of client-side from already-fetched rows.
export const downloadReportExcel = async (url, payload, filename) => {
    const res = await authFetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        throw new Error(errJson?.error || errJson?.detail || `Server error: ${res.status}`)
    }
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
}
