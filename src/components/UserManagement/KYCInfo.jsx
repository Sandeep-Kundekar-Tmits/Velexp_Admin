import React from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from 'reactstrap';

const KYCInfo = ({ kyc_document }) => (
    <Card className="mb-4 shadow-sm" style={{ borderRadius: '12px' }}>
    <CardHeader className="bg-warning text-dark py-3">
      <CardTitle tag="h4" className="mb-0 d-flex align-items-center">
        <i className="fas fa-id-card me-2"></i>
        KYC Verification
      </CardTitle>
    </CardHeader>
    <CardBody className="text-center">
      {kyc_document ? (
        <>
          <div className="position-relative mb-3" style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '1rem' }}>
            <img 
              src={kyc_document} 
              alt="KYC Document" 
              className="img-fluid rounded" 
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            {/* <div className="position-absolute top-0 end-0 mt-2 me-2">
              <Button color="light" size="sm" className="shadow-sm">
                <i className="fas fa-expand"></i>
              </Button>
            </div> */}
          </div>
          {/* <div className="d-flex justify-content-center gap-2">
            <Button color="success" size="sm" className="px-3">
              <i className="fas fa-check me-1"></i> Approve
            </Button>
            <Button color="danger" size="sm" className="px-3">
              <i className="fas fa-times me-1"></i> Reject
            </Button>
            <Button color="primary" size="sm" className="px-3">
              <i className="fas fa-download me-1"></i> Download
            </Button>
          </div> */}
        </>
      ) : (
        <div className="py-4">
          <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No KYC Document Uploaded</h5>
          <p className="text-muted mb-3">Please upload your KYC document for verification</p>
          <Button color="warning" className="px-4">
            <i className="fas fa-upload me-1"></i> Upload Document
          </Button>
        </div>
      )}
    </CardBody>
 
  </Card>
);

export default KYCInfo;
