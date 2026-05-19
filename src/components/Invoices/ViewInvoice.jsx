import { Modal, ModalBody, ModalHeader } from "reactstrap"
import InvoiceGenerator from "../../PdfComponents/InvoiceGenerator"

const ViewInvoice = ({ isOpen, toggle, invoiceData, downloadUrl }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl">
            <ModalHeader toggle={toggle}>
                View Invoice
            </ModalHeader>
            <ModalBody>
            
                <InvoiceGenerator invoiceData={invoiceData} downloadUrl={downloadUrl} />
            </ModalBody>
        </Modal>
    )
}

export default ViewInvoice