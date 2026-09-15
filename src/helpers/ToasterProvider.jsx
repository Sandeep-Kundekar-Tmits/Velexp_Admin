import { toast } from "react-toastify";

/**
 * The app's toast helpers.
 *
 * Deliberately pass no `position` and no `theme`.
 *
 * Both used to be set here per toast -- "top-center" and "light" -- and a
 * per-toast option beats the ToastContainer's. So the container could be
 * configured however you liked and every toast raised through this helper
 * still landed top-centre in the light skin. The container in main.jsx is the
 * single place that decides now.
 */
const ToasterProvider = () => {
    const SucceesToaster = (message) =>
        // toast.success, not bare toast(): the default type renders with no
        // icon and no accent, so a success and a plain notice looked alike.
        toast.success(message, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
        });

    const ErrorToaster = (message) =>
        toast.error(message, {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
        });

    const SuccessToaster = SucceesToaster;

    return {
        SucceesToaster,
        SuccessToaster,
        ErrorToaster,
    };
};

export default ToasterProvider;
