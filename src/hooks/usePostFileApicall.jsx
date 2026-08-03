// POST (multipart) API
//
// Thin adapter over src/lib/http. Public shape unchanged, including the
// { data, status } envelope on both success and HTTP failure, and null on
// a thrown error. http never sets Content-Type for FormData, so the browser
// supplies the multipart boundary itself.
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";

const usePostFileApicall = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apifunc = useCallback(async (url, body, toaster = null) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const { ok, data: result } = await rawRequest(url, { method: "POST", body });

      if (!ok) {
        setError(result);
        if (toaster) {
          toaster(false, result?.error || "Request failed");
        }
        return { data: result, status: false };
      }

      setData(result);
      if (toaster) {
        toaster(true, "Request successful");
      }
      return { data: result, status: true };
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      if (toaster) {
        toaster(false, errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};

export default usePostFileApicall;
