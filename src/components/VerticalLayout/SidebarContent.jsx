import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import { FaUser, FaCrown, FaUserTie, FaBox } from "react-icons/fa";
// //Import Scrollbar
import "../../Sidebar.css"
import SimpleBar from "simplebar-react";
import { LiaFileInvoiceSolid } from "react-icons/lia";

// MetisMenu
import MetisMenu from "metismenujs";
import { Link, useLocation } from "react-router-dom";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import { useCallback } from "react";
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";

const SidebarContent = (props) => {
  const ref = useRef();
  const path = useLocation();

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];
    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.length && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    const metisMenu = new MetisMenu("#side-menu");
    activeMenu();

    // Cleanup on component unmount
    return () => {
      metisMenu.dispose();
    };
  }, []);


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }




  const { 
    canCreateUser, canAddPod, canCreateReport, invoice, canSeeBooking, 
    canAccessNewFeatures, isAdmin, canAccessPrivileges, canTrackAWB, canApproveRTO, canAccessITrack 
  } = checkCustomerPermissions()

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu" >
          <ul className="metismenu list-unstyled " id="side-menu">
            {/* <li className="menu-title">{props.t("Menu")} </li> */}
            {/* <li>
              <Link to="/#" className="has-arrow">
                <i className="bx bx-home-circle"></i>
                <span>{props.t("Dashboards")}</span>
              </Link> 
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="/dashboard">{props.t("Default")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Saas")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Crypto")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Blog")}</Link>
                </li>
                <li>
                  <Link to="#">
                    {props.t("Job")}
                  </Link>
                </li>
              </ul>
            </li> */}

            {
              canAddPod && <li>
                <Link to="/add-pod" className=" ">
                  <i className="bx bx-upload"></i>
                  <span>{props.t("Add POD")}</span>
                </Link>
              </li>
            }

            {/* <li>
              <Link to="/corporate-customers">
                <i className="bx bx-buildings"></i>
                <span>{props.t("Corporate Customers")}</span>
              </Link>
            </li> */}

            {
              canCreateReport && <li className="">
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-file"></i>
                  <span>{props.t("Reports")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {/* <li>
                    <Link to="/admin-booking-download">{props.t("Report-1")}</Link>
                  </li>
                  <li>
                    <Link to="/customer-service">{props.t("Report-2")}</Link>
                  </li>
                  <li>
                    <Link to="/customer-service-employee">{props.t("Report-3")}</Link>
                  </li> */}

                  {/*  */}

                  {/* <li>
                    <Link to="/customer-performance">{props.t("Customer Performance")}</Link>
                  </li> */}
                  {/* <li>
                    <Link to="/operation-performance">{props.t("Operation Performance")}</Link>
                  </li>  */}



                  {/* <li>
                    <Link to="/last-mile-operation">{props.t("Delivery Strike Rate")}</Link>
                  </li>
                  <li>
                    <Link to="/first-mile-operation">{props.t("Pickup Strike Rate")}</Link>
                  </li>
                  <li>
                    <Link to="/ofd-operations-performance">{props.t("OFD Operations Performance")}</Link>
                  </li> */}


                  {/* sub menu */}

                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Operation Performance")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      <li>
                        <Link to="/last-mile-operation">{props.t("Delivery Strike Rate (FDSR)")}</Link>
                      </li>
                      <li>
                        <Link to="/first-mile-operation">{props.t("Pickup Strike Rate (FPSR)")}</Link>
                      </li>
                      <li>
                        {/* <Link to="/ofd-operations-performance">{props.t("OFD Operations Performance (FASR)")}</Link> */}
                      </li>
                      <li>
                        <Link to="/attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li>
                      {/* <li>
                        <Link to="/operation-attempt-wise-pickup-performance">{props.t(" Operation Attempt-wise Pickup Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>

                  {/* Customer Performance */}

                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Customer Performance")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      <li>
                        <Link to="/last-mile-customer-performance">{props.t("Delivery Strike Rate (FDSR)")}</Link>
                      </li>
                      <li>
                        <Link to="/first-mile-customer-performance">{props.t("Pickup Strike Rate (FPSR)")}</Link>
                      </li>
                      <li>
                        {/* <Link to="/ofd-customer-operations-performance">{props.t("OFP Performance (FASR)")}</Link> */}
                      </li>
                      <li>
                        <Link to="/customer-attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li>
                      {/* <li>
                        <Link to="/customer-attempt-wise-pickup-performance">{props.t("Customer Attempt-wise Delivery Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>

                  {/* others */}
                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Others")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      <li>
                        <Link to="/pending-report">{props.t("Pending Report")}</Link>
                      </li>
                      <li>
                        <Link to="/pickup-performance">{props.t("Pickup Performance")}</Link>
                      </li>
                      <li>
                        <Link to="/status-update">{props.t("Status Update")}</Link>
                      </li>

                      <li>
                        <Link to="/cd-update">{props.t("CD Update")}</Link>
                      </li>
                      <li>
                        <Link to="/customer-performance">{props.t("Customer Performance")}</Link>
                      </li>
                      <li>
                        <Link to="/performance-report">{props.t("Performance Report")}</Link>
                      </li>
                      {/* <li>
                        <Link to="/status-update-audit">{props.t("Status Update Audit")}</Link>
                      </li> */}

                      {/* <li>
                        <Link to="/attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>
                  <li>
                    <Link to="/status-update-audit">{props.t("Status Update Audit")}</Link>
                  </li>
                  <li>
                    <Link to="/productivity-report">{props.t("Productivity Report")}</Link>
                  </li>
                </ul>
              </li>
            }

            {/* {
              canCreateReport && <li>
                <Link to="/performance-report" className="has">
                  <i className="bx bx-bar-chart-alt-2"></i>
                  <span>{props.t("Performance Report")}</span>
                </Link>
              </li>
            } */}





            {/* <li>
              <Link to="/admin-booking-download">
                <i className="bx bx-download"></i>
                <span>{props.t("Admin Booking Download")}</span>
              </Link>
            </li>

            <li>
              <Link to="/customer-service">
                <i className="bx bx-download"></i>
                <span>{props.t("Customer Services")}</span>
              </Link>
            </li> */}



            {
              canCreateUser && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-user"></i>
                  <span>{props.t("Customers")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/user-list">{props.t("Customer List")}</Link>
                  </li>

                  {/*   need to deside were to keep till that time keep  it  in admin */}
                  {/* <li>
                    <Link to="/customer_pincode">{props.t("Customer Picode")}</Link>
                  </li> */}
                  <li>
                    <Link to="/customer-rate-data">{props.t("Rate Data")}</Link>
                  </li>
                  <li>
                    <Link to="/retail-pincode">{props.t("Retail Pincode")}</Link>
                  </li>
                  <li>
                    <Link to="/franchise-pincode">{props.t("Franchise Pincode")}</Link>
                  </li>
                  <li>
                    <Link to="/corporate-pincode">{props.t("Corporate Pincode")}</Link>
                  </li>

                  {/*  rate datas */}
                  <li>
                    <Link to="/corporate-rate-data">{props.t("Corporate Rate Data")}</Link>
                  </li>
                  <li>
                    <Link to="/retail-rate-data">{props.t("Retail Rate Data")}</Link>
                  </li>
                  <li>
                    <Link to="/franchise-rate-data">{props.t("Franchise Rate Data")}</Link>
                  </li>
                  <li>
                    <Link to="/intl-rate-data">{props.t("International Rates")}</Link>
                  </li>
                  <li>
                    <Link to="/intl-pincode">{props.t("International Pincodes")}</Link>
                  </li>
                  {/* yet to show */}
                  {/* <li>
                    <Link to="/int-rate-data">{props.t("INTL Rate Upload")}</Link>
                  </li> */}
                </ul>
              </li>
            }

            {
              canCreateUser && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-globe"></i>
                  <span>{props.t("International Billing")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/intl-rate-data">{props.t("International Rates")}</Link>
                  </li>
                  <li>
                    <Link to="/intl-pincode">{props.t("International Pincodes")}</Link>
                  </li>
                </ul>
              </li>
            }

            {
              canSeeBooking &&
              <>
                {/* <Link to="/delivary-warehouse" className="has-arrow">
                  <i className="bx bx-file"></i>
                  <span>{props.t("Delivery Warehouse")}</span>
                </Link> */}
                {/* <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-user"></i>
                    <span>{props.t("Employee")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/">{props.t("Attendance")}</Link>
                    </li>

                  </ul>
                </li> */}

                {/* invoices */}
                {/* <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-file"></i>
                    <span>{props.t("Invoices")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
               
                    <li>
                      <Link to="/franchise_invoice">{props.t("Franchise Invoices")}</Link>
                    </li>
                  
                    <li>
                      <Link to="/edit_invoice">{props.t("Edit Invoices")}</Link>
                    </li>
                  </ul>
                </li> */}


                {/* Booking */}
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-book"></i>
                    <span>{props.t("Booking")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {/* <li>
                      <Link to="/domestic_booking">{props.t("Domestic Boking")}</Link>
                    </li> */}
                    {/* <li>
                      <Link to="/corporate-booking">{props.t("Corporate Booking")}</Link>
                    </li> */}
                    <li>
                      <Link to="/service-provider-booking">{props.t("Service Provider Booking")}</Link>
                    </li>
                    {/* <li>
                      <Link to="/sales-booking">{props.t("Sales Booking")}</Link>
                    </li> */}
                  </ul>
                </li>
              </>
            }

            {
              invoice &&
              <>


                {/* invoices */}
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-file"></i>
                    <span>{props.t("Invoices")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/franchise_invoice">{props.t("Franchise Billing")}</Link>
                    </li>
                    <li>
                      <Link to="/manual_invoice">{props.t("Manual Billing")}</Link>
                    </li>
                    <li>
                      <Link to="/corporate-billing">{props.t("Corporate Bills")}</Link>
                    </li>
                    {/* edit_invoice */}
                    <li>
                      <Link to="/edit_invoice">{props.t("Download Invoices")}</Link>
                    </li>
                    <li>
                      <Link to="/mark-invoice-no">{props.t("Mark Invoice Number")}</Link>
                    </li>
                  </ul>
                </li>
              </>
            }

            {
              //  only for admin
              (canCreateUser && canAddPod && canCreateReport && invoice && canSeeBooking)
              &&
              <>
                <li>
                  <Link to="/delhivery-warehouse" className="has">
                    <i className="bx bx-package"></i>
                    <span>{props.t("Delhivery Warehouse")}</span>
                  </Link>
                </li>


                {/*  payment details */}
                <li>
                  <Link to="/payment-deatils" className="has">
                    <i className='bx bx-credit-card'></i>
                    <span>{props.t("Payment Details")}</span>
                  </Link>
                </li>

                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-file"></i>
                    <span>{props.t("Revenue")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/revenue-report">{props.t("Revenue Report")}</Link>
                    </li>
                    <li>
                      <Link to="/mis-tally">{props.t("MIS Tally")}</Link>
                    </li>
                    <li>
                      <Link to="/cod-report">{props.t("COD Report")}</Link>
                    </li>
                  </ul>
                </li>
              </>
            }

            {
              canAccessNewFeatures &&
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-receipt"></i>
                  <span>{props.t("Billing")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/bill-master">{props.t("Customer Billing")}</Link>
                  </li>
                  <li>
                    <Link to="/shipment-billing">{props.t("Shipment Billing")}</Link>
                  </li>
                  <li>
                    <Link to="/billing-working">{props.t("Billing Working")}</Link>
                  </li>
                  <li>
                    <Link to="/invoice-flow">{props.t("Invoice Flow")}</Link>
                  </li>
                  <li>
                    <Link to="/all-booking">{props.t("All Booking")}</Link>
                  </li>
                </ul>
              </li>
            }

            {
              isAdmin &&
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-map-alt"></i>
                    <span>{props.t("Trip Management")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/employee-attendance">{props.t("Employee Trip Details")}</Link>
                    </li>
                    <li>
                      <Link to="/trip-detail">{props.t("Ops Trip Management")}</Link>
                    </li>
                  </ul>
                </li>
            }
            
            {
              isAdmin &&
                <li>
                  <Link to="/pop-reconcilation" className="has">
                    <i className="bx bx-shuffle"></i>
                    <span>{props.t("POP Reconciliation")}</span>
                  </Link>
                </li>
            }

            {
              isAdmin &&
                <li>
                  <Link to="/awb-print" className="has">
                    <i className="bx bx-printer"></i>
                    <span>{props.t("AWB Label Print")}</span>
                  </Link>
                </li>
            }

            {
              isAdmin &&
                <li>
                  <Link to="/inscan-weight" className="has">
                    <i className="bx bx-ruler"></i>
                    <span>{props.t("InScan Weight")}</span>
                  </Link>
                </li>
            }

            {
              canApproveRTO &&
                <li>
                  <Link to="/rto-approval" className="has">
                    <i className="bx bx-check-shield"></i>
                    <span>{props.t("RTO Approval")}</span>
                  </Link>
                </li>
            }

            {
              isAdmin &&
                <li>
                  <Link to="/cod-reconciliation" className="has">
                    <i className="bx bx-money"></i>
                    <span>{props.t("COD Reconciliation")}</span>
                  </Link>
                </li>
            }

            {
              canTrackAWB &&
                <li>
                  <Link to="/tracking" className="has">
                    <i className="bx bx-search-alt-2 "></i>
                    <span>{props.t("Track AWB")}</span>
                  </Link>
                </li>
            }

            {
              canAccessITrack &&
                <li>
                  <Link to="/itrack" className="has">
                    <i className="bx bx-barcode"></i>
                    <span>{props.t("ITrack")}</span>
                  </Link>
                </li>
            }

            {
              canAccessPrivileges &&
                <li>
                  <Link to="/privileges" className="has">
                    <i className="bx bx-shield-quarter"></i>
                    <span>{props.t("Privileges")}</span>
                  </Link>
                </li>
            }
          </ul>
        </div>

      </SimpleBar>
    </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withRouter(withTranslation()(SidebarContent));
