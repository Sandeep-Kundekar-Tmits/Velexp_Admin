import React, { useState } from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, ListGroup, ListGroupItem } from "@/components/ui";
import SimpleModal from '../SimpleModal';
import usePostApiCall from '../../hooks/usePostApiCall';
import { UPDATE_ACTIVE_STATUS } from '../../api';

const UserProfile = ({ user, setProfileData, userId }) => {
    const [isOpen, setIsOpen] = useState(false);

    const { apifunc, data, error, loading } = usePostApiCall(() => {
        setIsOpen(false)
    })
    let isAdmin = JSON.parse(localStorage.getItem("authUser"))?.user?.is_admin || false
    return (
        <Card className="mb-6 shadow-sm border-0 rounded" style={{ overflow: 'hidden' }}>
            <CardHeader className="bg-brand-500 text-white py-4">
                <CardTitle tag="h4" className="mb-0 flex items-center text-white">
                    <i className="fas  fa-user-circle mr-2 text-white"></i>
                    User Profile
                </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
                <ListGroup flush>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Username</span>
                        <span className="text-ink">{user?.username || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Email</span>
                        <span className="text-ink">{user?.email || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Phone</span>
                        <span className="text-ink">{user?.phone || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Account No</span>
                        <span className="text-ink">{user?.accno || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Secret Code</span>
                        <span className="text-ink">{user?.domestic_secretcode || "--"}</span>
                    </ListGroupItem>

                    <ListGroupItem className="flex justify-between items-center p-4 ">
                        <span className="font-bold font-size-16 text-ink-muted">Is Active    <Badge color="success" pill>{user?.is_active ? "true"
                            : "false"}</Badge>
                        </span>

                        {/* toggle button */}
                        {
                            isAdmin && <div className="flex items-center gap-2">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="insurance"
                                        onClick={() => {
                                            setIsOpen(true)
                                        }}
                                        checked={user?.is_active}
                                        style={{
                                            width: "40px",   // increase width
                                            height: "20px",  // increase height
                                            cursor: "pointer",
                                        }}
                                    />
                                </div>
                            </div>
                        }




                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Customer Type</span>
                        <Badge color="info">{user?.cust_type?.type_of_cust || "--"}</Badge>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Billing Type</span>
                        <span className="text-ink">{user?.billing_type || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">KYC Approved</span>
                        {user?.kyc_approved ? (
                            <Badge color="success" pill>Yes</Badge>
                        ) : (
                            <Badge color="danger" pill>No</Badge>
                        )}
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Industry</span>
                        <span className="text-ink">{user?.account_created_info?.industry || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Soft Limit</span>
                        <span className="text-ink">{user?.soft_limit || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Customer Potential</span>
                        <span className="text-ink">{user?.customer_potential || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Expected Business</span>
                        <span className="text-ink">{user?.expected_business || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Sales Head</span>
                        <span className="text-ink">{user?.sales_head || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Employee Code</span>
                        <span className="text-ink">{user?.emp_code || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-start p-4">
                        <span className="font-bold text-ink-muted">Finance Emails</span>
                        <span className="text-ink text-right">
                            {Array.isArray(user?.finance_emails) 
                                ? user.finance_emails.join(', ') 
                                : user?.finance_emails || "--"}
                        </span>
                    </ListGroupItem>
                    <ListGroupItem className="flex justify-between items-center p-4">
                        <span className="font-bold text-ink-muted">Agreement Document</span>
                        {user?.customer_agreement_doc ? (
                            <a href={user.customer_agreement_doc} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                                <i className="fas fa-file-pdf mr-1"></i> View Document
                            </a>
                        ) : (
                            <span className="text-ink">--</span>
                        )}
                    </ListGroupItem>
                </ListGroup>
            </CardBody>
            {/* <CardFooter className="bg-canvas flex justify-end">
            <Button color="primary" size="sm" className="mr-2">
                <i className="fas fa-edit mr-1"></i> Edit
            </Button>
            <Button color="secondary" size="sm">
                <i className="fas fa-download mr-1"></i> Export
            </Button>
        </CardFooter> */}

            <SimpleModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                cancelButtonName="No"
                successButtonName="Yes, Confirm"
                onCancel={() => setIsOpen(false)}
                onSuccess={async () => {
                    // api call
                    let user_updated = await apifunc(UPDATE_ACTIVE_STATUS, {
                        "user_id": userId,
                        "is_active": !user?.is_active

                    })

                    console.log(user_updated, "user_updated")

                    if (user_updated) {
                        setProfileData((profile) => {
                            return {
                                ...profile,
                                is_active: !user?.is_active
                            }
                        })
                        setIsOpen(false)
                    }
                }}
            >
                <h6>Are you sure you want to Change the Active Status?</h6>
                {/* <p className="text-ink-muted text-xs">This action cannot be undone.</p> */}
            </SimpleModal>
        </Card>
    )

};

export default UserProfile;
