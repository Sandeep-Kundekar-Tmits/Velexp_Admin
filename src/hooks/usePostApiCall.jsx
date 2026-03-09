// POST API
import { useState, useCallback } from 'react';
import ToasterProvider from '../helpers/ToasterProvider';

const usePostApiCall = (toggle = null, successMessage = null) => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apifunc = useCallback(async (url, body, isFormData = false) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            let options = {}
            if (isFormData) {
                options = {
                    credentials: 'include',
                    body: body,
                }
            }
            else {
                options = {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                ...options

            });
            const result = await response.json();
            if (!response.ok) {
                setError(result)
                ErrorToaster(result?.msg || result?.error)
                console.log(result)
                return result
            }
            setData(result);
            if (successMessage) {
                const toastMessage = successMessage || result?.msg;
                if (toastMessage) {
                    SucceesToaster(toastMessage);
                }
            }


            if (toggle) {
                toggle()
            }

            return result;
        } catch (err) {
            ErrorToaster(err?.msg)
            console.log("err", err,1123)
            setError(err?.error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { apifunc, data, loading, error };
};

export default usePostApiCall