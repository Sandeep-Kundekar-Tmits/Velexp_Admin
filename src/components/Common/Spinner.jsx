import React, { useEffect } from "react"
import { Spinner } from "@/components/ui";

const Spinners = ({ setLoading }) => {
    return (
        <React.Fragment>
            <Spinner color="primary" className='absolute top-50 start-50' />
        </React.Fragment>
    )
}

export default Spinners;