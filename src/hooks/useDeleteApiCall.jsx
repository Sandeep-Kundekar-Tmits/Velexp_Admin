import { useState, useCallback } from 'react';

export const useDeleteApiCall = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apifunc = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(url, { 
                method: 'DELETE', 
                credentials: 'include' 
            });
            
            const status = response.status;

            if (status === 204) {
                // No content expected for 204
                return true;
            }

            // Only try to parse JSON if there's content
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `DELETE request failed with status ${status}`);
            }

            setData(result);
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return { apifunc, data, loading, error };
};