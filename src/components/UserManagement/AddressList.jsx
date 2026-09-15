import React from 'react';
import { Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from "@/components/ui";

const AddressList = ({ addresses }) => (
    <Card className="mb-4 overflow-hidden">
    <CardHeader className="border-b border-white/8 bg-white/3 py-3">
        <CardTitle tag="h4" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-white">
            <i className="fas fa-map-marker-alt mr-2"></i>
            Address Details
        </CardTitle>
    </CardHeader>
    <CardBody className="p-0">
        {addresses?.map((addr, index) => (
            <div key={addr.id} className={index !== addresses.length - 1 ? "border-bottom" : ""}>
                <ListGroup flush>
                    <ListGroupItem className="flex items-center p-4">
                        <i className="fas fa-home mr-4 text-ink-muted"></i>
                        <div>
                            <h6 className="mb-1 font-bold">Address {index + 1}</h6>
                            <p className="mb-1">{addr?.address}</p>
                            <p className="mb-1">{addr?.city}, {addr?.state}, {addr?.country}</p>
                            <div className="flex items-center mt-2">
                                <span className="badge bg-canvas text-ink mr-2">
                                    <i className="fas fa-map-pin mr-1"></i> {addr?.pincode}
                                </span>
                                {addr.is_default && (
                                    <span className="badge bg-success-500">
                                        <i className="fas fa-check-circle mr-1"></i> Default
                                    </span>
                                )}
                            </div>
                        </div>
                    </ListGroupItem>
                </ListGroup>
                {index !== addresses?.length - 1 && <div className="px-4 py-1 bg-canvas"></div>}
            </div>
        ))}
    </CardBody>

</Card>
);

export default AddressList;
