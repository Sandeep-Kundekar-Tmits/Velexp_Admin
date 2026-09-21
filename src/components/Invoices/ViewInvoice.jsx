import { Modal, ModalBody } from "@/components/ui"
import InvoiceGenerator from "../../PdfComponents/InvoiceGenerator"

/**
 * Deliberately does not use the shared ModalHeader/dark glass Modal chrome
 * used everywhere else in the app. The invoice inside is styled as a
 * printable white paper document (text-black, black table borders), so the
 * app's normal dark glassmorphic modal background/white header text read as
 * a mismatch here specifically -- this one dialog keeps the old light look
 * instead, scoped to just this file.
 */
const ViewInvoice = ({ isOpen, toggle, invoiceData, downloadUrl }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" className="bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-3.5">
                <h5 className="text-[15px] font-semibold tracking-tight text-black">View Invoice</h5>
                <button
                    type="button"
                    onClick={toggle}
                    aria-label="Close"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-lg leading-none text-black/60 transition-colors hover:border-black/20 hover:bg-black/10 hover:text-black"
                >
                    &times;
                </button>
            </div>
            <ModalBody>
                <InvoiceGenerator invoiceData={invoiceData} downloadUrl={downloadUrl} />
            </ModalBody>
        </Modal>
    )
}

export default ViewInvoice