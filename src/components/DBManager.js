import React, { useRef, useCallback } from 'react';
import { Button, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const DBManager = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const resetDB = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('paroldle_'))
      .forEach((key) => localStorage.removeItem(key));
  };

  const handleSaveDB = useCallback(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('paroldle_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paroldle_db_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleLoadDB = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach((key) => {
          localStorage.setItem(key, data[key]);
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
      <Flex gap={{ base: 2, md: 4 }} direction={{ base: 'column', md: 'row' }}>
        <Button colorScheme="red" onClick={resetDB} size={{ base: 'sm', md: 'md' }}>
          {t("Reset DB")}
        </Button>
        <Button colorScheme="blue" onClick={handleSaveDB} size={{ base: 'sm', md: 'md' }}>
          {t("Save DB")}
        </Button>
        <Button colorScheme="green" onClick={handleLoadDB} size={{ base: 'sm', md: 'md' }}>
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
