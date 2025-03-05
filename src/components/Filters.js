import { memo } from 'react';
import { Box, Heading, Stack, Divider, Checkbox, CheckboxGroup, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import { styleEmojis } from '../constants';

// ---------- Filters ----------
const Filters = memo(({
  gameMode,
  availableLanguages,
  availableDecades,
  availableStyles,
  selectedLanguages,
  setSelectedLanguages,
  selectedDecades,
  setSelectedDecades,
  selectedStyles,
  setSelectedStyles,
  filterAvailable,
  setFilterAvailable,
  selectedStatuses,
  setSelectedStatuses,
}) => {
  const colors = useColors();
  const { t } = useTranslation();
  
  return (
    <Box bg={colors.filtersBg} p={6} borderRadius="3xl" boxShadow="md" mt={6}>
      <Heading size="lg" textAlign="center" mb={4}>
        {t("Filters")}
      </Heading>
      <Divider width="80%" borderWidth="2px" borderColor={colors.text} mx="auto" mb={4} />
      <Stack spacing={4}>
        {/* Filtre Langue */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            {t("Language")}
          </Text>
          <CheckboxGroup value={selectedLanguages} onChange={(vals) => setSelectedLanguages(vals)}>
            <Stack direction="row" wrap="wrap">
              {availableLanguages.map((lang) => (
                <Checkbox key={lang} value={lang}>
                  {lang === 'french'
                    ? t("French")
                    : lang === 'italian'
                      ? t("Italian")
                      : lang === 'english'
                        ? t("English")
                        : undefined}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        {/* Filtre Décennies */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            {t("Decades")}
          </Text>
          <CheckboxGroup
            value={selectedDecades.map(String)}
            onChange={(vals) => setSelectedDecades(vals.map(Number))}
          >
            <Stack direction="row" wrap="wrap">
              {availableDecades.map((decade) => (
                <Checkbox key={decade} value={String(decade)}>
                  {decade}s
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        {/* Filtre Style */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            {t("Style")} 
          </Text>
          <CheckboxGroup value={selectedStyles} onChange={(vals) => setSelectedStyles(vals)}>
            <Stack direction="row" wrap="wrap">
              {availableStyles.map((style) => (
                <Checkbox key={style} value={style}>
                  {t(style)} {styleEmojis[style]}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        {/* Filtre État de la chanson */}
        { gameMode !== 'battle' && (
        <Box>
          <Text fontWeight="bold" mb={2}>
            {t("Song status")}
          </Text>
          <CheckboxGroup value={selectedStatuses} onChange={(vals) => setSelectedStatuses(vals)}>
            <Stack direction="row" wrap="wrap">
              <Checkbox
                isChecked={filterAvailable}
                onChange={(e) => setFilterAvailable(e.target.checked)}
              >
                {t("Unlocked")}
              </Checkbox>
              <Checkbox value="not_found">{t("Not found")}</Checkbox>
              <Checkbox value="hardcore">{t("Found (hardcore)")}</Checkbox>
              <Checkbox value="normal">{t("Found (normal)")}</Checkbox>
              <Checkbox value="abandonned">{t("Abandoned")}</Checkbox>
            </Stack>
          </CheckboxGroup>
        </Box>
        )}
      </Stack>
    </Box>
  );
});

export default Filters;