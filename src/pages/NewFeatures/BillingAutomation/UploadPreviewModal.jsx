// Upload a (possibly edited) working file -> preview rows/totals -> generate invoice.
import { useMemo, useState } from "react"
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Input, Label, Spinner } from "reactstrap"
import TableContainer from "../../../components/Table/TableContainer"
import usePostFileApicall from "../../../hooks/usePostFileApicall"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { CORPORATE_INVOICE_UPLOAD_PREVIEW, CORPORATE_INVOICE_GENERATE } from "../../../api"

const UploadPreviewModal = ({ isOpen, toggle, onGenerated }) => {
    const { SuccessToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: uploadPreview, loading: previewLoading } = usePostFileApicall()

    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)   // { summary, bills:[...] }
    const [updateVecom, setUpdateVecom] = useState(false)
    const [generating, setGenerating] = useState(false)

    const reset = () => {
        setFile(null)
        setPreview(null)
        setUpdateVecom(false)
    }

    const handleClose = () => {
        reset()
        toggle()
    }

    const handlePreview = async () => {
        if (!file) {
            ErrorToaster("Please choose a working file first")
            return
        }
        const fd = new FormData()
        fd.append("upload_file", file)
        const res = await uploadPreview(CORPORATE_INVOICE_UPLOAD_PREVIEW, fd)
        if (res?.status && res?.data) {
            setPreview(res.data)
        } else {
            ErrorToaster(res?.data?.error || res?.data?.msg || "Preview failed")
        }
    }

    // Generate uses multipart with the same upload_file (server reads bills from the file).
    const handleGenerate = async () => {
        if (!file) return
        setGenerating(true)
        const fd = new FormData()
        fd.append("upload_file", file)
        fd.append("update_vecom", updateVecom ? "true" : "false")
        const res = await uploadPreview(CORPORATE_INVOICE_GENERATE, fd)
        setGenerating(false)
        if (res?.status && res?.data?.invoice_id) {
            SuccessToaster(`Invoice ${res.data.invoice_number || res.data.invoice_id} created`)
            onGenerated && onGenerated()
            handleClose()
        } else {
            // already-billed AWBs -> 400
            ErrorToaster(res?.data?.error || res?.data?.msg || "Invoice generation failed")
        }
    }

    const bills = preview?.bills || []
    const summary = preview?.summary

    const billColumns = useMemo(() => {
        const sample = bills[0] || {}
        // Build columns dynamically from the first bill row (keys vary by customer).
        return Object.keys(sample).slice(0, 8).map((key) => ({
            header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            accessorKey: key,
            cell: (cell) => {
                const v = cell.getValue()
                return typeof v === "object" ? JSON.stringify(v) : (v ?? "—")
            },
        }))
    }, [bills])

    return (
        <Modal isOpen={isOpen} toggle={handleClose} size="xl" centered>
            <ModalHeader toggle={handleClose}>Upload Working File → Preview → Invoice</ModalHeader>
            <ModalBody>
                <div className="d-flex align-items-end gap-2 mb-3 flex-wrap">
                    <div className="flex-grow-1">
                        <Label className="fw-bold">Working file (.xlsx)</Label>
                        <Input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => { setFile(e.target.files[0]); setPreview(null) }}
                        />
                    </div>
                    <Button color="primary" onClick={handlePreview} disabled={previewLoading || !file}>
                        {previewLoading ? <Spinner size="sm" /> : "Preview"}
                    </Button>
                </div>

                {summary && (
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        {Object.entries(summary).map(([k, v]) => (
                            <Badge key={k} color="light" className="text-dark border p-2">
                                {k.replace(/_/g, " ")}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                            </Badge>
                        ))}
                    </div>
                )}

                {bills.length > 0 && (
                    <TableContainer
                        columns={billColumns}
                        data={bills}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search bills..."
                        pagination="pagination pagination-rounded justify-content-end mb-2"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-hover mb-0"
                    />
                )}
            </ModalBody>
            <ModalFooter className="justify-content-between">
                <div className="form-check">
                    <Input
                        type="checkbox"
                        id="updateVecom"
                        checked={updateVecom}
                        onChange={(e) => setUpdateVecom(e.target.checked)}
                    />
                    <Label for="updateVecom" className="form-check-label ms-1">Push to Vecom</Label>
                </div>
                <div className="d-flex gap-2">
                    <Button color="secondary" onClick={handleClose}>Cancel</Button>
                    <Button color="success" onClick={handleGenerate} disabled={generating || !preview}>
                        {generating ? <Spinner size="sm" /> : "Generate Invoice"}
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}

export default UploadPreviewModal
