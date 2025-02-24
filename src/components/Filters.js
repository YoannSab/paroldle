import { memo } from 'react';
import { Box, Heading, Stack, Divider, Checkbox, CheckboxGroup, Text } from '@chakra-ui/react';
import { useColors } from '../constants';

// ---------- Filters ----------
const Filters = memo(({
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

  return (
    <Box bg={colors.filtersBg} p={6} borderRadius="3xl" boxShadow="md" mt={6}>
      <Heading size="lg" textAlign="center" mb={4}>
        Filtres
      </Heading>
      <Divider width="80%" borderWidth="2px" borderColor={colors.text} mx="auto" mb={4} />
      <Stack spacing={4}>
        <Box>
          <Text fontWeight="bold" mb={2}>
            Langue
          </Text>
          <CheckboxGroup value={selectedLanguages} onChange={(vals) => setSelectedLanguages(vals)}>
            <Stack direction="row" wrap="wrap">
              {availableLanguages.map((lang) => (
                <Checkbox key={lang} value={lang}>
                  {lang === 'french' ? 'Français' : 'Anglais'}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={2}>
            Décennies
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
        <Box>
          <Text fontWeight="bold" mb={2}>
            Style
          </Text>
          <CheckboxGroup value={selectedStyles} onChange={(vals) => setSelectedStyles(vals)}>
            <Stack direction="row" wrap="wrap">
              {availableStyles.map((style) => (
                <Checkbox key={style} value={style}>
                  {style}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>
        {/* Nouveau groupe de filtres pour l'état de la chanson */}
        <Box>
          <Text fontWeight="bold" mb={2}>
            État de la chanson
          </Text>
          <CheckboxGroup value={selectedStatuses} onChange={(vals) => setSelectedStatuses(vals)}>
            <Stack direction="row" wrap="wrap">
              <Checkbox
                isChecked={filterAvailable}
                onChange={(e) => setFilterAvailable(e.target.checked)}
              >
                Débloquées
              </Checkbox>
              <Checkbox value="not_found">Non trouvées</Checkbox>
              <Checkbox value="hardcore">Trouvées (hardcore)</Checkbox>
              <Checkbox value="normal">Trouvées (normal)</Checkbox>
              <Checkbox value="abandonned">Abandonnées</Checkbox>
            </Stack>
          </CheckboxGroup>
        </Box>
      </Stack>
    </Box>
  );
});

export default Filters;