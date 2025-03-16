import { memo } from 'react';
import { Box, Heading, Stack, Divider, Checkbox, CheckboxGroup, Text, useBreakpointValue } from '@chakra-ui/react';
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
  const padding = useBreakpointValue({ base: 3, md: 6 });
  const stackDirection = useBreakpointValue({ base: "row", md: "row" });
  const headingSize = useBreakpointValue({ base: "md", md: "lg" });

  return (
    <Box bg={colors.filtersBg} p={padding} borderRadius="3xl" boxShadow="md" mt={{base:3, xl:6}} width="100%">
      <Heading size={headingSize} textAlign="center" mb={4}></Heading>
      {t("Filters")}
      <Divider width="80%" borderWidth="2px" borderColor={colors.text} mx="auto" mb={{ base: 2, md: 4 }} />
      <Stack spacing={4}>
        {/* Filtre Langue */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            {t("Language")}
          </Text>
          <CheckboxGroup value={selectedLanguages} onChange={(vals) => setSelectedLanguages(vals)}>
            <Stack direction={stackDirection} wrap="wrap" spacing={2}>
              {availableLanguages.map((lang) => (
                <Checkbox key={lang} value={lang} size={{ base: "sm", md: "md" }}>
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
            <Stack direction={stackDirection} wrap="wrap" spacing={2}>
              {availableDecades.map((decade) => (
                <Checkbox key={decade} value={String(decade)} size={{ base: "sm", md: "md" }}>
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
            <Stack direction={stackDirection} wrap="wrap" spacing={2}>
              {availableStyles.map((style) => (
                <Checkbox key={style} value={style} size={{ base: "sm", md: "md" }}>
                  {t(style)} {styleEmojis[style]}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        {/* Filtre État de la chanson */}
        {gameMode !== 'battle' && (
          <Box>
            <Text fontWeight="bold" mb={2}>
              {t("Song status")}
            </Text>
            <CheckboxGroup value={selectedStatuses} onChange={(vals) => setSelectedStatuses(vals)}>
              <Stack direction={stackDirection} wrap="wrap" spacing={2}>
                <Checkbox
                  isChecked={filterAvailable}
                  onChange={(e) => setFilterAvailable(e.target.checked)}
                  size={{ base: "sm", md: "md" }}
                >
                  {t("Unlocked")}
                </Checkbox>
                <Checkbox value="not_found" size={{ base: "sm", md: "md" }}>{t("Not found")}</Checkbox>
                <Checkbox value="hardcore" size={{ base: "sm", md: "md" }}>{t("Found (hardcore)")}</Checkbox>
                <Checkbox value="normal" size={{ base: "sm", md: "md" }}>{t("Found (normal)")}</Checkbox>
                <Checkbox value="abandonned" size={{ base: "sm", md: "md" }}>{t("Abandoned")}</Checkbox>
              </Stack>
            </CheckboxGroup>
          </Box>
        )}
      </Stack>
    </Box>
      );
});

      export default Filters;