import { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import { Plus, Trash2, Paperclip } from "lucide-react"
import { Button, Input, Label } from "@/components/ui"
import { authFetch } from "@/lib/http"
import { CUSTOMER_DOCUMENT_TYPES } from "../../api"

// Starter list so the type box is useful before the server has any history.
const DEFAULT_TYPES = ["Agreement", "PAN Card", "GST Certificate", "Cancelled Cheque", "KYC"]

let rowSeq = 0
const newRow = () => ({ key: ++rowSeq, type: "", file: null })

/*
 * Customer documents queued during account creation. Files are only held here;
 * they are uploaded by AddUser once the customer exists (the upload API needs
 * the new customer's id).
 */
const CustomerDocumentsForm = ({
    documents, setDocuments, remarks, setRemarks,
    title = "Upload Customer Documents",
    hint = "Optional. Pick a type and a file for each document. They are uploaded when you submit the user.",
}) => {
    const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES)
    const fileRefs = useRef({})

    useEffect(() => {
        let alive = true
        authFetch(CUSTOMER_DOCUMENT_TYPES, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                const list = Array.isArray(json) ? json : json?.types || json?.results
                if (alive && Array.isArray(list) && list.length) {
                    const names = list.map((t) => (typeof t === "string" ? t : t?.document_type || t?.name)).filter(Boolean)
                    setTypeOptions(Array.from(new Set([...DEFAULT_TYPES, ...names])))
                }
            })
            .catch(() => {})
        return () => { alive = false }
    }, [])

    const update = (key, patch) => setDocuments((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    const remove = (key) => setDocuments((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : [newRow()]))

    return (
        <div className="mt-6">
            <h4>{title}</h4>
            <p className="mb-4 text-[13px] text-ink-muted">{hint}</p>

            <div className="flex flex-col gap-3">
                {documents.map((row) => (
                    <div key={row.key} className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1.5fr_auto]">
                        <div>
                            <Label>Document Type</Label>
                            <Input
                                type="text"
                                list="customer-document-types"
                                placeholder="e.g. PAN Card"
                                value={row.type}
                                onChange={(e) => update(row.key, { type: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>File</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={(el) => { fileRefs.current[row.key] = el }}
                                    type="file"
                                    hidden
                                    onChange={(e) => update(row.key, { file: e.target.files?.[0] || null })}
                                />
                                <Button type="button" color="secondary" outline size="sm" onClick={() => fileRefs.current[row.key]?.click()} className="flex items-center gap-2">
                                    <Paperclip size={14} /> Choose file
                                </Button>
                                <span className="truncate text-[13px] text-ink-muted">{row.file ? row.file.name : "No file chosen"}</span>
                            </div>
                        </div>
                        <Button type="button" color="danger" outline size="sm" title="Remove" aria-label="Remove document" onClick={() => remove(row.key)}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                ))}
            </div>
            <datalist id="customer-document-types">
                {typeOptions.map((t) => <option key={t} value={t} />)}
            </datalist>

            <Button type="button" color="primary" outline size="sm" className="mt-3 flex items-center gap-2" onClick={() => setDocuments((rows) => [...rows, newRow()])}>
                <Plus size={14} /> Add another document
            </Button>

            <div className="mt-4">
                <Label>Remarks (optional)</Label>
                <Input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Onboarding documents" />
            </div>
        </div>
    )
}

CustomerDocumentsForm.propTypes = {
    documents: PropTypes.array.isRequired,
    setDocuments: PropTypes.func.isRequired,
    remarks: PropTypes.string,
    setRemarks: PropTypes.func.isRequired,
    title: PropTypes.string,
    hint: PropTypes.string,
}

export { newRow }
export default CustomerDocumentsForm
