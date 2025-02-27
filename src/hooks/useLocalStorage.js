import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue, parseJson = false) => {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return parseJson ? JSON.parse(stored) : stored;
    }
    return initialValue;
  });

  useEffect(() => {
    if (parseJson) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  }, [key, value, parseJson]);

  return [value, setValue];
};

export default useLocalStorage;
