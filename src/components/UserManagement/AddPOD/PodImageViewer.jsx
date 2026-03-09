import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

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