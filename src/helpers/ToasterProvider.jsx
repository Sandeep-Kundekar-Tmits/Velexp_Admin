import { toast } from "react-toastify";

const ToasterProvider = () => {

    const SucceesToaster = (message) => toast(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });

    const ErrorToaster = (message) => toast.error(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
    });
    return {
        SucceesToaster,
        ErrorToaster
    }
}

export default ToasterProvider