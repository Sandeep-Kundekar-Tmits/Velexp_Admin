// PUT API
//
// Thin adapter over src/lib/http. Public shape unchanged, including the
// contract that a non-OK response returns undefined (not the body, not null).
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";
import ToasterProvider from "@/helpers/ToasterProvider";

export const usePutApiCall = (successMessage, toggle = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { SucceesToaster, ErrorToaster } = ToasterProvider();

  const apifunc = useCallback(async (url, body, isFormData = false) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Kept for call-site compatibility; http detects FormData itself.
      void isFormData;

      const { ok, data: result } = await rawRequest(url, { method: "PUT", body });

      if (!ok) {
        setError(result);
        ErrorToaster("Occured Error");
        return;
      }

      SucceesToaster(successMessage);
      if (toggle) {
        toggle();
      }
      setData(result);
      return result;
    } catch (err) {
      console.log(err, "SeletedTitles");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};
