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
import { checkMenuAccess } from "../../helpers/checkMenuAccess";
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu";

const SidebarContent = ({ onLinkClick, ...props }) => {
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




  const { isAdmin, canAccess, canAccessAny } = checkMenuAccess()

  // Reports > Operation Performance
  const opPerfUrls = ["/last-mile-operation", "/first-mile-operation", "/attempt-wise-delivery-performance"];
  const canAccessOperationPerformance = canAccessAny(opPerfUrls);
  // Reports > Customer Performance
  const custPerfUrls = ["/last-mile-customer-performance", "/first-mile-customer-performance", "/customer-attempt-wise-delivery-performance"];
  const canAccessCustomerPerfSub = canAccessAny(custPerfUrls);
  // Reports > Others
  const otherReportUrls = ["/pickup-performance", "/status-update", "/cd-update", "/customer-performance", "/performance-report"];
  const canAccessOtherReports = canAccessAny(otherReportUrls);
  const canAccessStatusUpdateAudit = canAccess("/status-update-audit");
  const canAccessProductivityReport = canAccess("/productivity-report");
  const canAccessReports = canAccessAny([
    ...opPerfUrls, ...custPerfUrls, ...otherReportUrls,
    "/status-update-audit", "/productivity-report",
  ]);

  // OPS Reports
  const opsReportUrls = ["/pending-report", "/mis-report"];
  const canAccessOpsReports = canAccessAny(opsReportUrls);

  // Customers
  const customerUrls = [
    "/user-list", "/customer-rate-data", "/retail-pincode", "/franchise-pincode", "/corporate-pincode",
    "/corporate-rate-data", "/retail-rate-data", "/franchise-rate-data", "/intl-rate-data", "/intl-pincode",
  ];
  const canAccessCustomers = canAccessAny(customerUrls);

  // International Billing
  const intlBillingUrls = ["/intl-rate-data", "/intl-pincode"];
  const canAccessIntlBilling = canAccessAny(intlBillingUrls);

  // Booking
  const bookingUrls = ["/service-provider-booking"];
  const canSeeBooking = canAccessAny(bookingUrls);

  // Invoices
  const invoiceUrls = ["/franchise_invoice", "/manual_invoice", "/corporate-billing", "/edit_invoice", "/mark-invoice-no"];
  const canAccessInvoices = canAccessAny(invoiceUrls);

  // Revenue
  const revenueUrls = ["/revenue-report", "/daily-revenue", "/mis-tally", "/cod-report"];
  const canAccessRevenue = canAccessAny(revenueUrls);

  // International Report
  const intlReportUrls = ["/international-mis-report", "/international-dimension-change-log"];
  const canAccessIntlReport = canAccessAny(intlReportUrls);

  // Billing (automation)
  const billingUrls = ["/bill-master", "/shipment-billing", "/billing-working", "/billing-automation", "/invoice-flow", "/all-booking"];
  const canAccessBilling = canAccessAny(billingUrls);

  // Trip Management
  const tripUrls = ["/employee-attendance", "/trip-detail"];
  const canAccessTripManagement = canAccessAny(tripUrls);

  // Ops Disputes
  const opsDisputeUrls = ["/ops-disputes/stale", "/ops-disputes", "/ops-disputes/lost"];
  const canAccessOpsDisputes = canAccessAny(opsDisputeUrls);

  // Temporarily hidden for ALL users (re-enable by restoring the isAdmin gate below)
  const showCodReconciliation = false
  const showPopReconciliation = false

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu" onClick={(e) => {
            const link = e.target.closest("a");
            if (link && !link.classList.contains("has-arrow")) onLinkClick?.();
          }}>
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
              canAccess("/add-pod") && <li>
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
              canAccessReports && <li className="">
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

                  {canAccessOperationPerformance && (
                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Operation Performance")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      {canAccess("/last-mile-operation") && (
                      <li>
                        <Link to="/last-mile-operation">{props.t("Delivery Strike Rate (FDSR)")}</Link>
                      </li>
                      )}
                      {canAccess("/first-mile-operation") && (
                      <li>
                        <Link to="/first-mile-operation">{props.t("Pickup Strike Rate (FPSR)")}</Link>
                      </li>
                      )}
                      <li>
                        {/* <Link to="/ofd-operations-performance">{props.t("OFD Operations Performance (FASR)")}</Link> */}
                      </li>
                      {canAccess("/attempt-wise-delivery-performance") && (
                      <li>
                        <Link to="/attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li>
                      )}
                      {/* <li>
                        <Link to="/operation-attempt-wise-pickup-performance">{props.t(" Operation Attempt-wise Pickup Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>
                  )}

                  {/* Customer Performance */}

                  {canAccessCustomerPerfSub && (
                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Customer Performance")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      {canAccess("/last-mile-customer-performance") && (
                      <li>
                        <Link to="/last-mile-customer-performance">{props.t("Delivery Strike Rate (FDSR)")}</Link>
                      </li>
                      )}
                      {canAccess("/first-mile-customer-performance") && (
                      <li>
                        <Link to="/first-mile-customer-performance">{props.t("Pickup Strike Rate (FPSR)")}</Link>
                      </li>
                      )}
                      <li>
                        {/* <Link to="/ofd-customer-operations-performance">{props.t("OFP Performance (FASR)")}</Link> */}
                      </li>
                      {canAccess("/customer-attempt-wise-delivery-performance") && (
                      <li>
                        <Link to="/customer-attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li>
                      )}
                      {/* <li>
                        <Link to="/customer-attempt-wise-pickup-performance">{props.t("Customer Attempt-wise Delivery Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>
                  )}

                  {/* others */}
                  {canAccessOtherReports && (
                  <li>
                    <Link to="/#" className="has-arrow">
                      {/* <i className="bx bx-file"></i> */}
                      <span>{props.t("Others")}</span>
                    </Link>
                    <ul className="sub-menu" aria-expanded="false">
                      {canAccess("/pickup-performance") && (
                      <li>
                        <Link to="/pickup-performance">{props.t("Pickup Performance")}</Link>
                      </li>
                      )}
                      {canAccess("/status-update") && (
                      <li>
                        <Link to="/status-update">{props.t("Status Update")}</Link>
                      </li>
                      )}

                      {canAccess("/cd-update") && (
                      <li>
                        <Link to="/cd-update">{props.t("CD Update")}</Link>
                      </li>
                      )}
                      {canAccess("/customer-performance") && (
                      <li>
                        <Link to="/customer-performance">{props.t("Customer Performance")}</Link>
                      </li>
                      )}
                      {canAccess("/performance-report") && (
                      <li>
                        <Link to="/performance-report">{props.t("Performance Report")}</Link>
                      </li>
                      )}
                      {/* <li>
                        <Link to="/status-update-audit">{props.t("Status Update Audit")}</Link>
                      </li> */}

                      {/* <li>
                        <Link to="/attempt-wise-delivery-performance">{props.t("Attempt-wise Delivery Performance")}</Link>
                      </li> */}
                    </ul>
                  </li>
                  )}
                  {canAccessStatusUpdateAudit && (
                  <li>
                    <Link to="/status-update-audit">{props.t("Status Update Audit")}</Link>
                  </li>
                  )}
                  {canAccessProductivityReport && (
                  <li>
                    <Link to="/productivity-report">{props.t("Productivity Report")}</Link>
                  </li>
                  )}
                </ul>
              </li>
            }

            {/* OPS Reports */}
            {
              canAccessOpsReports && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-desktop"></i>
                  <span>{props.t("OPS Reports")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {canAccess("/pending-report") && (
                  <li>
                    <Link to="/pending-report">{props.t("Pending Report")}</Link>
                  </li>
                  )}
                  {canAccess("/mis-report") && (
                  <li>
                    <Link to="/mis-report">{props.t("MIS Run")}</Link>
                  </li>
                  )}
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
              canAccessCustomers && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-user"></i>
                  <span>{props.t("Customers")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {canAccess("/user-list") && (
                  <li>
                    <Link to="/user-list">{props.t("Customer List")}</Link>
                  </li>
                  )}

                  {/*   need to deside were to keep till that time keep  it  in admin */}
                  {/* <li>
                    <Link to="/customer_pincode">{props.t("Customer Picode")}</Link>
                  </li> */}
                  {canAccess("/customer-rate-data") && (
                  <li>
                    <Link to="/customer-rate-data">{props.t("Rate Data")}</Link>
                  </li>
                  )}
                  {canAccess("/retail-pincode") && (
                  <li>
                    <Link to="/retail-pincode">{props.t("Retail Pincode")}</Link>
                  </li>
                  )}
                  {canAccess("/franchise-pincode") && (
                  <li>
                    <Link to="/franchise-pincode">{props.t("Franchise Pincode")}</Link>
                  </li>
                  )}
                  {canAccess("/corporate-pincode") && (
                  <li>
                    <Link to="/corporate-pincode">{props.t("Corporate Pincode")}</Link>
                  </li>
                  )}

                  {/*  rate datas */}
                  {canAccess("/corporate-rate-data") && (
                  <li>
                    <Link to="/corporate-rate-data">{props.t("Corporate Rate Data")}</Link>
                  </li>
                  )}
                  {canAccess("/retail-rate-data") && (
                  <li>
                    <Link to="/retail-rate-data">{props.t("Retail Rate Data")}</Link>
                  </li>
                  )}
                  {canAccess("/franchise-rate-data") && (
                  <li>
                    <Link to="/franchise-rate-data">{props.t("Franchise Rate Data")}</Link>
                  </li>
                  )}
                  {canAccess("/intl-rate-data") && (
                  <li>
                    <Link to="/intl-rate-data">{props.t("International Rates")}</Link>
                  </li>
                  )}
                  {canAccess("/intl-pincode") && (
                  <li>
                    <Link to="/intl-pincode">{props.t("International Pincodes")}</Link>
                  </li>
                  )}
                  {/* yet to show */}
                  {/* <li>
                    <Link to="/int-rate-data">{props.t("INTL Rate Upload")}</Link>
                  </li> */}
                </ul>
              </li>
            }

            {
              canAccessIntlBilling && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-globe"></i>
                  <span>{props.t("International Billing")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {canAccess("/intl-rate-data") && (
                  <li>
                    <Link to="/intl-rate-data">{props.t("International Rates")}</Link>
                  </li>
                  )}
                  {canAccess("/intl-pincode") && (
                  <li>
                    <Link to="/intl-pincode">{props.t("International Pincodes")}</Link>
                  </li>
                  )}
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
                    {canAccess("/service-provider-booking") && (
                    <li>
                      <Link to="/service-provider-booking">{props.t("Service Provider Booking")}</Link>
                    </li>
                    )}
                    {/* <li>
                      <Link to="/sales-booking">{props.t("Sales Booking")}</Link>
                    </li> */}
                  </ul>
                </li>
              </>
            }

            {
              canAccessInvoices &&
              <>


                {/* invoices */}
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-file"></i>
                    <span>{props.t("Invoices")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {canAccess("/franchise_invoice") && (
                    <li>
                      <Link to="/franchise_invoice">{props.t("Franchise Billing")}</Link>
                    </li>
                    )}
                    {canAccess("/manual_invoice") && (
                    <li>
                      <Link to="/manual_invoice">{props.t("Manual Billing")}</Link>
                    </li>
                    )}
                    {canAccess("/corporate-billing") && (
                    <li>
                      <Link to="/corporate-billing">{props.t("Corporate Bills")}</Link>
                    </li>
                    )}
                    {/* edit_invoice */}
                    {canAccess("/edit_invoice") && (
                    <li>
                      <Link to="/edit_invoice">{props.t("Download Invoices")}</Link>
                    </li>
                    )}
                    {canAccess("/mark-invoice-no") && (
                    <li>
                      <Link to="/mark-invoice-no">{props.t("Mark Invoice Number")}</Link>
                    </li>
                    )}
                  </ul>
                </li>
              </>
            }

            {
              (isAdmin || canAccess("/delhivery-warehouse")) &&
                <li>
                  <Link to="/delhivery-warehouse" className="has">
                    <i className="bx bx-package"></i>
                    <span>{props.t("Delhivery Warehouse")}</span>
                  </Link>
                </li>
            }

            {/*  payment details */}
            {
              (isAdmin || canAccess("/payment-deatils")) &&
                <li>
                  <Link to="/payment-deatils" className="has">
                    <i className='bx bx-credit-card'></i>
                    <span>{props.t("Payment Details")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccessRevenue) &&
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-file"></i>
                    <span>{props.t("Revenue")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {/* <li>
                      <Link to="/revenue-daily-report">{props.t("Revenue Report")}</Link>
                    </li> */}
                    {canAccess("/revenue-report") && (
                    <li>
                      <Link to="/revenue-report">{props.t("Old Revenue Report")}</Link>
                    </li>
                    )}
                    {canAccess("/daily-revenue") && (
                    <li>
                      <Link to="/daily-revenue">{props.t("Daily Revenue")}</Link>
                    </li>
                    )}
                    {canAccess("/mis-tally") && (
                    <li>
                      <Link to="/mis-tally">{props.t("MIS Tally")}</Link>
                    </li>
                    )}
                    {canAccess("/cod-report") && (
                    <li>
                      <Link to="/cod-report">{props.t("COD Report")}</Link>
                    </li>
                    )}
                  </ul>
                </li>
            }

            {
              canAccessIntlReport && <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-world"></i>
                  <span>{props.t("International Report")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {canAccess("/international-mis-report") && (
                  <li>
                    <Link to="/international-mis-report">{props.t("MIS Report")}</Link>
                  </li>
                  )}
                  {canAccess("/international-dimension-change-log") && (
                  <li>
                    <Link to="/international-dimension-change-log">{props.t("Dimension Change Log")}</Link>
                  </li>
                  )}
                </ul>
              </li>
            }

            {
              (isAdmin || canAccessBilling) &&
              <li>
                <Link to="/#" className="has-arrow">
                  <i className="bx bx-receipt"></i>
                  <span>{props.t("Billing")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  {canAccess("/bill-master") && (
                  <li>
                    <Link to="/bill-master">{props.t("Customer Billing")}</Link>
                  </li>
                  )}
                  {canAccess("/shipment-billing") && (
                  <li>
                    <Link to="/shipment-billing">{props.t("Shipment Billing")}</Link>
                  </li>
                  )}
                  {canAccess("/billing-working") && (
                  <li>
                    <Link to="/billing-working">{props.t("Billing Working")}</Link>
                  </li>
                  )}
                  {canAccess("/billing-automation") && (
                  <li>
                    <Link to="/billing-automation">{props.t("Billing Automation")}</Link>
                  </li>
                  )}
                  {canAccess("/invoice-flow") && (
                  <li>
                    <Link to="/invoice-flow">{props.t("Invoice Flow")}</Link>
                  </li>
                  )}
                  {canAccess("/all-booking") && (
                  <li>
                    <Link to="/all-booking">{props.t("All Booking")}</Link>
                  </li>
                  )}
                </ul>
              </li>
            }

            {
              (isAdmin || canAccess("/update-weight")) &&
              <li>
                <Link to="/update-weight">
                  <i className="bx bx-ruler"></i>
                  <span>{props.t("Update Weight")}</span>
                </Link>
              </li>
            }

            {
              (isAdmin || canAccessTripManagement) &&
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-map-alt"></i>
                    <span>{props.t("Trip Management")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {canAccess("/employee-attendance") && (
                    <li>
                      <Link to="/employee-attendance">{props.t("Employee Trip Details")}</Link>
                    </li>
                    )}
                    {canAccess("/trip-detail") && (
                    <li>
                      <Link to="/trip-detail">{props.t("Ops Trip Management")}</Link>
                    </li>
                    )}
                  </ul>
                </li>
            }

            {
              showCodReconciliation &&
                <li>
                  <Link to="/cod-reconciliation" className="has">
                    <i className="bx bx-money"></i>
                    <span>{props.t("COD Reconciliation")}</span>
                  </Link>
                </li>
            }

            {
              showPopReconciliation &&
                <li>
                  <Link to="/pop-reconcilation" className="has">
                    <i className="bx bx-shuffle"></i>
                    <span>{props.t("POP Reconciliation")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/auto-reconciliation")) &&
                <li>
                  <Link to="/auto-reconciliation" className="">
                    <i className="bx bx-sync"></i>
                    <span>{props.t("Auto Reconciliation")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/cancel-shipments")) &&
                <li>
                  <Link to="/cancel-shipments" className="">
                    <i className="bx bx-x-circle"></i>
                    <span>{props.t("Cancel Shipments")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/automated-mis")) &&
                <li>
                  <Link to="/automated-mis" className="">
                    <i className="bx bx-spreadsheet"></i>
                    <span>{props.t("Automated MIS")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/raw-mis")) &&
                <li>
                  <Link to="/raw-mis" className="">
                    <i className="bx bx-table"></i>
                    <span>{props.t("Raw MIS")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccessOpsDisputes) &&
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-error-circle"></i>
                    <span>{props.t("Ops Disputes")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {canAccess("/ops-disputes/stale") && (
                    <li>
                      <Link to="/ops-disputes/stale">{props.t("Stale Shipments")}</Link>
                    </li>
                    )}
                    {canAccess("/ops-disputes") && (
                    <li>
                      <Link to="/ops-disputes">{props.t("Disputes")}</Link>
                    </li>
                    )}
                    {canAccess("/ops-disputes/lost") && (
                    <li>
                      <Link to="/ops-disputes/lost">{props.t("Lost Dashboard")}</Link>
                    </li>
                    )}
                  </ul>
                </li>
            }

            {
              (isAdmin || canAccess("/awb-print")) &&
                <li>
                  <Link to="/awb-print" className="has">
                    <i className="bx bx-printer"></i>
                    <span>{props.t("AWB Label Print")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/inscan-weight")) &&
                <li>
                  <Link to="/inscan-weight" className="has">
                    <i className="bx bx-ruler"></i>
                    <span>{props.t("InScan Weight")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/rto-approval")) &&
                <li>
                  <Link to="/rto-approval" className="has">
                    <i className="bx bx-check-shield"></i>
                    <span>{props.t("RTO Approval")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/tracking")) &&
                <li>
                  <Link to="/tracking" className="has">
                    <i className="bx bx-search-alt-2 "></i>
                    <span>{props.t("Track AWB")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/itrack")) &&
                <li>
                  <Link to="/itrack" className="has">
                    <i className="bx bx-barcode"></i>
                    <span>{props.t("ITrack")}</span>
                  </Link>
                </li>
            }

            {
              (isAdmin || canAccess("/privileges")) &&
                <li>
                  <Link to="/#" className="has-arrow">
                    <i className="bx bx-shield-quarter"></i>
                    <span>{props.t("Privileges")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    {
                      (isAdmin || canAccess("/privileges")) &&
                        <li>
                          <Link to="/privileges">{props.t("OPS Privileges")}</Link>
                        </li>
                    }
                    {
                      isAdmin &&
                        <li>
                          <Link to="/admin-privileges">{props.t("Admin Privileges")}</Link>
                        </li>
                    }
                  </ul>
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
