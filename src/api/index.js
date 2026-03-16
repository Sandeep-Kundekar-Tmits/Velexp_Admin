// const BASE_URL = "http://192.168.1.151:8000"
// const BASE_URL = "https://velexp.com"
const BASE_URL = "http://velexp.com:8000"
// const BASE_URL = "https://velexp.com"
// const BASE_URL = "http://192.168.1.166:8000"
// const BASE_URL = "http://103.108.57.51:8001"

// const BASE_URL = "http://192.168.1.152:8000"
// use for incryption and decryption
export const SECRET_KEY = "Velexp.admin"
// login api
export const LOGIN_API_URL = `${BASE_URL}/api_login/`
// get all users  
export const GET_USER_API = `${BASE_URL}/users`  // GET_USER_API/{id}  to get perticular user
// get the filtered Product list
export const GET_FILTERED_PRODUCT_LIST = `${BASE_URL}/accounts-created-by/filter/` // post api with logged in user id
// change the user active status
export const UPDATE_ACTIVE_STATUS = `${BASE_URL}/users/change-account-status/` // POST
// updated get All User List
export const GET_ALL_USER_LIST = `${BASE_URL}/users/created-users/`
//post the user 
export const POST_USER_API = `${BASE_URL}/users/`

//  update user
export const UPDATE_USER_API = `${BASE_URL}/users`

// getting velexp address
export const GET_ADDRESS = `${BASE_URL}/company_address/`

// verify the awb no

export const VERIFY_AWB = `${BASE_URL}/verify-awb/`
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

// Attempt wise delivary report
// export const GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/attempt_strike_rate/` // POST
export const GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/operations_delivery_attempt_strike_rate/` // POST
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT = `${BASE_URL}/reports/attempt_strike_rate_customer/` // POST
// 
export const CUSTOMER_GET_ATTEMPT_WISE_DELIVARY_REPORT_CLONE = `${BASE_URL}/reports/customer_delivery_attempt_strike_rate/` // POST

//reports/spd_operations_performance/
// export const PUD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/pud_operations_performance/`
export const PUD_OPERATION_PERFORMANCE = `${BASE_URL}/reports/operations_pickup_strike_rate/`

// reports/ofd_operations_performance/
export const OFD_OPERATIONS_PERFORMANCE = `${BASE_URL}/reports/ofd_operations_performance/`

// pickup performance report
export const GET_PICKUP_PERFORMANCE = `${BASE_URL}/pickup_performance_report/`


// customer performance fdsr
export const GET_CUSTOMER_PERFORMANCE_FDSR = `${BASE_URL}/reports/pud_spd_performance/`
// 
export const GET_CUSTOMER_PERFORMANCE_FDSR_CLONE = `${BASE_URL}/reports/customer_delivery_strike_rate/`

// customer performance fpsr
export const GET_CUSTOMER_PERFORMANCE_FPDR = `${BASE_URL}/reports/customer_pickup_strike_rate/`
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
// /employee_odometer filter
export const EMPLOYEE_ODOMETER_FILTER = `${BASE_URL}/api/employee/employee_odometer/filter/`


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


//domestic-history/details/
export const GET_DOMESTIC_HISTORY_DETAILS = `${BASE_URL}/domestic-history/details/` // post with payload {awbno: "1234567890"}
// track awb
export const TRACK_AWB = `${BASE_URL}/track_awb/` // get /1234567890
// update customer service remark 
export const UPDATE_CUSTOMER_SERVICE_REMARK = `${BASE_URL}/update-customer-service-remark/` // POST
// bulk RTS status update
export const BULK_RTS_STATUS_UPDATE = `${BASE_URL}/bulk-RTS-status-update/` // POST 
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

