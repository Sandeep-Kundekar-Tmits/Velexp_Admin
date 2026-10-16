/**
 * Sidebar menu definition.
 *
 * Extracted verbatim from the 1,013-line hardcoded SidebarContent.jsx, whose
 * commented-out entries were excluded, so the rendered menu is unchanged.
 *
 * Why this is a data file rather than being read from the privileges tree:
 * the backend Menu tree carries access grants (has_fullacess/can_view/etc.
 * per node) but the sidebar also needs presentation concerns -- icon,
 * nesting, ordering, one-off kill-switches (`hidden`), the `superUserOnly`
 * gate -- that don't belong in an access-control payload. Structure
 * therefore lives here and is FILTERED by privileges at render time: a
 * superuser sees everything, an admin sees everything except the
 * Privileges group, everyone else sees exactly what their privileges tree
 * grants (see permissions.js for the exact bypass rules).
 *
 * scripts/menuDiff.js verifies this stays in sync with the routes (65/65).
 *
 * Shape:
 *   { label, icon?, url }                      leaf
 *   { label, icon?, children: [...] }          expandable group
 *   { ..., superUserOnly: true }                leaf hidden unless
 *                                                is_superuser === true, on top
 *                                                of (not instead of) the
 *                                                is_admin/privileges check
 *                                                every leaf already gets
 */
export const MENU = [
  {
    label: "Add POD",
    icon: "bx bx-upload",
    url: "/add-pod"
  },
  {
    label: "Reports",
    icon: "bx bx-file",
    children: [
      {
        label: "Operation Performance",
        children: [
          {
            label: "Delivery Strike Rate (FDSR)",
            url: "/last-mile-operation"
          },
          {
            label: "Pickup Strike Rate (FPSR)",
            url: "/first-mile-operation"
          },
          {
            label: "Attempt-wise Delivery Performance",
            url: "/attempt-wise-delivery-performance"
          },
          {
            label: "Operation Performance Report",
            url: "/operation-performance"
          },
          {
            label: "OFD Performance (FASR)",
            url: "/ofd-operations-performance"
          },
          {
            label: "Attempt Wise Pickup Performance",
            url: "/operation-attempt-wise-pickup-performance"
          }
        ]
      },
      {
        label: "Customer Performance",
        children: [
          {
            label: "Delivery Strike Rate (FDSR)",
            url: "/last-mile-customer-performance"
          },
          {
            label: "Pickup Strike Rate (FPSR)",
            url: "/first-mile-customer-performance"
          },
          {
            label: "Attempt-wise Delivery Performance",
            url: "/customer-attempt-wise-delivery-performance"
          },
          {
            label: "OFD Performance (FASR)",
            url: "/ofd-customer-operations-performance"
          },
          {
            label: "Attempt Wise Pickup Performance",
            url: "/customer-attempt-wise-pickup-performance"
          }
        ]
      },
      {
        label: "Others",
        children: [
          {
            label: "Pickup Performance",
            url: "/pickup-performance"
          },
          {
            label: "Status Update",
            url: "/status-update"
          },
          {
            label: "CD Update",
            url: "/cd-update"
          },
          {
            label: "Customer Performance",
            url: "/customer-performance"
          },
          {
            label: "Performance Report",
            url: "/performance-report"
          }
        ]
      },
      {
        label: "Status Update Audit",
        url: "/status-update-audit"
      },
      {
        label: "Productivity Report",
        url: "/productivity-report"
      },
      {
        label: "Customer Dashboard Report",
        url: "/domestic-mis-report"
      },
      {
        label: "Monthly Report",
        url: "/monthly-report"
      }
    ]
  },
  {
    label: "OPS Reports",
    icon: "bx bx-desktop",
    children: [
      {
        label: "Pending Report",
        url: "/pending-report"
      },
      {
        label: "Pickup Pending Report",
        url: "/pickup-pending-report"
      },
      {
        label: "Mobile App Report",
        url: "/mobile-app-report"
      },
      {
        label: "Status Daily Report",
        url: "/status-daily-report"
      },
      {
        label: "MIS Run",
        url: "/mis-report"
      },
      {
        label: "Admin Booking",
        url: "/admin-booking-download"
      },
      {
        label: "Customer Service",
        url: "/customer-service"
      },
      {
        label: "Customer Service Employee",
        url: "/customer-service-employee"
      }
    ]
  },
  {
    label: "Customers",
    icon: "bx bx-user",
    children: [
      {
        label: "Customer List",
        url: "/user-list"
      },
      {
        label: "Add User",
        url: "/add-user"
      },
      {
        label: "Add Franchisee",
        url: "/add-franchisee"
      },
      {
        label: "Rate Data",
        url: "/customer-rate-data"
      },
      {
        label: "Retail Pincode",
        url: "/retail-pincode"
      },
      {
        label: "Franchise Pincode",
        url: "/franchise-pincode"
      },
      {
        label: "Corporate Pincode",
        url: "/corporate-pincode"
      },
      {
        label: "Corporate Rate Data",
        url: "/corporate-rate-data"
      },
      {
        label: "Corporate Pincode Upload",
        url: "/corporate-pincode-upload"
      },
      {
        label: "Corporate Rate Upload",
        url: "/corporate-rate-upload"
      },
      {
        label: "Retail Rate Data",
        url: "/retail-rate-data"
      },
      {
        label: "Franchise Rate Data",
        url: "/franchise-rate-data"
      },
      {
        label: "International Rates",
        url: "/intl-rate-data"
      },
      {
        label: "International Rate Data",
        url: "/int-rate-data"
      },
      {
        label: "International Pincodes",
        url: "/intl-pincode"
      },
      {
        label: "Customer Product Config",
        url: "/customer-product-config"
      },
      {
        label: "VAS Configuration",
        url: "/vas-config"
      }
    ]
  },
  {
    label: "International Billing",
    icon: "bx bx-globe",
    children: [
      {
        label: "International Rates",
        url: "/intl-rate-data"
      },
      {
        label: "International Pincodes",
        url: "/intl-pincode"
      }
    ]
  },
  {
    label: "Booking",
    icon: "bx bx-book",
    children: [
      {
        label: "Service Provider Booking",
        url: "/service-provider-booking"
      },
      {
        label: "Corporate Booking",
        url: "/corporate-booking"
      },
      {
        label: "Sales Booking",
        url: "/sales-booking"
      }
    ]
  },
  {
    label: "Invoices",
    icon: "bx bx-file",
    children: [
      {
        label: "Franchise Billing",
        url: "/franchise_invoice"
      },
      {
        label: "Corporate Invoice",
        url: "/corporate_invoice"
      },
      {
        label: "Manual Billing",
        url: "/manual_invoice"
      },
      {
        label: "Corporate Bills",
        url: "/corporate-billing"
      },
      {
        label: "Download Invoices",
        url: "/edit_invoice"
      },
      {
        label: "Mark Invoice Number",
        url: "/mark-invoice-no"
      }
    ]
  },
  {
    label: "Delhivery Warehouse",
    icon: "bx bx-package",
    url: "/delhivery-warehouse"
  },
  {
    label: "Payment Details",
    icon: "bx bx-credit-card",
    url: "/payment-deatils"
  },
  {
    label: "Wallet",
    icon: "bx bx-wallet",
    url: "/wallet-manual-credit"
  },
  {
    label: "Vehicle Master",
    icon: "bx bx-car",
    url: "/vehicle-master"
  },
  {
    label: "Daily MIS Report",
    icon: "bx bx-mail-send",
    url: "/daily-mis-report"
  },
  {
    label: "Revenue",
    icon: "bx bx-file",
    children: [
      {
        // The route has always existed and been reachable by URL, but it was
        // the one entry with no node here at all -- so nothing in the sidebar
        // ever led to it. Listed above "Old Revenue Report", which is what its
        // own label says it superseded.
        label: "Revenue Report",
        url: "/revenue-daily-report"
      },
      {
        label: "Old Revenue Report",
        url: "/revenue-report"
      },
      {
        label: "Daily Revenue",
        url: "/daily-revenue"
      },
      {
        label: "MIS Tally",
        url: "/mis-tally"
      },
      {
        label: "COD Report",
        url: "/cod-report"
      }
    ]
  },
  {
    label: "International Report",
    icon: "bx bx-world",
    children: [
      {
        label: "MIS Report",
        url: "/international-mis-report"
      },
      {
        label: "Dimension Change Log",
        url: "/international-dimension-change-log"
      }
    ]
  },
  // Bulk-resets every international account's password in one call. Gated
  // on is_superuser specifically -- is_admin alone must not surface this,
  // see filterMenu's superUserOnly check below.
  {
    label: "International Password Reset",
    icon: "bx bx-key",
    url: "/international-password-reset",
    superUserOnly: true
  },
  // Visible to all logged-in users for now -- restrict with canHardDeleteStatus
  // later, same as Master's own sidebar comment for these two screens.
  {
    label: "Status Update",
    icon: "bx bx-trash",
    children: [
      { label: "SPD Remove", url: "/spd-remove" },
      { label: "RTS Remove", url: "/rts-remove" },
      { label: "Tracking Correction", url: "/tracking-correction" },
      { label: "Wrong AWB", url: "/wrong-awb" }
    ]
  },
  // Combined booking + tracking lookup/correction for one AWB. Gated the same way every
  // other admin tool on this list is -- is_admin/privileges, via the usual canAccess check
  // -- not superUserOnly, since the API accepts is_staff/is_admin/is_superuser alike.
  {
    label: "AWB Admin Lookup",
    icon: "bx bx-search-alt",
    url: "/awb-admin-lookup"
  },
  {
    label: "Billing",
    icon: "bx bx-receipt",
    children: [
      {
        label: "Customer Billing",
        url: "/bill-master"
      },
      {
        label: "Shipment Billing",
        url: "/shipment-billing"
      },
      {
        label: "Billing Working",
        url: "/billing-working"
      },
      {
        label: "Billing Automation",
        url: "/billing-automation"
      },
      {
        label: "Invoice Flow",
        url: "/invoice-flow"
      },
      {
        label: "All Booking",
        url: "/all-booking"
      }
    ]
  },
  {
    label: "Update Weight",
    icon: "bx bx-ruler",
    url: "/update-weight"
  },
  {
    label: "Trip Management",
    icon: "bx bx-map-alt",
    children: [
      {
        label: "Employee Trip Details",
        url: "/employee-attendance"
      },
      {
        label: "Ops Trip Management",
        url: "/trip-detail"
      }
    ]
  },
  {
    // Hidden by a kill-switch in the old sidebar
    // (showCodReconciliation / showPopReconciliation were both `false`).
    hidden: true,
    label: "COD Reconciliation",
    icon: "bx bx-money",
    url: "/cod-reconciliation"
  },
  {
    // Hidden by a kill-switch in the old sidebar
    // (showCodReconciliation / showPopReconciliation were both `false`).
    hidden: true,
    label: "POP Reconciliation",
    icon: "bx bx-shuffle",
    url: "/pop-reconcilation"
  },
  {
    label: "Auto Reconciliation",
    icon: "bx bx-sync",
    url: "/auto-reconciliation"
  },
  {
    label: "Cancel Shipments",
    icon: "bx bx-x-circle",
    url: "/cancel-shipments"
  },
  {
    label: "Automated MIS",
    icon: "bx bx-spreadsheet",
    url: "/automated-mis"
  },
  {
    label: "Raw MIS",
    icon: "bx bx-table",
    url: "/raw-mis"
  },
  {
    label: "Ops Disputes",
    icon: "bx bx-error-circle",
    children: [
      {
        label: "Stale Shipments",
        url: "/ops-disputes/stale",
        hidden: true
      },
      {
        label: "Disputes",
        url: "/ops-disputes"
      },
      {
        label: "Lost Dashboard",
        url: "/ops-disputes/lost",
        hidden: true
      }
    ]
  },
  {
    label: "AWB Label Print",
    icon: "bx bx-printer",
    url: "/awb-print"
  },
  {
    label: "InScan Weight",
    icon: "bx bx-ruler",
    url: "/inscan-weight"
  },
  {
    label: "RTO Approval",
    icon: "bx bx-check-shield",
    url: "/rto-approval"
  },
  {
    label: "Track AWB",
    icon: "bx bx-search-alt-2 ",
    url: "/tracking",
    // Rendered pinned to the bottom of the rail, below the scrollable tree,
    // instead of wherever this sits in the list -- see SidebarNav's `pinned`
    // prop and Sidebar.jsx's .sidebar-pinned row.
    pinned: true
  },
  {
    label: "ITrack",
    icon: "bx bx-barcode",
    url: "/itrack"
  },
  {
    label: "Ops Master",
    icon: "bx bx-buildings",
    children: [
      { label: "Service Centres", url: "/service-centres" },
      { label: "Employee", url: "/employees" },
      { label: "Exit History", url: "/exit-history" },
      { label: "Rider Store Routes", url: "/rider-store-routes" },
      { label: "Pincode Master", url: "/pincode-master" }
    ]
  },
  {
    label: "Privileges",
    icon: "bx bx-shield-quarter",
    children: [
      {
        label: "OPS Privileges",
        url: "/privileges"
      },
      {
        label: "Admin Privileges",
        url: "/admin-privileges"
      }
    ]
  }
];
