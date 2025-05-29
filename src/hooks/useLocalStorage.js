// Helper functions pour localStorage - pour éviter les blocages
const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting localStorage item ${key}:`, error);
    return defaultValue;
  }
};

const setLocalStorageItem = (key, value) => {
  // Utilisation d'un setTimeout pour ne pas bloquer le thread principal
  setTimeout(() => {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage item ${key}:`, error);
    }
  }, 0);
};

export { getLocalStorageItem, setLocalStorageItem };