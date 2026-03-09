// GET API
import { useState, useCallback } from 'react';
import ToasterProvider from '../helpers/ToasterProvider';

export const useGetApiCall = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { ErrorToaster } = ToasterProvider()

    const apifunc = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(url, {
                method: "GET",
                credentials: 'include',
            });
            const result = await response.json();
            
            if (!response.ok) {
                // setError(result)
                ErrorToaster(result?.error)
                throw new Error(result.message || 'GET request failed');
            }

            setData(result);
            return result;
        } catch (err) {
            console.log(err,"err")
            setError(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { apifunc, data, loading, error };
};
