import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

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

    return (
        <>
            <Modal isOpen={true} toggle={toggleModal} centered>
                <ModalHeader toggle={toggleModal}>POD Document</ModalHeader>
                <ModalBody className="text-center p-4">
                    <img
                        src={podValue}
                        alt="POD Document"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '60vh',
                            objectFit: 'contain'
                        }}
                        onError={(e) => {
                            e.target.src = '/path-to-fallback-image.png';
                            e.target.alt = 'Image not available';
                        }}
                    />
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