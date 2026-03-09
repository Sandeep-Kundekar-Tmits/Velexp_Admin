// PATCH API
import { useState, useCallback } from 'react';
import ToasterProvider from '../helpers/ToasterProvider';

export const usePutApiCall = (successMessage, toggle = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { SucceesToaster, ErrorToaster } = ToasterProvider()
  const apifunc = useCallback(async (url, body, isFormData = false) => {
    setLoading(true);
    setError(null);
    setData(null);

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
    try {
      const response = await fetch(url, {
        method: 'PUT',  // Changed from PUT to PATCH
        ...options
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result);
        ErrorToaster("Occured Error")
        return
      }

      SucceesToaster(successMessage)
      if (toggle) {
        toggle()
      }
      setData(result);
      return result;
    } catch (err) {
       console.log(err,"SeletedTitles")
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apifunc, data, loading, error };
};