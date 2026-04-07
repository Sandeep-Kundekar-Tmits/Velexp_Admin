import { useState, useCallback } from 'react';

export const useDeleteApiCall = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apifunc = useCallback(async (url, body = null) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const options = {
                method: 'DELETE',
                credentials: 'include',
            };

            if (body) {
                options.headers = {
                    'Content-Type': 'application/json',
                };
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            
            const status = response.status;

            if (status === 204) {
                // No content expected for 204
                return true;
            }

            // Only try to parse JSON if there's content or it's not a success status with no body
            let result = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            }

            if (!response.ok) {
                const errorMessage = result?.message || result?.msg || result?.error || `DELETE request failed with status ${status}`;
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