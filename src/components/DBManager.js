import React, { useRef, useCallback } from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const DBManager = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const resetDB = useCallback(() => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('paroldle_'))
      .forEach(key => localStorage.removeItem(key));
  }, []);

  const handleSaveDB = useCallback(() => {
    const data = Object.keys(localStorage)
      .filter(key => key.startsWith('paroldle_'))
      .reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {});
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "paroldle_db_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleLoadDB = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        alert(t("DB loaded successfully"));
        window.location.reload();
      } catch (error) {
        console.error("Error loading DB", error);
        alert(t("Error loading DB"));
      }
    };
    reader.readAsText(file);
  }, [t]);

  return (
    <>
      <Flex gap={[2, 4]} direction={['column', 'row']}>
        <Button colorScheme="red" onClick={() => {
            const confirmed = window.confirm(t("Are you sure you want to reset DB?"));
            if (confirmed) {
              resetDB();
            }
          }}
          size={['sm', 'md']}>
            {t("Reset DB")}
        </Button>
        <Button colorScheme="blue" onClick={handleSaveDB} size={['sm', 'md']}>
          {t("Save DB")}
        </Button>
        <Button colorScheme="green" onClick={handleLoadDB} size={['sm', 'md']}>
          {t("Load DB")}
        </Button>
      </Flex>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </>
  );
};

export default DBManager;
