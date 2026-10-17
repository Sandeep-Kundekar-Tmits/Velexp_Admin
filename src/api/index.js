// Base URL and secret are now env-driven — see src/config/env.js.
// To point at a different backend, set VITE_API_BASE_URL in .env.local
// rather than editing (and accidentally committing) a hardcoded value here.
import { BASE_URL, SECRET_KEY } from "@/config/env";

// Re-exported so the ~3 existing importers of SECRET_KEY keep working.
export { SECRET_KEY }
// login api
export const LOGIN_API_URL = `${BASE_URL}/api_login/`
// refresh access token via SimpleJWT default endpoint
// ASSUMPTION - verify against the real Django urls.py before shipping:
// expects POST { refresh } -> { access, refresh? }
export const TOKEN_REFRESH_API_URL = `${BASE_URL}/api/token/refresh/`
// get all users  
export const GET_USER_API = `${BASE_URL}/users`  // GET_USER_API/{id}  to get perticular user
// get the filtered Product list
export const GET_FILTERED_PRODUCT_LIST = `${BASE_URL}/accounts-created-by/filter/` // post api with logged in user id
// change the user active status
export const UPDATE_ACTIVE_STATUS = `${BASE_URL}/users/change-account-status/` // POST
// updated get All User List
export const GET_ALL_USER_LIST = `${BASE_URL}/users/created-users/`
// Customer 360: every account, booking, wallet movement and dispute for one
// customer name. Takes ?customer_name=<name>&user_id=<logged-in user>.
// Carries the /api prefix, unlike the /users endpoints above.
export const CUSTOMER_360 = `${BASE_URL}/api/accounts/customer-360/`
//post the user
export const POST_USER_API = `${BASE_URL}/users/`

//  update user
export const UPDATE_USER_API = `${BASE_URL}/users`

// getting velexp address
export const GET_ADDRESS = `${BASE_URL}/company_address/`

// verify the awb no

export const VERIFY_AWB = `${BASE_URL}/verify-awb/`
// verify GST number
export const VERIFY_GSTIN = `${BASE_URL}/verify-gstin/`
// app pod
export const ADD_POD = `${BASE_URL}/add-pod/`

// get pod details
export const GET_ALL_POD_DETAILS = `${BASE_URL}/pod-details/`

// get admin booking details (post api)
export const GET_ADMIN_BOOKING_DETAILS = `${BASE_URL}/download_shipments/`

// get all Service provider booking api
export const GET_ALL_SERVICE_PROVIDER_BOOKING = `${BASE_URL}/get_service_provider_bookings/`

// delivary b2c label genaration
export const GET_DELIVARY_B2C_LABEL_GENERATION = `${BASE_URL}/delhivery_b2c_generate_shipping_label/`

// get service center (get)
// export const SERVICE_CENTER = `${BASE_URL}/service_centers/`
export const SERVICE_CENTER = `${BASE_URL}/unique-service-centers/`

// full service center directory, paginated, for search-driven pickers (post {})
export const SERVICE_CENTER_LIST = `${BASE_URL}/service-centers/get-list/`

// service centre master CRUD
export const ADD_SERVICE_CENTRE = `${BASE_URL}/service-centers/` // POST
export const UPDATE_SERVICE_CENTRE = `${BASE_URL}/service-centers/` // PUT {id}/
export const DELETE_SERVICE_CENTRE = `${BASE_URL}/service-centers/` // DELETE {id}/
export const GET_SERVICE_CENTRE_DETAIL = `${BASE_URL}/service-centers/get-detail/` // POST {id}

// Service Centre <-> Pincode mappings. A plain DRF REST resource under
// /api/admin-panel/ -- unlike every endpoint above, which is a bespoke
// "get-list"/POST-envelope action -- so callers read the {ok} flag from
// rawRequest directly instead of relying on a {status:1}/{msg} body shape.
export const SERVICE_CENTRE_PINCODE_LIST = `${BASE_URL}/api/admin-panel/service-center-pincodes/` // GET ?service_center=&active=
export const BULK_ASSIGN_SERVICE_CENTRE_PINCODES = `${BASE_URL}/api/admin-panel/service-center-pincodes/bulk-assign/` // POST {service_center, pincodes, mode, region?, state?}

// Rider -> Store delivery routes (dark store to local store sequencing).
// Same plain DRF REST shape as the pincode mappings above -- {id}/ for a
// single route's PATCH/DELETE, plus a bulk-assign action for a rider's
// whole route in one call.
export const RIDER_STORE_ROUTES = `${BASE_URL}/api/admin-panel/rider-store-routes/` // GET ?employee=&darkstore=&store=&is_active= | POST {employee, darkstore, store, sequence}
export const BULK_ASSIGN_RIDER_STORE_ROUTES = `${BASE_URL}/api/admin-panel/rider-store-routes/bulk-assign/` // POST {employee, darkstore, stores:[{store,sequence}], mode}

// Domestic MIS report -- customer typeahead, then the report itself scoped to that customer.
export const DOMESTIC_MIS_CUSTOMERS = `${BASE_URL}/api/admin-panel/domestic-mis/customers/` // GET ?search= -> {results:[{customer_name,user_id}]}
export const DOMESTIC_MIS_REPORT = `${BASE_URL}/api/admin-panel/domestic-mis/` // POST {user_id, start_date, end_date, filter_status}

// Monthly operational reports. Each is GET ?user_id=&month=YYYY-MM and the
// response IS the xlsx file -- there's no JSON listing endpoint for any of
// these, only a direct download.
export const MONTHLY_REPORT_SPD = `${BASE_URL}/api/admin-reports/monthly/spd/download/`
export const MONTHLY_REPORT_PUD = `${BASE_URL}/api/admin-reports/monthly/pud/download/`
export const MONTHLY_REPORT_LDP = `${BASE_URL}/api/admin-reports/monthly/ldp/download/`
export const MONTHLY_REPORT_SPL_LOST = `${BASE_URL}/api/admin-reports/monthly/spl-lost/download/`

// Wallet manual credit -- an ops/finance admin crediting a customer's wallet
// directly (e.g. for an offline NEFT/UTR payment), plus the history of past
// manual credits for that customer.
export const WALLET_MANUAL_CREDITS = `${BASE_URL}/api/admin-panel/wallet/manual-credits/` // GET ?user_id=&limit=
export const WALLET_MANUAL_CREDIT_CREATE = `${BASE_URL}/api/admin-panel/wallet/manual-credit/` // POST {user_id, amount, reference, remarks}
export const WALLET_TRANSACTIONS = `${BASE_URL}/api/admin-panel/wallet/transactions/` // GET ?user_id=&start_date=&end_date= -- full wallet ledger (all movements), not just manual credits

// Vehicle Master (ops_vendor.VendorVehicle) -- same ViewSet as the Ops surface
// (/vehicle-master/), just accounts.User + IsAdminPanelManager auth instead of
// Employee JWT. Every write (create/update/activate/deactivate/delete) applies
// locally first and ALWAYS succeeds here regardless of the best-effort sync
// out to a third-party trip-management API (Elixia) -- each response's
// result.elixia_sync_status ('synced'/'pending'/'error') + elixia_sync_error
// report that sync's health without ever blocking the write. Delete is a soft
// delete (is_deleted=True); deactivate/activate toggle is_active +
// vehicle_status (AVAILABLE/UNAVAILABLE) without removing the row.
export const VEHICLE_MASTER_API = `${BASE_URL}/api/admin-panel/vehicles/` // GET list ?search=&is_active=&vendor=&preferred_for= | POST create | `${id}/` for GET/PATCH/DELETE(soft)
export const VEHICLE_MASTER_PREFER = (id) => `${BASE_URL}/api/admin-panel/vehicles/${id}/prefer/` // POST {service_center} -- per-SC shortlist, NOT a visibility restriction
export const VEHICLE_MASTER_UNPREFER = (id) => `${BASE_URL}/api/admin-panel/vehicles/${id}/unprefer/` // POST {service_center}
export const VEHICLE_MASTER_ACTIVATE = (id) => `${BASE_URL}/api/admin-panel/vehicles/${id}/activate/` // POST
export const VEHICLE_MASTER_DEACTIVATE = (id) => `${BASE_URL}/api/admin-panel/vehicles/${id}/deactivate/` // POST

// Daily MIS Report -- per-customer scheduled delivery-summary emails (Delivery/
// SPD/SPU/PuneCity/PuneDistrict/Mumbai/ROMH/Gujarat/Ahmedabad summary flags +
// report_name/email/schedule_time). Needs an admin/staff/superuser JWT -- an
// Ops (AuthEmployee) token gets a 403. DELETE is soft: sets is_active=false
// and returns 204, never removes the row; PATCH {is_active:true} undoes it.
export const DELIVERY_SUMMARY_CUSTOMERS = `${BASE_URL}/api/admin-panel/delivery-summary-customers/` // GET list ?search=&is_active=&page=&page_size= (<=200) | POST create | `${id}/` for GET/PATCH/DELETE(soft)

// department master (dropdown source for Employee Management)
export const DEPARTMENT_LIST = `${BASE_URL}/departments/get-list/` // POST {}

// get all regions (get)
export const GET_ALL_REGION = `${BASE_URL}/regions/`

// get missing pod 
export const GET_MISSING_POD = `${BASE_URL}/missing-pod/`


//  get download_customer_service 
export const GET_CUSTOMER_SERVICE = `${BASE_URL}/download_customer_service/`


// get download_customer_service_employee
export const GET_CUSTOMER_SERVICE_EMPLOYEE = `${BASE_URL}/download_customer_service_employee/`

// export const GET_ADMIN_BOOKING_DETAILS = `${BASE_URL}/download_shipments/`

// get rate-data-for-asus

export const GET_RATE_DATA_ASUS = `${BASE_URL}/rate-data-for-asus/`

//  update rate data for asus
export const UPDATE_RATE_DATA_ASUS = `${BASE_URL}/rate-data-for-asus/` // {ID}/

//  Delete rate data for asus
export const DELETE_RATE_DATA_ASUS = `${BASE_URL}/rate-data-for-asus/` // {ID}/

//  upload the bulk for the asus
export const UPLOAD_BULK_RATE_DATA_ASUS = `${BASE_URL}/rate-data-for-asus/bulk-update/`
// ---

//  get Corporate rate data 
export const GET_COPORATE_RATE_DATA = `${BASE_URL}/rate-data-for-corporate/`

// update corporate data rate
export const UPDATE_CORPORATE_DATA_RATE = `${BASE_URL}/rate-data-for-corporate/` //{id}

// delete corporate data rate
export const DELETE_CORPORATE_DATA_RATE = `${BASE_URL}/rate-data-for-corporate/` //{id}

// upload the bulk data in the corporate
export const UPLOAD_BULK_CORPORATE_DATA_RATE = `${BASE_URL}/rate-data-for-corporate/bulk-update/`
// ---


// RATE DATA 

// corporate get all rate datas
export const GET_ALL_CORPORATE_RATE_DATE = `${BASE_URL}/corporate_rate_data/` // GET

// corporate get rate data based on the customer
export const GET_ALL_CUSTOMER_CORPORATE_RATE_DATE = `${BASE_URL}/corporate_rate_data/customer/` // POST
// PAYLOAD:  "customer_name": "MODICARE LTD"

// upload the corporate Rate data
export const UPLOAD_CORPORATE_RATE_DATA = `${BASE_URL}/upload_corporate_rates/` // POST

// import corporate pincode data
export const IMPORT_CORPORATE_PINCODE_DATA = `${BASE_URL}/corporate-billing/import/pincode/` // POST

// import corporate rate data
export const IMPORT_CORPORATE_RATE_DATA = `${BASE_URL}/corporate-billing/import/rates/` // POST

// get customer rates
export const GET_CUSTOMER_RATES = `${BASE_URL}/corporate-billing/customer-rates/` // GET ?customer_id=1
export const GET_SINGLE_CUSTOMER_RATE = `${BASE_URL}/corporate-billing/customer-rates/` // GET {id}/


// get all retail rate date
export const GET_ALL_RETAIL_RATE_DATA = `${BASE_URL}/retail_rate_data/` // GET
// upload  the retail rates
export const UPLOAD_REATIL_RATE_DATA = `${BASE_URL}/upload_retail_rates/`

// get all franchise rate date
export const GET_ALL_FRNCHISE_RATE_DATA = `${BASE_URL}/franchise_rate_data/`
// upload  the franchise rates
export const UPLOAD_FRANCHISE_RATE_DATA_UPLOAD = `${BASE_URL}/upload_franchise_rates/` // post


// get Franchise Rate data
export const GET_FRANCHISE_RATE_DATA = `${BASE_URL}/rate-data-for-franchise/`


// update franchise rate data
export const UPDATE_FRANCHISE_RATE_DATA = `${BASE_URL}/rate-data-for-franchise/` //{id}

// delete franchise rate data
export const DELETE_FRANCHISE_RATE_DATA = `${BASE_URL}/rate-data-for-franchise/`  //{id}

// upload franchise rate data
export const UPLOAD_FRANCHISE_RATE_DATA = `${BASE_URL}/rate-data-for-franchise/bulk-update/`
// ---

//  get retail rata data
export const GET_RETAIL_RATE_DATA = `${BASE_URL}/rate-data-for-retail/`

//  update retail rata data
export const UPDATE_RETAIL_RATE_DATA = `${BASE_URL}/rate-data-for-retail/` //{id}
//  delete retail rata data
export const DELETE_RETAIL_RATE_DATA = `${BASE_URL}/rate-data-for-retail/` //{id}

//  delete retail rata data
export const UPLOAD_RETAIL_RATE_DATA = `${BASE_URL}/rate-data-for-retail/bulk-update/`
// --

// get zone of the rate-data-for-asus
export const GET_RATE_DATE_ZONE = `${BASE_URL}/zones/`

// get PRODUCT of the rate-data-for-asus
export const GET_RATE_DATE_PRODUCT = `${BASE_URL}/products/`

export const GET_FRANCHISE_INVOICE = `${BASE_URL}/franchise_billing_api/`

// upload frachise invoices
export const UPLOAD_FRANCHISE_INVOICE = `${BASE_URL}/franchise_invoice_api/`

// bulk mis-tally upload
export const UPLOAD_MIS_TALLY = `${BASE_URL}/mis-tally/`

// get alll mis tally data
export const GET_MIS_TALLY = `${BASE_URL}/mis-tally/`

//  get all mis tally data to display on the main page
export const GET_MIS_TALLY_MAIN = `${BASE_URL}/mis-tally/group-by-title/`

// get grouped mis Tally data

export const GET_GROUPED_MIS_TALLY = `${BASE_URL}/mis-tally/`


// get all Regions and cost centers of the mis tally
export const GET_ALL_COST_CENTERS_AND_REGIONS = `${BASE_URL}/mis-tally/cost-center-and-region`

// get mis-tally filter-data/
export const GET_MIS_TALLY_FILTER_DATA = `${BASE_URL}/mis-tally/filter-data/`

//  get the filter by title
export const GET_MIS_TALLY_FILTER_BY_TITLE = `${BASE_URL}/mis-tally/filter-detail-by-title/`

//get mis ops data/
export const GET_MIS_OPS_DATA = `${BASE_URL}/get_mis_ops_data/` // post

//get all active passwords

export const GET_ALL_ACTIVE_PASSWORDS = `${BASE_URL}/mis-access-codes/`


//  Edit Envoice apis
// filter invoice

export const FILTER_EDIT_ENVOICE = `${BASE_URL}/pdf_invoice/filter/`                               //from_date=2025-07-01&to_date=2025-07-30&customer_name=IT-TESTINGS

// update the Edit Envoice form

export const UPDATE_EDIT_ENVOICE = `${BASE_URL}/pdf_invoice/`  //${ID}

// delete pdf invoice item elememt

export const DELETE_PDF_ENVOICE_ITEM = `${BASE_URL}/pdf_invoice/`            // /1/delete_item/4/


export const INT_CUSTOMER_RATE_DATA = `${BASE_URL}/rate-data-for-international-customer`

export const GET_INTERNATIONAL_RATE_DATA = `${BASE_URL}/international-ratedata/` //GET

//international-customer-ratedata/customer/
export const GET_INTERNATIONAL_RATE_DATA_CUSTOMER = `${BASE_URL}/international-customer-ratedata/customer/` //POST payload {"customer_name": "IT-TESTINGS"}
// /upload-intl-customer-rates/ upload the international customer rate data
export const UPLOAD_INTERNATIONAL_RATE_DATA_CUSTOMER = `${BASE_URL}/upload-intl-customer-rates/` //POST payload {"customer_name": "IT-TESTINGS"}   
// international pincodes get list
export const GET_INTERNATIONAL_PINCODES = `${BASE_URL}/international-pincodes/` //GET 
// international pincodes upload 
export const UPLOAD_INTERNATIONAL_PINCODES = `${BASE_URL}/upload-intl-pincodes/` //POST payload array of objects
export const DELETE_INTERNATIONAL_PINCODES = `${BASE_URL}/bulk-delete-intl-pincodes/` //POST payload {"pincode_ids": [1,3,4,9,4]}
// update international cutsomer rate data
export const UPDATE_INT_CUSTOMER_RATE_DATA = `${BASE_URL}/rate-data-for-international-customer/`

// international rate data bulk update
export const INT_CUTSOMER_RATE_DATA_UPLOAD = `${BASE_URL}/rate-data-for-international-customer/bulk-update/`

// international rate data country code
export const INT_GET_COUNTRY_CODE = `${BASE_URL}/countries-list/`

// delete international customer rata data
export const DELETE_INT_CUTOMER_RATE_DATA = `${BASE_URL}/rate-data-for-international-customer/`


// get only corporate users
export const CORPORATE_CUSTOMERS_LIST = `${BASE_URL}/corporate_billing_api/`

// corporate billing config
export const CORPORATE_BILLING_CONFIG = `${BASE_URL}/corporate-billing/billing/config/`

// get corporate customer products
export const GET_CORPORATE_CUSTOMER_PRODUCTS = `${BASE_URL}/corporate-billing/billing/products/`

// get corporate customer pincode list
export const GET_CORPORATE_CUSTOMER_PINCODE_LIST = `${BASE_URL}/corporate-billing/customer-pincode-service/`

// corporate billing vas
export const CORPORATE_BILLING_VAS = `${BASE_URL}/corporate-billing/billing/vas/`

// corporate billing sync
export const CORPORATE_BILLING_SYNC = `${BASE_URL}/corporate-billing/billing/sync/`

// corporate billing audit
export const CORPORATE_BILLING_AUDIT = `${BASE_URL}/corporate-billing/billing/audit/`
export const CORPORATE_BILLING_AUDIT_EXCEL = `${BASE_URL}/corporate-billing/billing/audit-excel/`

// corporate billing working runs
export const CORPORATE_BILLING_GENERATE = `${BASE_URL}/corporate-billing/billing/generate/`
export const CORPORATE_BILLING_RUNS = `${BASE_URL}/corporate-billing/billing/runs/`
export const CORPORATE_BILLING_RUNS_BULK_DOWNLOAD = `${BASE_URL}/corporate-billing/billing/runs/bulk-download/` // POST { run_ids: [] }

// corporate billing invoices
export const CORPORATE_INVOICE_UPLOAD_PREVIEW = `${BASE_URL}/corporate-billing/invoices/upload-preview/`
export const CORPORATE_INVOICE_GENERATE = `${BASE_URL}/corporate-billing/invoices/generate/`
export const CORPORATE_INVOICES_LIST = `${BASE_URL}/corporate-billing/invoices/list/`
export const CORPORATE_INVOICE_BASE = `${BASE_URL}/corporate-billing/invoices/` // <id>/, <id>/download-pdf/, <id>/sync-vecom/, <id>/revert-vecom/

// corporate billing booking — update weight (single AWB + bulk excel)
export const CORPORATE_BOOKING_UPDATE_WEIGHT = `${BASE_URL}/corporate-billing/booking/update-weight/`          // POST { awb, weight, remarks, edited_by }
export const CORPORATE_BOOKING_UPDATE_WEIGHT_BULK = `${BASE_URL}/corporate-billing/booking/update-weight-bulk/` // POST { edited_by, remarks, items: [{awb, weight, length, breadth, height}] }

// Billing Automation — batch flows (the three one-click triggers + history)
export const BILLING_BATCH_SYNC_AUDIT = `${BASE_URL}/corporate-billing/billing/batch/sync-audit/`          // POST
export const BILLING_BATCH_GENERATE_WORKING = `${BASE_URL}/corporate-billing/billing/batch/generate-working/` // POST
export const BILLING_BATCH_DIRECT_INVOICE = `${BASE_URL}/corporate-billing/billing/batch/direct-invoice/`    // POST (403 if disabled)
export const BILLING_BATCH_BASE = `${BASE_URL}/corporate-billing/billing/batch/`                              // GET <id>/  (poll)
export const BILLING_BATCH_CANCEL = (id) => `${BASE_URL}/corporate-billing/billing/batch/${id}/cancel/`        // POST
export const BILLING_BATCH_LIST = `${BASE_URL}/corporate-billing/billing/batch/list/`                         // POST
export const BILLING_AUDIT_REPORTS = `${BASE_URL}/corporate-billing/billing/audit-reports/`                   // GET (list / <id>/ / <id>/download/)
export const BILLING_CONFIGURED_CUSTOMERS = `${BASE_URL}/corporate-billing/billing/configured-customers/`      // GET

// Main Pincode Master — canonical pincode/state/city/alias reference data.
// Plain DRF REST resource (not the legacy "get-list"/{status:1} envelope):
// GET list (?q=&state=&city=&zone=&kind=&is_active=&is_metro=&page=&page_size=),
// POST create, `${PINCODE_MASTER_API}<pincode>/` for GET/PATCH/PUT/DELETE
// (?hard=true for a hard delete). State/city are given by NAME on write and
// resolved through aliases server-side (e.g. "Orissa" -> "Odisha"); an
// unknown city is rejected unless create_city=true is also sent.
export const PINCODE_MASTER_API = `${BASE_URL}/corporate-billing/main-pincode-master/`
export const PINCODE_MASTER_BULK_CREATE = `${BASE_URL}/corporate-billing/main-pincode-master/bulk-create/`   // POST {rows:[...], atomic, dry_run, create_city} or a bare list
export const PINCODE_MASTER_BULK_UPDATE = `${BASE_URL}/corporate-billing/main-pincode-master/bulk-update/`   // POST {rows:[{pincode, ...fields}]}
export const PINCODE_MASTER_BULK_UPSERT = `${BASE_URL}/corporate-billing/main-pincode-master/bulk-upsert/`   // POST {rows:[...], atomic, dry_run, create_city} (JSON) or multipart {file, atomic, create_city} (xlsx/csv, max 50,000 rows)
export const PINCODE_MASTER_BULK_DELETE = `${BASE_URL}/corporate-billing/main-pincode-master/bulk-delete/`   // POST {pincodes:[...], hard} -> {affected, not_found, invalid}
export const PINCODE_MASTER_LOOKUP = `${BASE_URL}/corporate-billing/main-pincode-master/lookup/`             // GET ?pincodes=1,2,3 (in-memory cache) or POST {pincodes:[...]} for up to 20,000

export const PINCODE_MASTER_STATES_API = `${BASE_URL}/corporate-billing/main-pincode-master-states/`         // GET list, POST create, `${id}/` for PATCH/DELETE — renaming also updates the copied state name on its pincode rows
export const PINCODE_MASTER_CITIES_API = `${BASE_URL}/corporate-billing/main-pincode-master-cities/`         // GET list ?state=&q=, POST create {state|state_name, name, is_metro}, `${id}/` for PATCH/DELETE
export const PINCODE_MASTER_CITIES_BULK_UPSERT = `${BASE_URL}/corporate-billing/main-pincode-master-cities/bulk-upsert/` // POST {rows:[{state, name, is_metro}], atomic, dry_run}
export const PINCODE_MASTER_ALIASES_API = `${BASE_URL}/corporate-billing/main-pincode-master-aliases/`       // GET list ?alias_type=STATE|CITY, POST create {alias_type, alias, state|city}, `${id}/` for DELETE

// Automated MIS — billed shipments Excel (backend generates the file)
export const BILLED_SHIPMENTS_EXCEL = `${BASE_URL}/corporate-billing/billing/billed-shipments-excel/`          // POST { start_date, end_date } -> Excel blob

// Raw MIS — full shipment report Excel (backend generates the file)
export const FULL_SHIPMENT_REPORT = `${BASE_URL}/corporate-billing/billing/full-shipment-report/`              // GET ?month=&year= -> Excel blob

// corporate billing invoive
export const CORPORATE_BILLING_INVOICE = `${BASE_URL}/corporate_billing_api/`

// corporate billing bulk update
export const CORPORATE_BILLING_BULK_UPDATE = `${BASE_URL}/corporate_invoice_api/`

//get the manual address api (GET API)
export const MANUAL_BILLING_INVOIVCE_ADDRESS = `${BASE_URL}/manual_invoice_api/`

// generate invoice for the manual invoice
export const GENERATE_MANUAL_INVOICE = `${BASE_URL}/manual_invoice_api/`

// reset password api
export const USER_RESET_PASSWORD = `${BASE_URL}/password-reset/`

//reset confirm password api

export const CONFIRM_NEW_PASSWORD = `${BASE_URL}/password-reset-confirm/` // NDQz/cte2tb-47c75762b279509243904d0666a49f6c/


//  revenue update api  POST API
export const UPLOAD_GET_REVENUE_API = `${BASE_URL}/get_revenue_api/`

// live daily revenue (auto-refreshing dashboard) — GET ?date=YYYY-MM-DD
export const REVENUE_LIVE = `${BASE_URL}/reports/revenue_live/`

// daily revenue report — GET ?format=json[&date=YYYY-MM-DD] for table data, GET [?date=YYYY-MM-DD] (no format) for Excel blob
export const REVENUE_DAILY_REPORT = `${BASE_URL}/reports/revenue_daily/export/`


//  default rate data

// get default rate data list (GET REQUIEST)
export const DEFAULT_RATE_DATA = `${BASE_URL}/rate-data-for-international-default/`

// int default bulk update
export const DEFAULT_RATE_DATA_BUILK_UPLOAD = `${BASE_URL}/rate-data-for-international-default/bulk-update/`

// COD report api
export const COD_UPLOAD_REPORTS = `${BASE_URL}/cod_report_api/`

// Pending report api
export const PENDING_UPLOAD_REPORT = `${BASE_URL}/pending_report_api/`


// product list api
export const PRODUCT_LIST = `${BASE_URL}/products/`


//  warehouse apis
export const GET_WAREHOUSE_LIST = `${BASE_URL}/delhivery_warehouse/`

// add warehouse api
export const ADD_NEW_WAREHOUSE = `${BASE_URL}/delhivery_create_warehouse/`


// customer performce 

export const GET_CUSTOMER_PERFORMANCE = `${BASE_URL}/customer_performance_report/`  // POST

// operation performance
export const GET_OPERATION_PERFORMANCE = `${BASE_URL}/reports/operations_performance_report/`
// export const GET_OPERATION_PERFORMANCE = `${BASE_URL}/operations_performance_report/`

//reports/spd_operations_performance/
// export const SPD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/spd_operations_performance/`
export const SPD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/operations_delivery_strike_rate/`
// Backend-generated xlsx for the same report (replaces client-side exportToExcel) -- POST {start_date, end_date, region?, service_center?} as dd-mm-yyyy -> xlsx blob
export const SPD_OPERATION_PERFORMANCE_EXPORT = `${BASE_URL}/reports/operations_delivery_strike_rate/export/`

// Attempt wise delivary report
// export const GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/attempt_strike_rate/` // POST
export const GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/operations_delivery_attempt_strike_rate/` // POST
export const GET_ATTEMPT_WISE_DELIVARY_REPORT_EXPORT = `${BASE_URL}/reports/operations_delivery_attempt_strike_rate/export/` // POST -> xlsx blob
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/attempt_strike_rate_customer/` // POST
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_EXPORT = `${BASE_URL}/reports/attempt_strike_rate_customer/export/` // POST -> xlsx blob
//
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_CLONE = `${BASE_URL}/reports/customer_delivery_attempt_strike_rate/` // POST
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_CLONE_EXPORT = `${BASE_URL}/reports/customer_delivery_attempt_strike_rate/export/` // POST -> xlsx blob

//reports/spd_operations_performance/
// export const PUD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/pud_operations_performance/`
export const PUD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/operations_pickup_strike_rate/`
export const PUD_OPERATION_PERFORMANCE_EXPORT = `${BASE_URL}/reports/operations_pickup_strike_rate/export/` // POST -> xlsx blob

// Attempt wise pickup report -- AttemptWiseOperationPickupReport.jsx used
// GET_ATTEMPT_WISE_DELIVARY_REPORT (operations_delivery_attempt_strike_rate)
// for this screen until now because there was no dedicated pickup-attempt
// endpoint; this is the real one. POST {start_date, end_date (dd-mm-yyyy),
// service_center OR region (list) -- one required}.
export const PICKUP_ATTEMPT_WISE_REPORT = `${BASE_URL}/reports/operations_pickup_attempt_strike_rate/` // POST
export const PICKUP_ATTEMPT_WISE_REPORT_EXPORT = `${BASE_URL}/reports/operations_pickup_attempt_strike_rate/export/` // POST -> xlsx blob

// reports/ofd_operations_performance/
export const OFD_OPERATIONS_PERFORMANCE = `${BASE_URL}/reports/ofd_operations_performance/`

// pickup performance report
export const GET_PICKUP_PERFORMANCE = `${BASE_URL}/pickup_performance_report/`


// customer performance fdsr
export const GET_CUSTOMER_PERFORMANCE_FDSR = `${BASE_URL}/reports/pud_spd_performance/`
// 
export const GET_CUSTOMER_PERFORMANCE_FDSR_CLONE = `${BASE_URL}/reports/customer_delivery_strike_rate/`
export const GET_CUSTOMER_PERFORMANCE_FDSR_CLONE_EXPORT = `${BASE_URL}/reports/customer_delivery_strike_rate/export/` // POST -> xlsx blob

// customer performance fpsr
export const GET_CUSTOMER_PERFORMANCE_FPDR = `${BASE_URL}/reports/customer_pickup_strike_rate/`
export const GET_CUSTOMER_PERFORMANCE_FPDR_EXPORT = `${BASE_URL}/reports/customer_pickup_strike_rate/export/` // POST -> xlsx blob
// export const GET_CUSTOMER_PERFORMANCE_FPDR = `${BASE_URL}/reports/spu_pud_performance/`
// export const GET_CUSTOMER_PERFORMANCE_FPDR = `${BASE_URL}/reports/pud_operations_performance/`

// customer performance fasr
export const GET_CUSTOMER_PERFORMANCE_FASR = `${BASE_URL}/reports/ofp_pud_performance/`

// Get payment api
export const GET_PAYMENT_DEATILS = `${BASE_URL}/get_payment_details/`


//  corporate booking api
export const CORPORATE_BOOKING = `${BASE_URL}/corporate_delhivery_booking/`
// 

//get pickup pincodes
export const GET_ALL_PICKUP_PINCODES = `${BASE_URL}/upload_retail_pincodes/`

// upload pincode api
export const UPLOAD_PINCODES = `${BASE_URL}/upload_retail_pincodes/`

// get the city pincode
export const GET_CITY_PINCODE = `${BASE_URL}/get_city_pincodes/` // POST
// PAYLOAD
// {
//     "user_id": 30,   //or blank when called from index pg.
//     "q": "21"   // input given in select
// }
// ----
// get franchise pincode api
export const GET_ALL_FRANCHISE_PINCODE = `${BASE_URL}/upload_franchise_pincodes/`  // GET
// uploade franchise pincode api
export const UPLOAD_FRANCHISE_PINCODE = `${BASE_URL}/upload_franchise_pincodes/` // POST
// view franchise
export const GET_VIEW_FRANCHISE_PINCODES = `${BASE_URL}/customerPincodeMasterForFranchise/filter/`  // ?customer_name=IBALAJI ENTERPRISES

// get all corporate pincode
export const GET_ALL_CORPORATE_PINCODE = `${BASE_URL}/upload_corporate_pincodes/`

//view corporate pincode
export const GET_VIEW_CORPORATE_PINCODES = `${BASE_URL}/customerPincodeOverride/filter/`

// upload corporate pincode
export const UPLOAD_CORPORATE_PINCODE = `${BASE_URL}/upload_corporate_pincodes/`

// delete the default corporate pincode
export const DELETE_DEFAULT_CORPORATE_PINCODE = `${BASE_URL}/delete_corporate_default_pincodes/`
// payload
// {
//     "pincode_list" : ["111111"] 
// }
// delete the customer corporate pincode
export const DELETE_CUSTOMER_CORPORATE_PINCODE = `${BASE_URL}/delete_corporate_customer_pincodes/`
// payload
// {
//     "customer_id": 1,
//     "pincode_list": []
// }

// delete the defaul franchise pincodes
export const DELETE_DEFAULT_FRANCHISE_PINCODE = `${BASE_URL}/defaultPincodeMasterForFranchise/delete-pincodes/`
//payload
// {

//     "pincode_list": ["111111"]
// }

// delete the customer franchise pincodes
export const DELETE_CUSTOMER_FRANCHISE_PINCODE = `${BASE_URL}/customerPincodeMasterForFranchise/delete-pincodes/`
// playload
// {
//     "customer_id": 30,
//     "pincode_list": ["111111"]
// }

// delete retail pincode
export const DELETE_RETAIL_PINCODE = `${BASE_URL}/pincodeMasterForRetail/delete-pincodes/`
// upload shipment checkpoint
export const UPLOAD_SHIPMENT_CHECKPOINTS = `${BASE_URL}/status_update_report/` // POST
// upload CD update report
export const UPLOAD_CD_UPDATE_REPORT = `${BASE_URL}/cd_update_report/`  // POST

// wallet transaction details
export const GET_WALLET_TRASACTION_DETAILS = `${BASE_URL}/wallet_transactions/filter/`  // GET ?from_date=2025-08-01&to_date=2025-09-30&customer_name=IT-TESTING

// upload invoice api
export const UPLOAD_ALL_MARKED_INVOICES = `${BASE_URL}/invoice_number_update_api/` // POST

// get all POP reconsilation detais
export const GET_POP_RECONSILATION_PAYMENT_REPORT = `${BASE_URL}/pop_payment_report/` // POST 

// pop reconcilation payment confirmation
export const POP_RECONCILATION_PAYMENT_CONFIRMATION = `${BASE_URL}/pop_reconcilation/` // POST


//  get all employees
export const GET_ALL_EMPLOYEE_LIST = `${BASE_URL}/api/employee/employees/`

// employee master CRUD
// POST body: {page: "1", search: "..."}. Response: {count, next, previous,
// results: {message, results: [...]}} -- note results is double-nested,
// an object carrying `message` alongside the actual array, not the array
// itself like most other list endpoints in this file.
// All 5 endpoints below confirmed against the reference implementation
// (Velocity-Ops, src/Api/Index.js) -- several of this file's own previous
// values were wrong (missing the /api/employee/ prefix, or singular
// "employee" instead of "employees").
export const EMPLOYEE_LIST = `${BASE_URL}/api/employee/employees/get-list/` // POST {page, search}
export const GET_EMPLOYEE_DETAIL = `${BASE_URL}/api/employee/employees/get-detail/` // POST {id} -> {result: {...}}
export const ADD_EMPLOYEE = `${BASE_URL}/api/employee/employees/` // POST
export const UPDATE_EMPLOYEE = `${BASE_URL}/api/employee/employees/` // PATCH {id}/
export const DELETE_EMPLOYEE = `${BASE_URL}/api/employee/employees/` // DELETE {id}/
// Mark an employee's exit (resignation/termination) -- sets is_active=false.
// POST {employee_code or id, date_of_exit, remark}. Success: 200
// {"message": "Employee exit recorded successfully", result: {date_of_exit,
// exit_remark, exit_marked_by, exit_marked_at, status: "inactive",
// is_active: false}}. The normal create/update calls above silently ignore
// date_of_exit/exit_remark/exit_marked_by/exit_marked_at -- this is the only
// endpoint that ever writes them.
export const MARK_EMPLOYEE_EXIT = `${BASE_URL}/api/employee/employees/mark-exit/`
// Past exit record(s) for one employee (exited, reversed, exited again...).
// POST {employee_code}. Confirmed response shape: {message, employee_code,
// current_date_of_exit, results: [{id, action: "EXIT" | "REVERSAL",
// date_of_exit, remark, performed_by, performed_at}, ...]}.
export const EMPLOYEE_EXIT_HISTORY = `${BASE_URL}/api/employee/employees/exit-history/`
// Undoes the most recent exit (reactivates the account). POST
// {employee_code, remark} -- writes a "REVERSAL" row into the same history
// EMPLOYEE_EXIT_HISTORY returns.
export const REVERSE_EMPLOYEE_EXIT = `${BASE_URL}/api/employee/employees/reverse-exit/`

// Designation master, for the Employee Info tab's Designation dropdown. Same
// underlying table as the legacy Privileges screen's role list
// (GET_ALL_ROLES = /designations/get-list/), named separately here since the
// two features use it for unrelated purposes.
export const GET_DESIGNATION_LIST = `${BASE_URL}/designations/get-list/` // POST {}


// Ops Trip Management
export const TRIP_ODOMETER_READINGS = `${BASE_URL}/api/trip/odometer/readings/`
export const TRIP_ODOMETER_FILTER = `${BASE_URL}/api/trip/odometer/readings/filter/`
export const TRIP_ODOMETER_LATEST = `${BASE_URL}/api/trip/odometer/readings/latest/`
export const TRIP_ODOMETER_DISTANCE = `${BASE_URL}/api/trip/odometer/readings/distance/`
export const TRIP_ODOMETER_TRIPS = `${BASE_URL}/api/trip/odometer/readings/trips/`


//  get privileges
export const GET_ALL_PRIVILEGES = `${BASE_URL}/role-privileges/` // GET

// get role privileges by role
export const GET_ROLE_PRIVILEGES_BY_ROLE = `${BASE_URL}/role-privileges/by-role/` // GET with query ?role_id=1
// get all roles
export const GET_ALL_ROLES = `${BASE_URL}/designations/get-list/` // POST {}

// save privileges 
export const SAVE_PRIVILEGES = `${BASE_URL}/role-privileges/save/` // POST
// PAYLOAD
// {
//   "role_id":1,
//   "menus": []
// }

// get all privilege menus
export const GET_ALL_MENUS = `${BASE_URL}/menus/` // GET

// delete role privilege
export const DELETE_PRIVILEGE = `${BASE_URL}/role-privileges/delete-all/` // POST
// payload
// {
//     "role_id": 1
// }

// ---- Admin Privileges (role + per-user panel access) ----
// Roles: GET (list, ?search=&is_active=) / POST (create). Detail: `${ADMIN_ROLES_API}${id}/` GET/PUT/PATCH/DELETE
export const ADMIN_ROLES_API = `${BASE_URL}/api/admin-privileges/roles/`

// Menus: GET (list, ?search=&parent_id=&is_active=) / POST (create) body: {link_name, link_url, parent, exc_ord, is_active, show_panel, faicon}.
// Detail: `${ADMIN_MENUS_API}${menu_id}/` GET/PUT/PATCH/DELETE (same link_name/link_url body shape)
export const ADMIN_MENUS_API = `${BASE_URL}/api/admin-privileges/menus/`
export const ADMIN_MENUS_TREE_API = `${BASE_URL}/api/admin-privileges/menus/tree/` // GET -> [{menu_id, menu_name, menu_url, faicon, show_panel, children}] (read-only shape, different field names than the write body above)
export const ADMIN_MENUS_REORDER_API = `${BASE_URL}/api/admin-privileges/menus/reorder/` // POST {items:[{menu_id, exc_ord}]}

// Role Privileges
export const ADMIN_ROLE_PRIVILEGES_API = `${BASE_URL}/api/admin-privileges/role-privileges/` // GET overview
export const ADMIN_ROLE_PRIVILEGES_BY_ROLE_API = `${BASE_URL}/api/admin-privileges/role-privileges/by-role/` // GET ?role_id=
export const ADMIN_ROLE_PRIVILEGES_SAVE_API = `${BASE_URL}/api/admin-privileges/role-privileges/save/` // POST {role_id, menus:[...]}
export const ADMIN_ROLE_PRIVILEGES_REMOVE_MENU_API = `${BASE_URL}/api/admin-privileges/role-privileges/remove-menu/` // POST {role_id, menu_id}
export const ADMIN_ROLE_PRIVILEGES_DELETE_ALL_API = `${BASE_URL}/api/admin-privileges/role-privileges/delete-all/` // POST {role_id}

// User Overrides
export const ADMIN_USER_OVERRIDES_BY_USER_API = `${BASE_URL}/api/admin-privileges/user-overrides/by-user/` // GET ?user_id=
export const ADMIN_USER_OVERRIDES_SAVE_API = `${BASE_URL}/api/admin-privileges/user-overrides/save/` // POST {user_id, menus:[...]}
export const ADMIN_USER_OVERRIDES_REMOVE_MENU_API = `${BASE_URL}/api/admin-privileges/user-overrides/remove-menu/` // POST {user_id, menu_id}
export const ADMIN_USER_OVERRIDES_DELETE_ALL_API = `${BASE_URL}/api/admin-privileges/user-overrides/delete-all/` // POST {user_id}

// User Roles
export const ADMIN_USER_ROLES_API = `${BASE_URL}/api/admin-privileges/user-roles/` // GET list
export const ADMIN_USER_ROLES_ASSIGN_API = `${BASE_URL}/api/admin-privileges/user-roles/assign/` // POST {user_id, role_id}
export const ADMIN_USER_ROLES_REMOVE_API = `${BASE_URL}/api/admin-privileges/user-roles/remove/` // POST {user_id}

// Admin Users search (paginated) ?search=&is_admin=&is_staff=&is_active=&has_role=
export const ADMIN_USERS_SEARCH_API = `${BASE_URL}/api/admin-privileges/admin-users/`

// My Privileges (any authenticated user, resolved role + override tree)
export const MY_PRIVILEGES_API = `${BASE_URL}/api/admin-privileges/my-privileges/`


//domestic-history/details/
export const GET_DOMESTIC_HISTORY_DETAILS = `${BASE_URL}/domestic-history/details/` // post with payload {awbno: "1234567890"}
// track awb
export const TRACK_AWB = `${BASE_URL}/track_awb/` // get /1234567890
// update customer service remark 
export const UPDATE_CUSTOMER_SERVICE_REMARK = `${BASE_URL}/update-customer-service-remark/` // POST
// bulk RTS status update
export const BULK_RTS_STATUS_UPDATE = `${BASE_URL}/bulk-RTS-status-update/` // POST
// bulk RTA excel upload (Bulk RTS Mark) — multipart: file, employee_id, service_center
export const BULK_RTA_UPLOAD = `${BASE_URL}/bulk-rta-upload/` // POST (multipart/form-data)
// get-undelivered-shipments/
export const GET_UNDELIVERED_SHIPMENTS = `${BASE_URL}/get-undelivered-shipments/` // post
//get-delivery-attempts-remarks/
export const GET_DELIVERY_ATTEMPTS_REMARKS = `${BASE_URL}/get-delivery-attempts-remarks/` // Post
// update booking edd
export const UPDATE_BOOKING_EDD = `${BASE_URL}/update-booking-edd/`; // POST payload  '{
//     "awbno": "IT0001562",
//     "new_edd": "2026-03-10",
//     "changed_by": 1,
//     "remark": "Customer requested delay"
// }'


// status update api
export const STATUS_UPDATE = `${BASE_URL}/status_update_report/` // POST

// productivity report api
export const PRODUCTIVITY_REPORT = `${BASE_URL}/reports/productivity-report/` // POST

// all bookings - view (paginated JSON) and export (file download)
export const ALL_BOOKINGS_VIEW = `${BASE_URL}/optimized_bookings/`   // POST - returns paginated JSON
export const ALL_BOOKINGS_EXPORT = `${BASE_URL}/optimized_bookings_export/`       // POST - returns Excel file
export const COD_RECONCILIATION = `${BASE_URL}/public-reconciliation/`;
export const COD_RECONCILIATION_APPROVE = `${BASE_URL}/accountant-approval`;

// ITrack scans
export const ITRACK_SCANS = `${BASE_URL}/itrack/scans/`;

// Ops Disputes
export const OPS_DISPUTES_STALE = `${BASE_URL}/ops/disputes/stale/`
export const OPS_DISPUTES_BASE = `${BASE_URL}/ops/disputes/`
export const OPS_DISPUTES_LOST = `${BASE_URL}/ops/disputes/lost/`
export const OPS_DISPUTES_MARK_DIS = `${BASE_URL}/ops/disputes/mark-dis/`

// Shipment Trace
export const SHIPMENT_TRACE = `https://velexp.com/shipment-trace/`

// Shipment & Bag Tracking (same endpoints as the Velocity-Ops "/tracking" screen)
export const GET_AWB_TRACKING = `${BASE_URL}/awb-tracking/` // POST { awbno } -> { booking_data, track_data: { <awbno>: [...] } }
export const GET_BAG_TRACKING = `${BASE_URL}/bag-tracking/` // POST { bag_no }
export const GET_IN_DETAILED_TRACKING = `${BASE_URL}/detailed-tracking/` // POST { awbno } -> { booking_data, tracking: { <awbno>: { track_data: [...] } } }, each track_data entry can carry bag_data.parent_bag_data.bag_tracking

// Ops pending report
export const GET_OPS_PENDING_REPORT = `${BASE_URL}/api/admin-reports/pending-shipments/`;
export const DOWNLOAD_OPS_PENDING_REPORT = `${BASE_URL}/api/admin-reports/pending-shipments/download/`;

// Pickup Pending Report -- genuinely split by role, unlike the pending-shipments
// pair above (both of which hit /api/admin-reports/ regardless of caller).
// ops-reports is Bearer-scoped to the caller's own mapped service centres (no
// user_id, not paginated); admin-reports is all-India, paginated, and needs an
// explicit user_id. Both enforce a 60-day start_date/end_date span server-side
// and reject end_date without start_date.
export const OPS_PICKUP_PENDING_REPORT = `${BASE_URL}/api/ops-reports/pickup-pending-shipments/`; // POST {service_center?, start_date, end_date, include_wab?}
export const DOWNLOAD_OPS_PICKUP_PENDING_REPORT = `${BASE_URL}/api/ops-reports/pickup-pending-shipments/download/`; // POST same body -> xlsx blob
export const ADMIN_PICKUP_PENDING_REPORT = `${BASE_URL}/api/admin-reports/pickup-pending-shipments/`; // POST {user_id, service_center?, region?, start_date, end_date, page, page_size}
export const DOWNLOAD_ADMIN_PICKUP_PENDING_REPORT = `${BASE_URL}/api/admin-reports/pickup-pending-shipments/download/`; // POST {user_id, start_date, end_date, ...filters} -> xlsx blob

export const GET_ALL_STATUSES = `${BASE_URL}/status/get-list/`;

// MIS Run
export const MIS_RUN = `${BASE_URL}/api/ops-reports/mis-run/`;

// SAR (undelivered shipment removal)
export const RECORD_SAR_STATUS = `${BASE_URL}/undelivered-shipments/record-sar-status/`;

// RTO booking flow — CS sets/clears a shipment flag (RTS_PENDING/RTO_APPROVAL/WRONG_AWB/PRIORITY)
export const BULK_SET_SHIPMENT_FLAG = `${BASE_URL}/bulk-set-shipment-flag/` // POST { awbno_list, shipment_flag, remark, employee_id }

// Wrong AWB workflow — CS flags AWB(s) WRONG_AWB (or clears it) via BULK_SET_SHIPMENT_FLAG
// above; these three round it out: a read-only pre-check, the list of what's currently
// flagged, and recording the real correction once ops has fixed the AWB. The last one only
// succeeds once the AWB is flagged WRONG_AWB, and needs `employee_id`
// (ops_accounts.Employee.id) -- NOT the `user_id` (accounts.User.id) the other three use.
// Different tables; there's no field for Employee.id on the login response, so it's resolved
// via useCurrentEmployeeId (matches the Employee record whose user_name equals the username).
export const CHECK_WRONG_AWB_ELIGIBILITY = `${BASE_URL}/check-wrong-awb-eligibility/` // POST { awbno_list } -> read-only
export const WRONG_AWB_FLAGGED_LIST = `${BASE_URL}/wrong-awb-flagged-list/` // POST {} or { service_center: [ec_code,...] }
export const MANUAL_STATUS_UPDATE = `${BASE_URL}/manual-status-update/` // POST { awbno, status, remark, employee_id }

// Ops: pending/booked RTO screen — response now also includes `rto_approved`
export const PENDING_BOOKED_RTO = `${BASE_URL}/pending_booked_rto/` // POST { service_center, from_date?, to_date? }
// Ops: book the RTO — send a single object (not array) with RTO_booking: true to distinguish from forward bulk booking
export const CORPORATE_BULK_BOOKING = `${BASE_URL}/corporate-bulk-booking/` // POST { RTO_booking, Awbno, rto_scan_awbno, booked_by_id }

// Auto Reconciliation (HO Operations)
export const BANK_STATEMENT_UPLOAD = `${BASE_URL}/bank-statement/upload/`;
export const BANK_STATEMENT_BASE = `${BASE_URL}/bank-statement/`; // GET list; GET {id}/; GET {id}/entries/?status=
export const PENDING_MANIFESTS = `${BASE_URL}/pending-manifests/`;
export const SC_ENTRIES = `${BASE_URL}/sc-entries/`;
export const RECONCILED_HISTORY = `${BASE_URL}/reconciled-history/`;

// COD Pending Report — same admin-reports family as the pickup/pending
// shipment reports elsewhere in this file: needs both Bearer auth and an
// explicit user_id in the body. `search` finds a specific AWB, UTR or
// manifest number regardless of when it was delivered; without it, narrows
// the current 30-day/service-centre browse view by service_center and/or
// employee.
export const COD_PENDING_REPORT = `${BASE_URL}/api/admin-reports/cod-pending/`; // POST {user_id, search?, service_center?, employee?}
export const DOWNLOAD_COD_PENDING_REPORT = `${BASE_URL}/api/admin-reports/cod-pending/download/`; // POST same body -> xlsx blob

// Mobile App Report (status-source-hourly) — same admin-reports family as
// COD Pending above: Bearer auth plus an explicit user_id in the body.
// Hourly breakdown of status updates by source (mobile/desktop/system),
// all-India, filterable by date, service_center (comma list) and region.
// scope: "all" includes every non-OFD status; omitted = post-OFD only.
export const STATUS_SOURCE_HOURLY_REPORT = `${BASE_URL}/api/admin-reports/status-source-hourly/`; // POST {user_id, date?, service_center?, region?, scope?}
export const DOWNLOAD_STATUS_SOURCE_HOURLY_REPORT = `${BASE_URL}/api/admin-reports/status-source-hourly/download/`; // POST same body -> xlsx blob

// Pre-PUD variant of the same report family -- scope is fixed to pre_pud
// server-side (the `scope` param is ignored on these URLs, unlike the
// hourly report above), so there's no scope toggle to send here.
export const STATUS_SOURCE_PREPUD_REPORT = `${BASE_URL}/api/admin-reports/status-source-prepud/`; // POST {user_id, date?, service_center?, region?}
export const DOWNLOAD_STATUS_SOURCE_PREPUD_REPORT = `${BASE_URL}/api/admin-reports/status-source-prepud/download/`; // POST same body -> xlsx blob

// Status Daily Report -- generalized from the old PUD-only report (its
// total_pud/pud_count response fields are now just total/count). GET, not
// POST: ?user_id=&status=CNA,SPD&date=YYYY-MM-DD&region=. Up to 20
// (case-insensitive) status codes, comma-separated; missing/malformed status
// is a 400. Rows with no service center are credited to the pickup-pincode's
// SC for pickup-side codes (SPU/OFP/PUI/PUD/SAO/LDP/FM*) and the drop-
// pincode's SC for everything else, or UNMAPPED if neither matches -- the
// Excel's own "SC Source" column records which rule applied. Cached 30min
// per date+status combo.
export const STATUS_DAILY_REPORT = `${BASE_URL}/api/admin-reports/status-daily/`; // GET
export const DOWNLOAD_STATUS_DAILY_REPORT = `${BASE_URL}/api/admin-reports/status-daily/download/`; // GET same params -> xlsx blob, named "<STATUSES>_Daily_Report_<date>.xlsx"

// Unmatched bank-statement transactions — outstanding-backlog view across all uploads.
// Live on UAT only as of 06 Sep 2026, not yet ported to production (see Velocity-Ops
// testing-docs/unmatched-transactions-api.md). This whole bank-statement flow runs without
// JWT auth, so these intentionally point at the UAT host regardless of VITE_API_BASE_URL —
// swap BANK_STATEMENT_UAT_BASE_URL to BASE_URL once the backend ships this to production.

export const GET_BANK_STATEMENT_ENTRIES = `${BASE_URL}/bank-statement/entries/`; // GET ?status=&days=&page=&page_size=
export const DOWNLOAD_BANK_STATEMENT_ENTRIES = `${BASE_URL}/bank-statement/download-excel/`; // POST {status, days}

export const BULK_CANCEL_BOOKING = `${BASE_URL}/bulk_cancel_booking_api/`;
export const USER_CANCELLATION_REPORT = `${BASE_URL}/user_cancellation_report_api/`;

// International Reports
export const INTERNATIONAL_SHIPMENTS_REPORT = `${BASE_URL}/api/admin-reports/international-shipments/`;

// International AWB dimension/weight change log — GET/POST ?awbno=&from_date=&to_date= (defaults to last 7 days)
export const INTERNATIONAL_DIMENSION_CHANGE_LOG = `${BASE_URL}/api/admin-reports/international-awb-measurements-log/`;

// International password bulk reset — POST { new_password } (admin JWT required)
export const INTERNATIONAL_PASSWORD_BULK_UPDATE = `${BASE_URL}/international-password/bulk-update/`;

// SPD / RTS hard delete — POST { awbno_list: [...], employee_id, remark, apply: true }
export const BULK_HARD_DELETE_SPD_STATUS = `${BASE_URL}/bulk-hard-delete-spd-status/`;
export const BULK_HARD_DELETE_RTS_STATUS = `${BASE_URL}/bulk-hard-delete-rts-status/`;

// Manual Tracking Correction (admin JWT required) — fixes an existing tracking row's
// status/date/service-center in place. No customer SMS/Vecom push fires from this.
export const TRACKING_CORRECTION_INFO = `${BASE_URL}/tracking-correction/info/`; // GET ?awbno=
export const TRACKING_CORRECTION = `${BASE_URL}/tracking-correction/`; // POST { shipment_tracking_id, remark, status?, status_date?, service_center? }

// AWB Admin lookup/correction (admin JWT required) — combined Booking + full tracking
// history for one AWB, plus a booking-field correction endpoint. Same host/path style as
// TRACKING_CORRECTION above (no /ops-tracking/ prefix, unlike the API doc) since that's the
// convention this deployment actually answers on for the sibling tracking-correction routes.
export const AWB_ADMIN_LOOKUP = `${BASE_URL}/awb-admin-lookup/`; // GET ?awbno=
export const AWB_ADMIN_BOOKING_CORRECTION = `${BASE_URL}/awb-admin-lookup/booking-correction/`; // POST { awbno, remark, fields: {...} }
