import { useState, useCallback } from 'react';
import ToasterProvider from '../helpers/ToasterProvider';

export const usePatchApiCall = (successMessage, toggle = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { SucceesToaster, ErrorToaster } = ToasterProvider();

  const apifunc = useCallback(async (url, body, isFormData = false) => {
    setLoading(true);
    setError(null);
    setData(null);

    let options = {};

    if (isFormData) {
      options = {
        credentials: 'include',
        body: body,
      };
    } else {
      options = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };
    }

    try {
      const response = await fetch(url, {
        method: 'PATCH',  // Using PATCH method instead of PUT
        ...options
      });
      const result = await response.json();

      if (!response.ok) {
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
      setError(err.message || 'An error occurred');
      ErrorToaster(err.message || 'An error occurred');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [successMessage, toggle, SucceesToaster, ErrorToaster]);

  return { apifunc, data, loading, error };
};