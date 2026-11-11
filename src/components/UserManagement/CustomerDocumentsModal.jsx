import { useCallback, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Download, Trash2, Upload } from "lucide-react"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui"
import { authFetch } from "@/lib/http"
import { CUSTOMER_DOCUMENTS_BASE, CUSTOMER_DOCUMENTS_UPLOAD } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import CustomerDocumentsForm, { newRow } from "./CustomerDocumentsForm"

// The list endpoint's envelope isn't pinned down, so accept the usual shapes.
const toList = (json) => (Array.isArray(json) ? json : json?.results || json?.documents || json?.data || [])
const docName = (d) => d.original_name || d.file_name || d.filename || d.name || `document_${d.id}`
const docDate = (d) => {
    const raw = d.uploaded_at || d.created_at || d.created
    return raw ? new Date(raw).toLocaleDateString("en-GB") : "--"
}

/*
 * Documents of one customer: existing files (download / remove) plus an upload
 * area to add more, so documents can be added or replaced after account creation.
 */
// inline: render the same content in the page instead of a popup (the onboarding wizard does); onChanged runs after an
// upload or a removal.
const CustomerDocumentsModal = ({ customer, onClose, inline = false, onChanged }) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(false)
    const [rows, setRows] = useState(() => [newRow()])
    const [remarks, setRemarks] = useState("")
    const [uploading, setUploading] = useState(false)
    const [busyId, setBusyId] = useState(null)
    const [addOpen, setAddOpen] = useState(false) // inline mode: the Add documents popup

    const customerId = customer?.id

    const load = useCallback(async () => {
        if (!customerId) return
        setLoading(true)
        try {
            const res = await authFetch(`${CUSTOMER_DOCUMENTS_BASE}?customer_id=${customerId}`, { credentials: "include" })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            setDocs(toList(await res.json()))
        } catch (err) {
            ErrorToaster(err.message || "Could not load documents")
        } finally {
            setLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId])

    useEffect(() => {
        if (customerId) {
            setRows([newRow()])
            setRemarks("")
            load()
        } else {
            setDocs([])
        }
    }, [customerId, load])

    const upload = async () => {
        const queued = rows.filter((r) => r.file)
        if (!queued.length) return ErrorToaster("Choose at least one file")
        if (queued.some((r) => !r.type.trim())) return ErrorToaster("Every file needs a document type")
        const body = new FormData()
        body.append("customer_id", customerId)
        queued.forEach((r) => {
            body.append("files", r.file)
            body.append("document_types", r.type.trim())
        })
        if (remarks.trim()) body.append("remarks", remarks.trim())
        setUploading(true)
        try {
            const res = await authFetch(CUSTOMER_DOCUMENTS_UPLOAD, { method: "POST", body, credentials: "include" })
            if (!res.ok) throw new Error(`Upload failed (${res.status})`)
            SucceesToaster(`${queued.length} document(s) uploaded`)
            setRows([newRow()])
            setRemarks("")
            setAddOpen(false)
            load()
            onChanged?.()
        } catch (err) {
            ErrorToaster(err.message || "Upload failed")
        } finally {
            setUploading(false)
        }
    }

    const download = async (d) => {
        setBusyId(d.id)
        try {
            const res = await authFetch(`${CUSTOMER_DOCUMENTS_BASE}${d.id}/download/`, { credentials: "include" })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = docName(d)
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            ErrorToaster(err.message || "Download failed")
        } finally {
            setBusyId(null)
        }
    }

    const remove = async (d) => {
        if (!window.confirm(`Remove "${docName(d)}"? The file is kept on the server.`)) return
        setBusyId(d.id)
        try {
            const res = await authFetch(`${CUSTOMER_DOCUMENTS_BASE}${d.id}/remove/`, { method: "POST", credentials: "include" })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            SucceesToaster("Document removed")
            load()
            onChanged?.()
        } catch (err) {
            ErrorToaster(err.message || "Remove failed")
        } finally {
            setBusyId(null)
        }
    }

    const uploadButton = (
        <Button color="success" disabled={uploading} onClick={upload} className="flex items-center gap-2">
            {uploading ? <Spinner size="sm" /> : <Upload size={15} />} Upload
        </Button>
    )

    const addForm = (
        <CustomerDocumentsForm
            documents={rows}
            setDocuments={setRows}
            remarks={remarks}
            setRemarks={setRemarks}
            title="Add documents"
            hint="Pick a type and a file for each new document, then press Upload."
        />
    )

    const content = (
        <>
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h5 className="m-0 text-[14px] font-semibold">Uploaded documents</h5>
                    {inline && <Button size="sm" color="primary" onClick={() => setAddOpen(true)}>Add documents</Button>}
                </div>
                {loading ? (
                    <div className="flex items-center gap-2 text-ink-muted"><Spinner size="sm" /> Loading…</div>
                ) : docs.length === 0 ? (
                    <p className="text-[13px] text-ink-muted">No documents uploaded yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                                <tr className="text-left text-ink-muted">
                                    <th className="py-1 pr-3">Type</th>
                                    <th className="py-1 pr-3">File</th>
                                    <th className="py-1 pr-3">Date</th>
                                    <th className="py-1 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((d) => (
                                    <tr key={d.id} className="border-t border-line">
                                        <td className="py-1.5 pr-3 font-semibold">{d.document_type || "--"}</td>
                                        <td className="max-w-[16rem] truncate py-1.5 pr-3">{docName(d)}</td>
                                        <td className="whitespace-nowrap py-1.5 pr-3">{docDate(d)}</td>
                                        <td className="whitespace-nowrap py-1.5 text-right">
                                            <Button size="sm" color="primary" outline disabled={busyId === d.id} title="Download" aria-label="Download document" onClick={() => download(d)}>
                                                <Download size={14} />
                                            </Button>{" "}
                                            <Button size="sm" color="danger" outline disabled={busyId === d.id} title="Remove" aria-label="Remove document" onClick={() => remove(d)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!inline && <hr className="my-4 border-line" />}
                {!inline && addForm}
        </>
    )

    if (inline) {
        return (
            <div>
                {content}
                <Modal isOpen={addOpen} toggle={() => setAddOpen(false)} size="lg" centered scrollable>
                    <ModalHeader toggle={() => setAddOpen(false)}>Add documents</ModalHeader>
                    <ModalBody>{addForm}</ModalBody>
                    <ModalFooter>
                        <Button color="secondary" outline onClick={() => setAddOpen(false)}>Cancel</Button>
                        {uploadButton}
                    </ModalFooter>
                </Modal>
            </div>
        )
    }

    return (
        <Modal isOpen={!!customer} toggle={onClose} size="lg" centered scrollable>
            <ModalHeader toggle={onClose}>Customer Documents — {customer?.customer_name || customer?.username || ""}</ModalHeader>
            <ModalBody>{content}</ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={onClose}>Close</Button>
                {uploadButton}
            </ModalFooter>
        </Modal>
    )
}

CustomerDocumentsModal.propTypes = {
    customer: PropTypes.object,
    onClose: PropTypes.func,
    inline: PropTypes.bool,
    onChanged: PropTypes.func,
}

export default CustomerDocumentsModal
