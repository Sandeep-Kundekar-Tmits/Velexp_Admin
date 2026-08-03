// GET API
//
// Thin adapter over src/lib/http. The public shape — { apifunc, data,
// loading, error } and apifunc(url) — is unchanged, so all ~98 call sites
// keep working untouched. Auth now comes from the http client rather than
// the removed global window.fetch patch.
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";
import ToasterProvider from "@/helpers/ToasterProvider";

export const useGetApiCall = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { ErrorToaster } = ToasterProvider();

  const apifunc = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { ok, data: result } = await rawRequest(url, { method: "GET" });

      if (!ok) {
        // Preserved: toast, then throw so the caller receives null.
        ErrorToaster(result?.error);
        throw new Error(result?.message || "GET request failed");
      }

      setData(result);
      return result;
    } catch (err) {
      console.log(err, "err");
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};
