// POST API
//
// Thin adapter over src/lib/http. Public shape unchanged, including the
// contract that matters most here: on a non-OK response this RETURNS the
// parsed error body rather than throwing or returning null. Call sites
// depend on that.
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";
import ToasterProvider from "@/helpers/ToasterProvider";

const usePostApiCall = (toggle = null, successMessage = null) => {
  const { SucceesToaster, ErrorToaster } = ToasterProvider();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apifunc = useCallback(async (url, body, isFormData = false) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // isFormData is kept for call-site compatibility; http detects
      // FormData itself and omits Content-Type accordingly.
      void isFormData;

      const { ok, data: result } = await rawRequest(url, { method: "POST", body });

      if (!ok) {
        setError(result);
        ErrorToaster(result?.msg || result?.error);
        console.log(result);
        return result;
      }

      setData(result);
      if (successMessage) {
        const toastMessage = successMessage || result?.msg;
        if (toastMessage) {
          SucceesToaster(toastMessage);
        }
      }

      if (toggle) {
        toggle();
      }

      return result;
    } catch (err) {
      ErrorToaster(err?.msg);
      console.log("err", err);
      setError(err?.error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};

export default usePostApiCall;
