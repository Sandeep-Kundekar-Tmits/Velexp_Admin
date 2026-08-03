// PATCH API
//
// Thin adapter over src/lib/http. Public shape unchanged, including the
// contract that a non-OK response returns undefined.
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";
import ToasterProvider from "@/helpers/ToasterProvider";

export const usePatchApiCall = (successMessage, toggle = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { SucceesToaster, ErrorToaster } = ToasterProvider();

  const apifunc = useCallback(
    async (url, body, isFormData = false) => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        // Kept for call-site compatibility; http detects FormData itself.
        void isFormData;

        const { ok, data: result } = await rawRequest(url, { method: "PATCH", body });

        if (!ok) {
          setError(result);
          ErrorToaster("An error occurred");
          return;
        }

        SucceesToaster(successMessage);
        if (toggle) {
          toggle();
        }
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "An error occurred");
        ErrorToaster(err.message || "An error occurred");
        console.error(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [successMessage, toggle, SucceesToaster, ErrorToaster]
  );

  return { apifunc, data, loading, error };
};
