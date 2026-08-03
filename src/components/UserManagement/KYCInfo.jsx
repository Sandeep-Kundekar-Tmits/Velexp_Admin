import React from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui";

const KYCInfo = ({ kyc_document }) => (
    <Card className="mb-6 shadow-sm" style={{ borderRadius: '12px' }}>
    <CardHeader className="bg-warning-500 text-ink py-4">
      <CardTitle tag="h4" className="mb-0 flex items-center">
        <i className="fas fa-id-card mr-2"></i>
        KYC Verification
      </CardTitle>
    </CardHeader>
    <CardBody className="text-center">
      {kyc_document ? (
        <>
          <div className="relative mb-4" style={{ border: '1px dashed #dee2e6', borderRadius: '8px', padding: '1rem' }}>
            <img 
              src={kyc_document} 
              alt="KYC Document" 
              className="img-fluid rounded" 
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            {/* <div className="absolute top-0 end-0 mt-2 mr-2">
              <Button color="light" size="sm" className="shadow-sm">
                <i className="fas fa-expand"></i>
              </Button>
            </div> */}
          </div>
          {/* <div className="flex justify-center gap-2">
            <Button color="success" size="sm" className="px-4">
              <i className="fas fa-check mr-1"></i> Approve
            </Button>
            <Button color="danger" size="sm" className="px-4">
              <i className="fas fa-times mr-1"></i> Reject
            </Button>
            <Button color="primary" size="sm" className="px-4">
              <i className="fas fa-download mr-1"></i> Download
            </Button>
          </div> */}
        </>
      ) : (
        <div className="py-6">
          <i className="fas fa-cloud-upload-alt fa-3x text-ink-muted mb-4"></i>
          <h5 className="text-ink-muted">No KYC Document Uploaded</h5>
          <p className="text-ink-muted mb-4">Please upload your KYC document for verification</p>
          <Button color="warning" className="px-6">
            <i className="fas fa-upload mr-1"></i> Upload Document
          </Button>
        </div>
      )}
    </CardBody>
 
  </Card>
);

export default KYCInfo;
