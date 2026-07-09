import PropTypes from 'prop-types';
import React from "react";
import { connect } from "react-redux";
import { useLocation } from "react-router-dom";
import { withTranslation } from "react-i18next";

const ROUTE_TITLES = {
  "/add-pod": "Add POD",
  "/user-list": "Customers",
  "/add-user": "Add User",
  "/edit-user": "Edit User",
  "/customer-rate-data": "Rate Data",
  "/retail-pincode": "Retail Pincode",
  "/franchise-pincode": "Franchise Pincode",
  "/corporate-pincode": "Corporate Pincode",
  "/corporate-rate-data": "Corporate Rate Data",
  "/retail-rate-data": "Retail Rate Data",
  "/franchise-rate-data": "Franchise Rate Data",
  "/intl-rate-data": "International Rates",
  "/intl-pincode": "International Pincodes",
  "/last-mile-operation": "Delivery Strike Rate",
  "/first-mile-operation": "Pickup Strike Rate",
  "/attempt-wise-delivery-performance": "Attempt-wise Delivery",
  "/last-mile-customer-performance": "Delivery Strike Rate",
  "/first-mile-customer-performance": "Pickup Strike Rate",
  "/customer-attempt-wise-delivery-performance": "Attempt-wise Delivery",
  "/pickup-performance": "Pickup Performance",
  "/status-update": "Status Update",
  "/cd-update": "CD Update",
  "/customer-performance": "Customer Performance",
  "/performance-report": "Performance Report",
  "/status-update-audit": "Status Update Audit",
  "/productivity-report": "Productivity Report",
  "/pending-report": "Pending Report",
  "/mis-report": "MIS Run",
  "/revenue-report": "Revenue Report",
  "/daily-revenue": "Daily Revenue",
  "/mis-tally": "MIS Tally",
  "/cod-report": "COD Report",
  "/franchise_invoice": "Franchise Billing",
  "/manual_invoice": "Manual Billing",
  "/corporate-billing": "Corporate Bills",
  "/edit_invoice": "Download Invoices",
  "/mark-invoice-no": "Mark Invoice Number",
  "/bill-master": "Customer Billing",
  "/shipment-billing": "Shipment Billing",
  "/billing-working": "Billing Working",
  "/billing-automation": "Billing Automation",
  "/invoice-flow": "Invoice Flow",
  "/all-booking": "All Booking",
  "/cancel-shipments": "Cancel Shipments",
  "/update-weight": "Update Weight",
  "/delhivery-warehouse": "Delhivery Warehouse",
  "/payment-deatils": "Payment Details",
  "/employee-attendance": "Employee Trip Details",
  "/trip-detail": "Ops Trip Management",
  "/cod-reconciliation": "COD Reconciliation",
  "/pop-reconcilation": "POP Reconciliation",
  "/auto-reconciliation": "Auto Reconciliation",
  "/awb-print": "AWB Label Print",
  "/inscan-weight": "InScan Weight",
  "/rto-approval": "RTO Approval",
  "/tracking": "Track AWB",
  "/itrack": "ITrack",
  "/privileges": "Privileges",
  "/service-provider-booking": "Service Provider Booking",
};

const Header = ({ onMobileToggle }) => {
  const location = useLocation();
  const pageTitle = ROUTE_TITLES[location.pathname] ?? "Velexp";

  return (
    <React.Fragment>
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex align-items-center">
            <button
              type="button"
              onClick={onMobileToggle}
              className="btn btn-sm px-3 font-size-16 header-item"
              id="vertical-menu-btn"
            >
              <i className="fa fa-fw fa-bars" />
            </button>
            <span style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>
              {pageTitle}
            </span>
          </div>
        </div>
      </header>
    </React.Fragment>
  );
};

Header.propTypes = {
  onMobileToggle: PropTypes.func,
};

const mapStatetoProps = state => {
  const { layoutType, leftMenu, leftSideBarType } = state.Layout;
  return { layoutType, leftMenu, leftSideBarType };
};

export default connect(mapStatetoProps, {})(withTranslation()(Header));
