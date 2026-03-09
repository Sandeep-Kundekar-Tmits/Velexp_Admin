import { useState, useCallback } from 'react';

const usePostFileApicall = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apifunc = useCallback(async (url, body, toaster = null) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: body,
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result);
                if (toaster) {
                    toaster(false, result?.error || 'Request failed'); // Call toaster with failure state

                }
                return {
                    data: result,
                    status: false
                };
            }

            setData(result);
            if (toaster) {
                toaster(true, 'Request successful'); // Call toaster with success state
            }
            return {
                data: result,
                status: true
            };
        } catch (err) {
            const errorMessage = err.message || 'An unexpected error occurred';
            setError(errorMessage);
            if (toaster) {
                toaster(false, errorMessage); // Call toaster with failure state

            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { apifunc, data, loading, error };
};

export default usePostFileApicall;