import React from 'react';
import { Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'reactstrap';

const AddressList = ({ addresses }) => (
    <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
    <CardHeader className="bg-info text-white py-3">
        <CardTitle tag="h4" className="mb-0 d-flex align-items-center">
            <i className="fas fa-map-marker-alt me-2"></i>
            Address Details
        </CardTitle>
    </CardHeader>
    <CardBody className="p-0">
        {addresses?.map((addr, index) => (
            <div key={addr.id} className={index !== addresses.length - 1 ? "border-bottom" : ""}>
                <ListGroup flush>
                    <ListGroupItem className="d-flex align-items-center p-3">
                        <i className="fas fa-home me-3 text-muted"></i>
                        <div>
                            <h6 className="mb-1 fw-bold">Address {index + 1}</h6>
                            <p className="mb-1">{addr?.address}</p>
                            <p className="mb-1">{addr?.city}, {addr?.state}, {addr?.country}</p>
                            <div className="d-flex align-items-center mt-2">
                                <span className="badge bg-light text-dark me-2">
                                    <i className="fas fa-map-pin me-1"></i> {addr?.pincode}
                                </span>
                                {addr.is_default && (
                                    <span className="badge bg-success">
                                        <i className="fas fa-check-circle me-1"></i> Default
                                    </span>
                                )}
                            </div>
                        </div>
                    </ListGroupItem>
                </ListGroup>
                {index !== addresses?.length - 1 && <div className="px-3 py-1 bg-light"></div>}
            </div>
        ))}
    </CardBody>

</Card>
);

export default AddressList;
