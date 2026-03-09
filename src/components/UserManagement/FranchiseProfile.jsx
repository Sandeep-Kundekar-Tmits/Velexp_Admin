import React from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'reactstrap';

const FranchiseProfile = ({ profile }) => (
<Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '15px' }}>
  <CardHeader className="bg-gradient-primary text-white py-3">
    <div className="d-flex justify-content-between align-items-center">
      <CardTitle tag="h4" className="mb-0">
        <i className="fas fa-store me-2"></i>
        Franchise Profile
      </CardTitle>
      <Badge pill color={profile?.status === 'Active' ? 'success' : 'danger'}>
        {profile?.status}
      </Badge>
    </div>
  </CardHeader>
  
  <CardBody className="p-0">
    <ListGroup flush>
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <i className="fas fa-signature text-primary me-3"></i>
          <span className="fw-bold">Franchise Name</span>
        </div>
        <span className="text-dark">{profile?.franchise_name}</span>
      </ListGroupItem>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3 ">
        <div className="d-flex align-items-center">
          <i className="fas fa-barcode text-primary me-3"></i>
          <span className="fw-bold">Franchise Code</span>
        </div>
        <Badge color="info" pill>{profile?.franchise_code}</Badge>
      </ListGroupItem>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <i className="fas fa-user-tie text-primary me-3"></i>
          <span className="fw-bold">Contact Person</span>
        </div>
        <span>{profile?.contact_person}</span>
      </ListGroupItem>
      
      <div className="row g-0">
        <div className="col-md-6">
          <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-city text-primary me-3"></i>
              <span className="fw-bold">City</span>
            </div>
            <span>{profile?.city}</span>
          </ListGroupItem>
        </div>
        <div className="col-md-6">
          <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
            <div className="d-flex align-items-center">
              <i className="fas fa-map-marked-alt text-primary me-3"></i>
              <span className="fw-bold">State</span>
            </div>
            <span>{profile?.state}</span>
          </ListGroupItem>
        </div>
      </div>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <i className="fas fa-map-pin text-primary me-3"></i>
          <span className="fw-bold">Pincode</span>
        </div>
        <span>{profile?.pincode}</span>
      </ListGroupItem>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3 ">
        <div className="d-flex align-items-center">
          <i className="fas fa-phone-alt text-primary me-3"></i>
          <span className="fw-bold">Phone</span>
        </div>
        <a href={`tel:${profile?.telephone1}`} className="text-decoration-none">
          {profile?.telephone1}
        </a>
      </ListGroupItem>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <i className="fas fa-calendar-day text-primary me-3"></i>
          <span className="fw-bold">Start Date</span>
        </div>
        <span>{new Date(profile?.start_date).toLocaleDateString()}</span>
      </ListGroupItem>
      
      <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          <i className="fas fa-envelope text-primary me-3"></i>
          <span className="fw-bold">Email Booking Info</span>
        </div>
        <Badge color={profile?.email_booking_info ? 'success' : 'secondary'}>
          {profile?.email_booking_info ? 'Enabled' : 'Disabled'}
        </Badge>
      </ListGroupItem>
    </ListGroup>
  </CardBody>
  
  {/* <CardFooter className="bg-light d-flex justify-content-end py-2">
    <Button color="primary" size="sm" className="me-2">
      <i className="fas fa-edit me-1"></i> Edit Profile
    </Button>
    <Button color="secondary" size="sm" outline>
      <i className="fas fa-print me-1"></i> Print
    </Button>
  </CardFooter> */}
</Card>
);

export default FranchiseProfile;
