// DELETE API
//
// Thin adapter over src/lib/http. Public shape unchanged, including the
// contracts that a 204 returns true, a success with no body returns true,
// and any failure returns false.
import { useCallback, useState } from "react";
import { rawRequest } from "@/lib/http";

export const useDeleteApiCall = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apifunc = useCallback(async (url, body = null) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // parseMode "contentType": these endpoints commonly answer 204 or a
      // non-JSON body, so only parse when the server declares JSON.
      const { ok, status, data: result } = await rawRequest(url, {
        method: "DELETE",
        parseMode: "contentType",
        ...(body ? { body } : {}),
      });

      if (status === 204) {
        // No content expected for 204
        return true;
      }

      if (!ok) {
        const errorMessage =
          result?.message ||
          result?.msg ||
          result?.error ||
          `DELETE request failed with status ${status}`;
        throw new Error(errorMessage);
      }

      setData(result);
      return result || true;
    } catch (err) {
      setError(err.message || "An error occurred");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};
