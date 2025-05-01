import { memo, useMemo } from 'react';
import { 
  Box, 
  Heading, 
  Stack, 
  Divider, 
  Checkbox, 
  CheckboxGroup, 
  Text, 
  useBreakpointValue 
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import useColors from '../hooks/useColors';
import { styleEmojis } from '../constants';

// Composants optimisés pour éviter les re-renders
const LanguageFilter = memo(({ availableLanguages, selectedLanguages, setSelectedLanguages, stackDirection, t }) => (
  <Box>
    <Text fontWeight="bold" mb={2}>
      {t("Language")}
    </Text>
    <CheckboxGroup value={selectedLanguages} onChange={setSelectedLanguages}>
      <Stack direction={stackDirection} wrap="wrap" spacing={2}>
        {availableLanguages.map((lang) => (
          <Checkbox key={lang} value={lang} size={["sm", "md"]}>
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
));

const DecadesFilter = memo(({ availableDecades, selectedDecades, setSelectedDecades, stackDirection }) => {
  const handleChange = useMemo(() => 
    (vals) => setSelectedDecades(vals.map(Number)), 
    [setSelectedDecades]
  );
  
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Decades
      </Text>
      <CheckboxGroup
        value={selectedDecades.map(String)}
        onChange={handleChange}
      >
        <Stack direction={stackDirection} wrap="wrap" spacing={2}>
          {availableDecades.map((decade) => (
            <Checkbox key={decade} value={String(decade)} size={["sm", "md"]}>
              {decade}s
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </Box>
  );
});

const StyleFilter = memo(({ availableStyles, selectedStyles, setSelectedStyles, stackDirection, t }) => (
  <Box>
    <Text fontWeight="bold" mb={2}>
      {t("Style")}
    </Text>
    <CheckboxGroup value={selectedStyles} onChange={setSelectedStyles}>
      <Stack direction={stackDirection} wrap="wrap" spacing={2}>
        {availableStyles.map((style) => (
          <Checkbox key={style} value={style} size={["sm", "md"]}>
            {t(style)} {styleEmojis[style]}
          </Checkbox>
        ))}
      </Stack>
    </CheckboxGroup>
  </Box>
));

const StatusFilter = memo(({ 
  filterAvailable, 
  setFilterAvailable, 
  selectedStatuses, 
  setSelectedStatuses, 
  stackDirection, 
  t 
}) => {
  const handleFilterAvailableChange = useMemo(() => 
    (e) => setFilterAvailable(e.target.checked), 
    [setFilterAvailable]
  );
  
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        {t("Song status")}
      </Text>
      <CheckboxGroup value={selectedStatuses} onChange={setSelectedStatuses}>
        <Stack direction={stackDirection} wrap="wrap" spacing={2}>
          <Checkbox
            isChecked={filterAvailable}
            onChange={handleFilterAvailableChange}
            size={["sm", "md"]}
          >
            {t("Unlocked")}
          </Checkbox>
          <Checkbox value="not_found" size={["sm", "md"]}>{t("Not found")}</Checkbox>
          <Checkbox value="hardcore" size={["sm", "md"]}>{t("Found (hardcore)")}</Checkbox>
          <Checkbox value="normal" size={["sm", "md"]}>{t("Found (normal)")}</Checkbox>
          <Checkbox value="abandonned" size={["sm", "md"]}>{t("Abandoned")}</Checkbox>
        </Stack>
      </CheckboxGroup>
    </Box>
  );
});

// Composant principal
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
  console.log('Filters Rerendered');
  // Utiliser directement les arrays pour les breakpoints plutôt que des objets
  // Cela évite de recalculer à chaque rendu ou redimensionnement
  const padding = useBreakpointValue([3, 3, 6]);
  const stackDirection = useBreakpointValue(["row", "row", "row"]);
  const headingSize = useBreakpointValue(["md", "md", "lg"]);

  // Mémoriser les props pour les sous-composants
  const languageFilterProps = useMemo(() => ({
    availableLanguages,
    selectedLanguages,
    setSelectedLanguages,
    stackDirection,
    t
  }), [availableLanguages, selectedLanguages, setSelectedLanguages, stackDirection, t]);

  const decadesFilterProps = useMemo(() => ({
    availableDecades,
    selectedDecades,
    setSelectedDecades,
    stackDirection
  }), [availableDecades, selectedDecades, setSelectedDecades, stackDirection]);

  const styleFilterProps = useMemo(() => ({
    availableStyles,
    selectedStyles,
    setSelectedStyles,
    stackDirection,
    t
  }), [availableStyles, selectedStyles, setSelectedStyles, stackDirection, t]);

  const statusFilterProps = useMemo(() => ({
    filterAvailable,
    setFilterAvailable,
    selectedStatuses,
    setSelectedStatuses,
    stackDirection,
    t
  }), [filterAvailable, setFilterAvailable, selectedStatuses, setSelectedStatuses, stackDirection, t]);

  return (
    <Box 
      bg={colors.filtersBg} 
      p={padding} 
      borderRadius="3xl" 
      boxShadow="md" 
      mt={[3, 3, 3, 6]} 
      width="100%"
    >
      <Heading size={headingSize} textAlign="center" mb={4}>
        {t("Filters")}
      </Heading>
      <Divider 
        width="80%" 
        borderWidth="2px" 
        borderColor={colors.text} 
        mx="auto" 
        mb={[2, 2, 4]} 
      />
      <Stack spacing={4}>
        <LanguageFilter {...languageFilterProps} />
        <DecadesFilter {...decadesFilterProps} />
        <StyleFilter {...styleFilterProps} />
        {gameMode !== 'battle' && <StatusFilter {...statusFilterProps} />}
      </Stack>
    </Box>
  );
});

export default Filters;