export const ADD_NEW_USER = "ADD_NEW_USER"
export const ADD_ADDRESSES = "ADD_ADDRESSES"
export const ADD_FRANCHISEE = "ADD_FRANCHISEE"


export const addNewUser = (data) => {
    return {
        type: ADD_NEW_USER,
        payload: data
    }
}


export const addAddresses = (data) => {
    return {
        type: ADD_ADDRESSES,
        payload: data
    }
}


export const addFranchisee = (data) => {
    return {
        type: ADD_FRANCHISEE,
        payload: data
    }
}