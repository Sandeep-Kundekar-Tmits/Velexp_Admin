// Corporate / franchise customer list, the same one the Bill Master header dropdown uses.
// Each option: { name, label: "Customer Name - username", id, username, value: customer name }.
import { rawRequest } from "@/lib/http"
import { CORPORATE_CUSTOMERS_LIST } from "../../../api"

// One fetch shared by every dropdown on the page (Transfer and Upload tabs).
let customersPromise = null
export const loadCustomers = () => {
    if (!customersPromise) {
        customersPromise = rawRequest(CORPORATE_CUSTOMERS_LIST, { method: "GET" })
            .then(({ ok, data }) => {
                const users = ok && Array.isArray(data?.user) ? data.user : []
                return users
                    .filter((u) => u?.cust_type?.type_of_cust === "Corporate" || u?.cust_type?.type_of_cust === "Franchise")
                    .map((u) => {
                        const label = `${u?.customer_name || ""} - ${u?.username}`
                        return { name: label, label, id: u?.id, username: u?.username, value: u?.customer_name || u?.username }
                    })
            })
            .catch(() => [])
            .then((list) => {
                if (!list.length) customersPromise = null // empty or failed: try again next time
                return list
            })
    }
    return customersPromise
}
