import React from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, ListGroup, ListGroupItem } from "@/components/ui";

/*
 * `new Date(undefined).toLocaleDateString()` is the string "Invalid Date", so
 * a franchise with no start date on file displayed exactly that. Guarded, and
 * fixed to dd/MM/yyyy rather than whatever order the browser locale picks --
 * every other date on the app is written that way.
 */
const fmtDate = (v) => {
  if (!v) return "--";
  const d = new Date(typeof v === "string" ? v.replace(" ", "T") : v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const FranchiseProfile = ({ profile }) => (
<Card className="mb-4 overflow-hidden">
  <CardHeader className="border-b border-white/8 bg-white/3 py-3">
    <div className="flex justify-between items-center">
      <CardTitle tag="h4" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-white">
        <i className="fas fa-store mr-2"></i>
        Franchise Profile
      </CardTitle>
      <Badge pill color={profile?.status === 'Active' ? 'success' : 'danger'}>
        {profile?.status}
      </Badge>
    </div>
  </CardHeader>
  
  <CardBody className="p-0">
    <ListGroup flush>
      <ListGroupItem className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <i className="fas fa-signature text-brand-500 mr-4"></i>
          <span className="font-bold">Franchise Name</span>
        </div>
        <span className="text-ink">{profile?.franchise_name}</span>
      </ListGroupItem>
      
      <ListGroupItem className="flex justify-between items-center p-4 ">
        <div className="flex items-center">
          <i className="fas fa-barcode text-brand-500 mr-4"></i>
          <span className="font-bold">Franchise Code</span>
        </div>
        <Badge color="info" pill>{profile?.franchise_code}</Badge>
      </ListGroupItem>
      
      <ListGroupItem className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <i className="fas fa-user-tie text-brand-500 mr-4"></i>
          <span className="font-bold">Contact Person</span>
        </div>
        <span>{profile?.contact_person}</span>
      </ListGroupItem>
      
      <div className="row gap-0">
        <div className="col-md-6">
          <ListGroupItem className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <i className="fas fa-city text-brand-500 mr-4"></i>
              <span className="font-bold">City</span>
            </div>
            <span>{profile?.city}</span>
          </ListGroupItem>
        </div>
        <div className="col-md-6">
          <ListGroupItem className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <i className="fas fa-map-marked-alt text-brand-500 mr-4"></i>
              <span className="font-bold">State</span>
            </div>
            <span>{profile?.state}</span>
          </ListGroupItem>
        </div>
      </div>
      
      <ListGroupItem className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <i className="fas fa-map-pin text-brand-500 mr-4"></i>
          <span className="font-bold">Pincode</span>
        </div>
        <span>{profile?.pincode}</span>
      </ListGroupItem>
      
      <ListGroupItem className="flex justify-between items-center p-4 ">
        <div className="flex items-center">
          <i className="fas fa-phone-alt text-brand-500 mr-4"></i>
          <span className="font-bold">Phone</span>
        </div>
        <a href={`tel:${profile?.telephone1}`} className="no-underline">
          {profile?.telephone1}
        </a>
      </ListGroupItem>
      
      <ListGroupItem className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <i className="fas fa-calendar-day text-brand-500 mr-4"></i>
          <span className="font-bold">Start Date</span>
        </div>
        <span className="text-ink">{fmtDate(profile?.start_date)}</span>
      </ListGroupItem>
      
      <ListGroupItem className="flex justify-between items-center p-4">
        <div className="flex items-center">
          <i className="fas fa-envelope text-brand-500 mr-4"></i>
          <span className="font-bold">Email Booking Info</span>
        </div>
        <Badge color={profile?.email_booking_info ? 'success' : 'secondary'}>
          {profile?.email_booking_info ? 'Enabled' : 'Disabled'}
        </Badge>
      </ListGroupItem>
    </ListGroup>
  </CardBody>
  
  {/* <CardFooter className="bg-canvas flex justify-end py-2">
    <Button color="primary" size="sm" className="mr-2">
      <i className="fas fa-edit mr-1"></i> Edit Profile
    </Button>
    <Button color="secondary" size="sm" outline>
      <i className="fas fa-print mr-1"></i> Print
    </Button>
  </CardFooter> */}
</Card>
);

export default FranchiseProfile;
