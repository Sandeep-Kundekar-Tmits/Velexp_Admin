import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";

/**
 * PodImageViewer Component
 * A modal component used to display a POD (Proof of Delivery) image.
 * It opens in a centered modal overlay and closes when the user clicks the close button.
 *
 * @param {Object} props
 * @param {string} props.podValue - The URL or base64 string of the POD image to display.
 * @param {Function} props.toggleModal - Function to toggle the visibility of this modal (close it).
 */
const PodImageViewer = ({ podValue, toggleModal }) => {
    const [failed, setFailed] = useState(false);

    return (
        <>
            {/* lg (max-w-3xl) rather than the default md: a POD is a scanned
                document, and 512px is not enough of it to read. */}
            <Modal isOpen={true} toggle={toggleModal} centered size="lg">
                <ModalHeader toggle={toggleModal}>POD Document</ModalHeader>
                {/* flex, not text-center: Tailwind's preflight makes <img> a
                    block element, and text-align does not centre a block --
                    which is why the document sat against the left edge. */}
                <ModalBody className="flex items-center justify-center p-5">
                    {failed ? (
                        <div className="flex flex-col items-center gap-2 py-12 text-ink-muted">
                            <ImageOff aria-hidden="true" className="size-7" />
                            <p className="m-0 text-[13px]">Image not available</p>
                        </div>
                    ) : (
                        <img
                            src={podValue}
                            alt="POD Document"
                            className="max-h-[65vh] max-w-full rounded-lg border border-white/10 bg-black/20 object-contain"
                            /* State, not a swapped src: the old handler pointed
                               at a placeholder path that does not exist, so the
                               fallback itself failed to load and re-fired this
                               same handler. */
                            onError={() => setFailed(true)}
                        />
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default PodImageViewer;